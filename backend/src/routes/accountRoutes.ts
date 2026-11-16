import { Router } from "express";
import mongoose from "mongoose";
import EmailAccount from "../models/EmailAccount.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { seedDemoInbox } from "../services/demoSeed.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const owner = req.user!.role === "assistant"
      ? { assistantId: req.user!._id }
      : { clientId: req.user!._id };
    const accounts = await EmailAccount.find(owner).sort({ createdAt: -1 });
    res.json({ accounts });
  } catch {
    res.status(500).json({ message: "Could not load accounts" });
  }
});

// This creates a demo connection. OAuth and live syncing come later.
router.post("/connect", requireRole("assistant"), async (req, res) => {
  try {
    const { clientId, provider, email } = req.body;
    if (!mongoose.isValidObjectId(clientId) || !["gmail", "outlook"].includes(provider)
      || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Valid client, provider and email are required" });
    }

    const client = await User.findOne({ _id: clientId, role: "client", assistantId: req.user!._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await EmailAccount.findOne({ clientId, provider, email: cleanEmail });
    if (existing) return res.status(409).json({ message: "Account is already connected" });

    const account = await EmailAccount.create({
      assistantId: req.user!._id, clientId, provider, email: cleanEmail,
    });
    res.status(201).json({ account, message: "Demo connection created. No live email is synced." });
  } catch {
    res.status(500).json({ message: "Could not connect account" });
  }
});

router.get("/:id/status", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    const owner = req.user!.role === "assistant"
      ? { assistantId: req.user!._id }
      : { clientId: req.user!._id };
    const account = await EmailAccount.findOne({ _id: req.params.id, ...owner });
    if (!account) return res.status(404).json({ message: "Account not found" });

    res.json({
      id: account.id,
      provider: account.provider,
      email: account.email,
      connectionType: account.connectionType,
      status: account.status,
      syncStatus: account.syncStatus,
      lastSyncedAt: account.lastSyncedAt,
    });
  } catch {
    res.status(500).json({ message: "Could not load account status" });
  }
});

router.post("/:id/sample", requireRole("assistant"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    const account = await EmailAccount.findOne({ _id: req.params.id, assistantId: req.user!._id });
    if (!account || account.connectionType !== "demo") {
      return res.status(404).json({ message: "Demo account not found" });
    }
    const result = await seedDemoInbox(req.user!._id, account.clientId, account._id);
    res.json({ message: "Sample inbox is ready", ...result });
  } catch {
    res.status(500).json({ message: "Could not load sample inbox" });
  }
});

export default router;
