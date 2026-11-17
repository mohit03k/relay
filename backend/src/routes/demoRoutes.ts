import { Router } from "express";
import { classifyConversation, CLASSIFICATION_MODEL, type EmailMessage } from "../services/classifyConversation.js";
import { assistEmail, type InboxContext } from "../services/assistEmail.js";

const router = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();

function withinDemoLimit(address: string) {
  const now = Date.now();
  const prior = attempts.get(address);
  const entry = !prior || prior.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : prior;
  entry.count += 1;
  attempts.set(address, entry);
  return entry.count <= 12;
}

router.post("/classify", async (req, res) => {
  if (!withinDemoLimit(req.ip || "unknown")) return res.status(429).json({ message: "Demo limit reached. Wait a minute and try again." });

  const { subject, accountEmail, messages } = req.body ?? {};
  if (typeof subject !== "string" || !subject.trim() || subject.length > 200
    || typeof accountEmail !== "string" || accountEmail.length > 120
    || !Array.isArray(messages) || messages.length < 1 || messages.length > 20
    || !messages.every((item: EmailMessage) => item && typeof item.from === "string" && item.from.length <= 120
      && typeof item.to === "string" && item.to.length <= 120 && typeof item.body === "string"
      && item.body.trim() && item.body.length <= 2500)) {
    return res.status(400).json({ message: "Enter a valid sample message and try again." });
  }
  try {
    const classification = await classifyConversation({ subject: subject.trim(), accountEmail, messages });
    res.json({ classification, model: CLASSIFICATION_MODEL });
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Could not classify the sample message." });
  }
});

router.post("/assist", async (req, res) => {
  if (!withinDemoLimit(req.ip || "unknown")) return res.status(429).json({ message: "Demo limit reached. Wait a minute and try again." });
  const { task, question, conversations, selected } = req.body ?? {};
  if (task !== "ask" && task !== "draft") return res.status(400).json({ message: "Choose an AI assistance task." });
  if (task === "ask" && (typeof question !== "string" || !question.trim() || question.length > 500
    || !Array.isArray(conversations) || conversations.length > 40
    || !conversations.every((item: InboxContext) => item && typeof item.id === "string" && item.id.length <= 80
      && typeof item.subject === "string" && item.subject.length <= 200 && typeof item.summary === "string"
      && item.summary.length <= 400))) {
    return res.status(400).json({ message: "Enter a question about the current inbox." });
  }
  if ((task === "draft" || selected) && (!selected || typeof selected.subject !== "string"
    || selected.subject.length > 200 || typeof selected.senderName !== "string" || selected.senderName.length > 120
    || typeof selected.senderEmail !== "string" || selected.senderEmail.length > 120
    || typeof selected.summary !== "string" || selected.summary.length > 400
    || typeof selected.reason !== "string" || selected.reason.length > 400
    || !Array.isArray(selected.messages) || selected.messages.length > 20
    || !selected.messages.every((item: EmailMessage) => item && typeof item.from === "string"
      && item.from.length <= 120 && typeof item.to === "string" && item.to.length <= 120
      && typeof item.body === "string" && item.body.length <= 2500))) {
    return res.status(400).json({ message: "Open a valid conversation first." });
  }
  try {
    const safeConversations: InboxContext[] = task === "ask" ? conversations.map((item: InboxContext) => ({
      id: item.id, sender: String(item.sender || "").slice(0, 120), subject: item.subject,
      summary: item.summary, responsibility: String(item.responsibility || "").slice(0, 40),
      reason: String(item.reason || "").slice(0, 280), category: String(item.category || "").slice(0, 40),
      status: String(item.status || "").slice(0, 40), followUp: String(item.followUp || "").slice(0, 280),
      keyPoints: String(item.keyPoints || "").slice(0, 400), dates: String(item.dates || "").slice(0, 280),
    })) : [];
    const result = await assistEmail({ task, question, conversations: safeConversations, selected });
    res.json({ ...result, model: CLASSIFICATION_MODEL });
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "AI assistance is unavailable." });
  }
});

export default router;
