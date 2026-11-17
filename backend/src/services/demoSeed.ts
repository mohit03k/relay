import { Types } from "mongoose";
import User from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import Conversation from "../models/Conversation.js";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

export async function seedDemoInbox(assistantId: Types.ObjectId, clientId: Types.ObjectId, firstAccountId?: Types.ObjectId) {
  const assistant = await User.findOne({ _id: assistantId, role: "assistant" });
  const client = await User.findOne({ _id: clientId, role: "client", assistantId });
  if (!assistant || !client) {
    throw new Error("Assistant or client not found.");
  }

  const firstAccount = firstAccountId
    ? await EmailAccount.findOne({ _id: firstAccountId, assistantId, clientId })
    : null;
  const accountDetails = [
    { provider: "gmail", email: firstAccount?.provider === "gmail" ? firstAccount.email : "alex.morgan@gmail.com" },
    { provider: "outlook", email: firstAccount?.provider === "outlook" ? firstAccount.email : "alex.morgan@outlook.com" },
  ] as const;
  const accounts = [];
  for (const details of accountDetails) {
    let account = await EmailAccount.findOne({ clientId: client._id, ...details });
    if (!account) {
      account = await EmailAccount.create({
        assistantId: assistant._id, clientId: client._id, ...details,
      });
    }
    accounts.push(account);
  }

  const gmail = accounts[0]!;
  const outlook = accounts[1]!;
  const samples = [
    {
      seedKey: "schedule-review", accountId: gmail._id,
      subject: "Re: Thursday strategy review", senderName: "Maya Chen", senderEmail: "maya@northstar.co",
      messages: [
        { from: "maya@northstar.co", to: gmail.email, body: "Could we move Thursday's strategy review to 3 pm?", receivedAt: hoursAgo(28) },
        { from: gmail.email, to: "maya@northstar.co", body: "I can check Alex's calendar and confirm shortly.", receivedAt: hoursAgo(26) },
        { from: "maya@northstar.co", to: gmail.email, body: "Thanks. Please let me know by end of day so I can update the invite.", receivedAt: hoursAgo(3) },
      ],
      summary: "Maya wants to move Thursday's strategy review to 3 pm and needs confirmation today.",
      dates: [{ label: "Proposed strategy review", when: "Thursday at 3 pm" }],
      category: "meetings", replyResponsibility: "assistant",
      responsibilityReason: "This is a scheduling request the assistant can handle.",
      isImportant: false, isUnread: true,
    },
    {
      seedKey: "vendor-invoice", accountId: outlook._id,
      subject: "Invoice address for November", senderName: "Jordan Lee", senderEmail: "jordan@atelierworks.com",
      messages: [
        { from: "jordan@atelierworks.com", to: outlook.email, body: "Can you confirm the billing address for November's invoice? We would like to send it this afternoon.", receivedAt: hoursAgo(7) },
      ],
      summary: "The vendor needs the current billing address before sending November's invoice.",
      category: "action-required", replyResponsibility: "assistant",
      responsibilityReason: "Billing details are a routine administrative request.",
      isImportant: false, isUnread: true,
    },
    {
      seedKey: "lease-approval", accountId: gmail._id,
      subject: "Studio lease renewal: approval needed", senderName: "Priya Shah", senderEmail: "priya@elmproperties.com",
      messages: [
        { from: "priya@elmproperties.com", to: gmail.email, body: "The renewal offer is attached. The new term starts next month at $4,200 per month.", receivedAt: hoursAgo(54) },
        { from: "priya@elmproperties.com", to: gmail.email, body: "Could Alex personally approve the new rate by Friday?", receivedAt: hoursAgo(4) },
      ],
      summary: "The studio lease renewal is $4,200 per month; approval is requested by Friday.",
      dates: [{ label: "Lease approval requested", when: "Friday" }],
      category: "action-required", replyResponsibility: "client",
      responsibilityReason: "The sender specifically requests Alex's approval of a financial decision.",
      isImportant: true, isUnread: true,
    },
    {
      seedKey: "partnership-terms", accountId: outlook._id,
      subject: "Partnership proposal terms", senderName: "Daniel Foster", senderEmail: "daniel@fieldhouse.io",
      messages: [
        { from: "daniel@fieldhouse.io", to: outlook.email, body: "Following our call, I have sent the revised partnership terms. Would Alex be comfortable with the proposed exclusivity period?", receivedAt: hoursAgo(31) },
      ],
      summary: "Daniel asks Alex to decide whether to accept the revised exclusivity period.",
      category: "important", replyResponsibility: "client",
      responsibilityReason: "This requires Alex's judgment on a business commitment.",
      isImportant: true, isUnread: true,
    },
    {
      seedKey: "statement", accountId: gmail._id,
      subject: "Your monthly account statement", senderName: "Harbor Bank", senderEmail: "updates@harborbank.com",
      messages: [
        { from: "updates@harborbank.com", to: gmail.email, body: "Your monthly statement is available in your secure account portal. No action is required.", receivedAt: hoursAgo(11) },
      ],
      summary: "The monthly bank statement is available online.",
      category: "general", replyResponsibility: "none",
      responsibilityReason: "This is an informational notification with no request for a reply.",
      isImportant: false, isUnread: false,
    },
    {
      seedKey: "newsletter", accountId: outlook._id,
      subject: "This week at Design Forum", senderName: "Design Forum", senderEmail: "newsletter@designforum.com",
      messages: [
        { from: "newsletter@designforum.com", to: outlook.email, body: "Here are this week's talks and articles. Visit our website to explore the full program.", receivedAt: hoursAgo(19) },
      ],
      summary: "A weekly newsletter with upcoming talks and articles.",
      category: "general", replyResponsibility: "none",
      responsibilityReason: "Newsletters do not need a personal response.",
      isImportant: false, isUnread: false,
    },
    {
      seedKey: "keynote-review", accountId: gmail._id,
      subject: "Keynote confirmation for the summit", senderName: "Sam Rivera", senderEmail: "sam@summit.events",
      messages: [
        { from: "sam@summit.events", to: gmail.email, body: "Can you confirm the keynote slot and whether the updated topic works?", receivedAt: hoursAgo(8) },
        { from: "sam@summit.events", to: gmail.email, body: "We can hold the slot until tomorrow morning.", receivedAt: hoursAgo(2) },
      ],
      summary: "The summit needs confirmation of the keynote time and updated topic by tomorrow morning.",
      dates: [{ label: "Keynote hold expires", when: "Tomorrow morning" }],
      category: "action-required", replyResponsibility: "review",
      responsibilityReason: "The assistant can confirm the time, but Alex may need to approve the topic.",
      isImportant: true, isUnread: true,
    },
    {
      seedKey: "contract-waiting", accountId: outlook._id,
      subject: "Signed Northstar contract", senderName: "Maya Chen", senderEmail: "maya@northstar.co",
      messages: [
        { from: "maya@northstar.co", to: outlook.email, body: "We are preparing the final contract for signature.", receivedAt: hoursAgo(75) },
        { from: outlook.email, to: "maya@northstar.co", body: "Thanks, please send the signed copy once it is ready.", receivedAt: hoursAgo(49) },
      ],
      summary: "Alex's team has requested the signed contract and is waiting for Northstar to send it.",
      category: "waiting", replyResponsibility: "none",
      responsibilityReason: "The last message was outgoing; the next response is expected from Northstar.",
      isImportant: true, isUnread: false,
    },
  ];

  for (const sample of samples) {
    await Conversation.findOneAndUpdate(
      { assistantId: assistant._id, clientId: client._id, seedKey: sample.seedKey },
      { $set: {
        ...sample, assistantId: assistant._id, clientId: client._id,
        lastMessageAt: sample.messages.at(-1)!.receivedAt,
      } },
      { upsert: true, new: true },
    );
  }

  return { accounts: accounts.length, conversations: samples.length, clientEmail: client.email };
}
