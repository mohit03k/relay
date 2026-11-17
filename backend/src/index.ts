import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ api: "ok", database: connected ? "connected" : "disconnected" });
});
app.use("/api/auth", authRoutes);
app.use("/api", roleRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/demo", demoRoutes);

// In production, serve the built React app from the same origin as the API.
const frontendDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
if (existsSync(resolve(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if ((req.method !== "GET" && req.method !== "HEAD") || req.path.startsWith("/api")) return next();
    res.sendFile(resolve(frontendDist, "index.html"));
  });
}

const port = process.env.PORT || 5000;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Set MONGO_URI and JWT_SECRET in your environment");
  process.exit(1);
}

mongoose.set("bufferCommands", false);
app.listen(port, () => console.log(`API running on port ${port}`));
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5_000 }).catch((error: Error) => {
  console.error("MongoDB connection failed; sample AI classification is still available:", error.message);
});
