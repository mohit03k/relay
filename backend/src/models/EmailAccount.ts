import mongoose, { Schema } from "mongoose";

const emailAccountSchema = new Schema({
  assistantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, enum: ["gmail", "outlook"], required: true },
  email: { type: String, required: true, lowercase: true },
  connectionType: { type: String, default: "demo" },
  status: { type: String, enum: ["connected", "error"], default: "connected" },
  syncStatus: { type: String, default: "demo" },
  lastSyncedAt: { type: Date, default: null },
}, { timestamps: true });

emailAccountSchema.index({ clientId: 1, provider: 1, email: 1 }, { unique: true });

export default mongoose.model("EmailAccount", emailAccountSchema);
