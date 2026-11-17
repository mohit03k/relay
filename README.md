# Relay

Relay is a mobile-responsive email management prototype for personal assistants and their clients. It helps assistants see which conversations need attention, who should respond, why that person was assigned, and what to do next. Clients get a separate, simpler view of the conversations that need their own response.

## What the prototype demonstrates

- Assistant signup and sign-in, followed by a simulated Gmail or Outlook connection with visible connection and sample-data status.
- An assistant inbox with overview counts, search, filters, segments, full conversation history, summaries, important dates, and follow-ups.
- Reply responsibility labels: **Assistant**, **Client**, **No reply**, and **Needs review**. Assistants can correct a classification, change categories, and manage unread, important, archive, and completed states.
- A **Simulate email** flow that uses Groq to classify a new sample message or a new reply in an existing thread. It shows a summary and the reason for the suggested owner.
- **Ask Relay** for questions about the inbox or a selected conversation, plus AI-assisted reply drafts that assistants can edit, save, review, and approve.
- A client view that shows only matters needing the client's response. Clients can review the original thread, mark a matter handled, or ask the assistant to take over; the assistant inbox reflects the change.

This is a prototype. Gmail and Outlook authorization, mailbox synchronization, and email sending are **simulated**. The initial sample conversations and their suggestions are prewritten. Groq handles the interactive AI classification and assistance when the backend has an API key. Approving a draft records the decision in the demo; it does not send an email.

## Stack

| Folder | Technology |
| --- | --- |
| [`frontend/`](frontend/) | React, TypeScript, Vite, CSS |
| [`backend/`](backend/) | Node.js, Express, TypeScript, Mongoose, MongoDB, JWT authentication, Groq API |

## Run locally

Use Node.js 22+, npm, and a reachable MongoDB instance. The example backend configuration expects MongoDB at `127.0.0.1:27017`.

1. Install dependencies and create the backend environment file:

   ```bash
   npm ci --prefix backend
   npm ci --prefix frontend
   cp backend/.env.example backend/.env
   ```

2. In `backend/.env`, set `MONGO_URI` and a long, random `JWT_SECRET`. Add `GROQ_API_KEY` to enable the interactive AI features. Keep this file private.

3. Start the API and frontend in separate terminals:

   ```bash
   cd backend && npm run dev
   ```

   ```bash
   cd frontend && npm run dev
   ```

4. Open the Vite URL shown in the terminal. The frontend proxies `/api` to `http://127.0.0.1:5000`.

The landing page and unsigned sample inbox can open without MongoDB. Signup, saved conversations, demo client sessions, and persistent changes need the backend and database. Interactive AI requests need the backend and Groq key.

## Suggested demo path

1. Open `/signup` and create an assistant account, or use the unsigned sample flow.
2. Choose Gmail or Outlook, review the **demo** authorization step, and open `/inbox`.
3. Explore the overview, search, segments, and a conversation's summary, thread, and suggested reply owner.
4. Use **Simulate email** to see live AI classification, then try **Ask Relay** or an AI reply draft.
5. Open the client view, ask the assistant to take over a matter, and return to the assistant inbox to see the update.

The main routes are `/`, `/signup`, `/signin`, `/onboarding`, `/inbox`, and `/client`. The assistant can also edit account details at `/account`.

## Build and deploy

To build both applications:

```bash
npm run build --prefix frontend
npm run build --prefix backend
```

The Express server can serve the built `frontend/dist` and the API from one origin. Set `MONGO_URI`, `JWT_SECRET`, and `GROQ_API_KEY` in the hosting environment, and set `PORT` if required by the host. See the [backend deployment notes](backend/README.md#deploy-as-one-web-service) for the full command sequence.

