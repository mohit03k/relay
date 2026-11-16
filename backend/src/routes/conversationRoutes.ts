import { Router } from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const segments = [
  "all", "open", "done", "assistant", "client", "no-reply", "review",
  "action-required", "waiting", "meetings", "important", "general",
];

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
      if (segment === "done") filter.status = "handled";
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
      .select("-messages")
      .sort({ lastMessageAt: -1 });
    res.json({ conversations });
  } catch {
    res.status(500).json({ message: "Could not load conversations" });
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
    }
    if (body.status !== undefined) {
      if (!["open", "handled"].includes(body.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      changes.status = body.status;
    }
    if (typeof body.isImportant === "boolean") changes.isImportant = body.isImportant;
    if (typeof body.isUnread === "boolean") changes.isUnread = body.isUnread;
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
    const conversation = await Conversation.findOne({ _id: req.params.id, ...owner });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json({ conversation });
  } catch {
    res.status(500).json({ message: "Could not load conversation" });
  }
});

export default router;
