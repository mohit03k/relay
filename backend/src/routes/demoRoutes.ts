import { Router } from "express";
import { classifyConversation, CLASSIFICATION_MODEL, type EmailMessage } from "../services/classifyConversation.js";

const router = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();

router.post("/classify", async (req, res) => {
  const address = req.ip || "unknown";
  const now = Date.now();
  const prior = attempts.get(address);
  const entry = !prior || prior.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : prior;
  entry.count += 1;
  attempts.set(address, entry);
  if (entry.count > 12) return res.status(429).json({ message: "Demo limit reached. Wait a minute and try again." });

  const { subject, accountEmail, messages } = req.body ?? {};
  if (typeof subject !== "string" || !subject.trim() || subject.length > 200
    || typeof accountEmail !== "string" || accountEmail.length > 120
    || !Array.isArray(messages) || messages.length < 1 || messages.length > 8
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

export default router;
