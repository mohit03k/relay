import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document<Types.ObjectId> {
  name: string;
  email: string;
  password: string;
  role: "assistant" | "client";
  assistantId?: Types.ObjectId;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["assistant", "client"], required: true },
  assistantId: { type: Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model<IUser>("User", userSchema);
