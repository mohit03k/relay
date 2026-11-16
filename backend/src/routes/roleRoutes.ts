import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/assistant", requireAuth, requireRole("assistant"), (req, res) => {
  res.json({ message: `Welcome, ${req.user!.name}`, role: "assistant" });
});

router.get("/client", requireAuth, requireRole("client"), (req, res) => {
  res.json({ message: `Welcome, ${req.user!.name}`, role: "client" });
});

export default router;
