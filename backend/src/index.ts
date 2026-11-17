import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", roleRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/demo", demoRoutes);

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
