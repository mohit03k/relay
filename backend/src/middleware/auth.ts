import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) return res.status(401).json({ message: "Please log in" });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "Invalid session" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
}

export function requireRole(role: "assistant" | "client") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ message: "Access denied" });
    next();
  };
}
