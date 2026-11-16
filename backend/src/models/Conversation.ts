import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  body: { type: String, required: true },
  receivedAt: { type: Date, required: true },
}, { _id: false });

const conversationSchema = new Schema({
  assistantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "EmailAccount", required: true },
  subject: { type: String, required: true },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  messages: { type: [messageSchema], default: [] },
  summary: { type: String, required: true },
  category: {
    type: String,
    enum: ["action-required", "waiting", "meetings", "important", "general"],
    required: true,
  },
  replyResponsibility: {
    type: String,
    enum: ["assistant", "client", "none", "review"],
    required: true,
  },
  responsibilityReason: { type: String, required: true },
  status: { type: String, enum: ["open", "handled"], default: "open" },
  isUnread: { type: Boolean, default: true },
  isImportant: { type: Boolean, default: false },
  lastMessageAt: { type: Date, required: true },
  seedKey: { type: String },
}, { timestamps: true });

conversationSchema.index({ assistantId: 1, lastMessageAt: -1 });
conversationSchema.index({ clientId: 1, replyResponsibility: 1 });
conversationSchema.index(
  { assistantId: 1, clientId: 1, seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
);

export default mongoose.model("Conversation", conversationSchema);
