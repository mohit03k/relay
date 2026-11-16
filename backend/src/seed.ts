import mongoose from "mongoose";
import User from "./models/User.js";
import { seedDemoInbox } from "./services/demoSeed.js";

const [assistantEmail, clientEmail] = process.argv.slice(2);
if (!process.env.MONGO_URI || !assistantEmail || !clientEmail) {
  console.error("Usage: npm run seed -- assistant@example.com client@example.com");
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const assistant = await User.findOne({ email: assistantEmail.toLowerCase(), role: "assistant" });
  const client = await User.findOne({
    email: clientEmail.toLowerCase(), role: "client", assistantId: assistant?._id,
  });
  if (!assistant || !client) {
    throw new Error("Create an assistant and their client first, then run the seed command again.");
  }
  const result = await seedDemoInbox(assistant._id, client._id);
  console.log(`Seeded ${result.accounts} demo accounts and ${result.conversations} conversations for ${result.clientEmail}.`);
}

run().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
