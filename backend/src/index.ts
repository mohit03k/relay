import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", roleRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/conversations", conversationRoutes);

const port = process.env.PORT || 5000;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Set MONGO_URI and JWT_SECRET in your environment");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(port, () => console.log(`API running on port ${port}`));
}).catch((error: Error) => {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
});
