import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function publicUser(user: IUser) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

function makeToken(user: IUser) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email and an 8-character password are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail })) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    const user = await User.create({
      name: name.trim(), email: cleanEmail,
      password: await bcrypt.hash(password, 10), role: "assistant",
    });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch {
    res.status(500).json({ message: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch {
    res.status(500).json({ message: "Could not log in" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Name and a valid email address are required" });
    }
    const existing = await User.findOne({ email, _id: { $ne: req.user!._id } });
    if (existing) return res.status(409).json({ message: "Email is already registered" });
    const user = await User.findByIdAndUpdate(req.user!._id, { name, email }, { new: true });
    if (!user) return res.status(404).json({ message: "Account not found" });
    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: "Could not update account details" });
  }
});

// Route for assistants to  create client accounts
// Assistants create client accounts; public signup always creates an assistant.
router.post("/clients", requireAuth, requireRole("assistant"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email and an 8-character password are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail })) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    const client = await User.create({
      name: name.trim(), email: cleanEmail,
      password: await bcrypt.hash(password, 10), role: "client", assistantId: req.user!._id,
    });
    res.status(201).json({ user: publicUser(client) });
  } catch {
    res.status(500).json({ message: "Could not create client" });
  }
});

// A demo-only switch so an assistant can show the client experience without
// sharing the random password created during sample onboarding.
router.post("/demo-client", requireAuth, requireRole("assistant"), async (req, res) => {
  try {
    const accountId = req.body?.accountId;
    if (!mongoose.isValidObjectId(accountId)) return res.status(400).json({ message: "Choose a demo account" });
    const account = await EmailAccount.findOne({ _id: accountId, assistantId: req.user!._id, connectionType: "demo" });
    if (!account) return res.status(404).json({ message: "Demo account not found" });
    const client = await User.findOne({ _id: account.clientId, role: "client", assistantId: req.user!._id });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ token: makeToken(client), user: publicUser(client), demo: true });
  } catch {
    res.status(500).json({ message: "Could not open client demo" });
  }
});

export default router;
