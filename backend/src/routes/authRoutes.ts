import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User.js";
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

export default router;
