import { Router } from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import EmailAccount from "../models/EmailAccount.js";
import { classifyConversation, CLASSIFICATION_MODEL } from "../services/classifyConversation.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const segments = [
  "all", "open", "done", "assistant", "client", "no-reply", "review",
  "action-required", "waiting", "meetings", "important", "general",
];

router.post("/simulate", requireRole("assistant"), async (req, res) => {
  const { mode, accountId, conversationId, senderName, senderEmail, subject, body } = req.body ?? {};
  if ((mode !== "new" && mode !== "reply") || typeof body !== "string" || !body.trim() || body.length > 2500) {
    return res.status(400).json({ message: "Choose a simulation mode and enter a message under 2,500 characters." });
  }
  try {
    const now = new Date();
    if (mode === "reply") {
      if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ message: "Select a conversation first." });
      const conversation = await Conversation.findOne({ _id: conversationId, assistantId: req.user!._id });
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      const account = await EmailAccount.findOne({ _id: conversation.accountId, assistantId: req.user!._id });
      if (!account) return res.status(404).json({ message: "Demo account not found" });
      const nextMessage = { from: conversation.senderEmail, to: account.email, body: body.trim(), receivedAt: now };
      const messages = [...conversation.messages, nextMessage];
      const classification = await classifyConversation({ subject: conversation.subject, accountEmail: account.email, messages });
      conversation.messages.push(nextMessage);
      conversation.set({ ...classification, classificationSource: "ai", classificationModel: CLASSIFICATION_MODEL, classifiedAt: now,
        suggestedResponsibility: classification.replyResponsibility, suggestedReason: classification.responsibilityReason,
        clientAction: null, clientActionAt: null, isUnread: true, status: "open", lastMessageAt: now });
      await conversation.save();
      return res.json({ conversation, classification, model: CLASSIFICATION_MODEL });
    }
    if (!mongoose.isValidObjectId(accountId) || typeof senderName !== "string" || !senderName.trim()
      || typeof senderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())
      || typeof subject !== "string" || !subject.trim() || subject.length > 200 || senderName.length > 100) {
      return res.status(400).json({ message: "Choose an account and enter a sender, email address, and subject." });
    }
    const account = await EmailAccount.findOne({ _id: accountId, assistantId: req.user!._id, connectionType: "demo" });
    if (!account) return res.status(404).json({ message: "Demo account not found" });
    const message = { from: senderEmail.trim().toLowerCase(), to: account.email, body: body.trim(), receivedAt: now };
    const classification = await classifyConversation({ subject: subject.trim(), accountEmail: account.email, messages: [message] });
    const conversation = await Conversation.create({
      assistantId: req.user!._id, clientId: account.clientId, accountId: account._id,
      senderName: senderName.trim(), senderEmail: message.from, subject: subject.trim(), messages: [message],
      ...classification, classificationSource: "ai", classificationModel: CLASSIFICATION_MODEL, classifiedAt: now,
      suggestedResponsibility: classification.replyResponsibility, suggestedReason: classification.responsibilityReason,
      isUnread: true, status: "open", lastMessageAt: now,
    });
    return res.status(201).json({ conversation, classification, model: CLASSIFICATION_MODEL });
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Could not classify the sample message." });
  }
});

router.get("/", async (req, res) => {
  try {
    const segment = typeof req.query.segment === "string" ? req.query.segment : "all";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const accountId = typeof req.query.accountId === "string" ? req.query.accountId : "";
    if (!segments.includes(segment)) return res.status(400).json({ message: "Unknown segment" });
    if (accountId && !mongoose.isValidObjectId(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const filter: Record<string, unknown> = req.user!.role === "assistant"
      ? { assistantId: req.user!._id }
      : { clientId: req.user!._id, replyResponsibility: "client", status: "open" };
    if (accountId) filter.accountId = accountId;

    if (req.user!.role === "assistant") {
      if (segment !== "all" && segment !== "done") filter.status = "open";
      if (segment === "done") filter.status = "archived";
      if (["assistant", "client", "review"].includes(segment)) filter.replyResponsibility = segment;
      if (segment === "no-reply") filter.replyResponsibility = "none";
      if (["action-required", "waiting", "meetings", "general"].includes(segment)) {
        filter.category = segment;
      }
      if (segment === "important") filter.isImportant = true;
    }

    if (search) {
      const safeSearch = search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { subject: { $regex: safeSearch, $options: "i" } },
        { senderName: { $regex: safeSearch, $options: "i" } },
        { senderEmail: { $regex: safeSearch, $options: "i" } },
        { summary: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const conversations = await Conversation.find(filter)
      .select(req.user!.role === "client" ? "-messages -draftReply" : "-messages")
      .sort({ lastMessageAt: -1 });
    res.json({ conversations });
  } catch {
    res.status(500).json({ message: "Could not load conversations" });
  }
});

router.patch("/:id/client-action", requireRole("client"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid conversation ID" });
  const action = req.body?.action;
  if (action !== "handled" && action !== "takeover") return res.status(400).json({ message: "Choose handled or assistant takeover" });
  try {
    const changes = action === "handled"
      ? { status: "handled", clientAction: "handled", clientActionAt: new Date() }
      : { replyResponsibility: "assistant", responsibilityReason: "The client asked the assistant to take over this conversation.",
          classificationSource: "manual", clientAction: "takeover", clientActionAt: new Date() };
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user!._id, replyResponsibility: "client", status: "open" },
      { $set: changes },
      { new: true, runValidators: true },
    ).select("-draftReply");
    if (!conversation) return res.status(404).json({ message: "This matter is no longer awaiting your response" });
    res.json({ conversation });
  } catch {
    res.status(500).json({ message: "Could not update this matter" });
  }
});

router.patch("/:id", requireRole("assistant"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }
    const body = req.body ?? {};
    const changes: Record<string, unknown> = {};
    if (body.replyResponsibility !== undefined) {
      if (!["assistant", "client", "none", "review"].includes(body.replyResponsibility)) {
        return res.status(400).json({ message: "Invalid reply responsibility" });
      }
      changes.replyResponsibility = body.replyResponsibility;
      changes.responsibilityReason = "Manually assigned by the assistant.";
      changes.classificationSource = "manual";
    }
    if (body.status !== undefined) {
      if (!["open", "handled", "archived"].includes(body.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      changes.status = body.status;
    }
    if (body.category !== undefined) {
      if (!["action-required", "waiting", "meetings", "important", "general"].includes(body.category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      changes.category = body.category;
    }
    if (typeof body.isImportant === "boolean") changes.isImportant = body.isImportant;
    if (typeof body.isUnread === "boolean") changes.isUnread = body.isUnread;
    if (body.draftReply !== undefined) {
      if (typeof body.draftReply !== "string" || body.draftReply.length > 5000) {
        return res.status(400).json({ message: "Reply draft must be under 5,000 characters" });
      }
      changes.draftReply = body.draftReply;
    }
    if (!Object.keys(changes).length) return res.status(400).json({ message: "No changes provided" });

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, assistantId: req.user!._id },
      { $set: changes },
      { new: true, runValidators: true },
    );
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json({ conversation });
  } catch {
    res.status(500).json({ message: "Could not update conversation" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }
    const owner: Record<string, unknown> = req.user!.role === "assistant"
      ? { assistantId: req.user!._id }
      : { clientId: req.user!._id, replyResponsibility: "client", status: "open" };
    const conversation = await Conversation.findOne({ _id: req.params.id, ...owner })
      .select(req.user!.role === "client" ? "-draftReply" : "");
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json({ conversation });
  } catch {
    res.status(500).json({ message: "Could not load conversation" });
  }
});

export default router;
