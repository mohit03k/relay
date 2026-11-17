# Backend

Copy `.env.example` to `.env`, set `JWT_SECRET`, then run `npm install` and `npm run dev`.
The local MongoDB container should be available at `127.0.0.1:27017`.

## Demo data

Create an assistant with `POST /api/auth/signup`, then create a client with
`POST /api/auth/clients` using the assistant's bearer token. Seed their inbox with:

```bash
npm run seed -- assistant@example.com client@example.com
```

The script adds two simulated email accounts and eight conversations. Running it
again resets those same sample conversations; it does not run when the API starts.
These records demonstrate the UI and API only. Gmail, Outlook, and synchronization
are not connected. The inbox's **Simulate email** action can send sample content to
Groq for real classification when `GROQ_API_KEY` is set in `backend/.env`.
The default model is `openai/gpt-oss-120b`. The key stays on the backend.

## Routes

- `POST /api/accounts/connect` — assistant only; body: `clientId`, `provider` (`gmail` or `outlook`), `email`
- `POST /api/accounts/demo-setup` — assistant only; body: `clientName`, `provider`, `email`. Creates a simulated connection and loads sample conversations without OAuth or live sync.
- `PATCH /api/auth/me` — update the signed-in user's name and email address
- `POST /api/auth/demo-client` — assistant only; issue a temporary client session for a demo account so evaluators can open the client screen
- `GET /api/accounts` — connected accounts for the logged-in assistant or client
- `GET /api/accounts/:id/status` — connection and sync status
- `POST /api/accounts/:id/sample` — explicitly load the sample inbox for a demo account
- `GET /api/conversations` — list; optional `search`, `segment`, and `accountId` query parameters
- `GET /api/conversations/:id` — conversation with its messages
- `PATCH /api/conversations/:id` — assistant can change responsibility, category, status, important, or unread
- `PATCH /api/conversations/:id/client-action` — client only; mark their assigned matter handled or ask the assistant to take over
- `POST /api/conversations/simulate` — assistant only; classify and save a new sample conversation or a reply to an existing one
- `POST /api/demo/classify` — rate-limited, stateless classifier for the unsigned preview; classifies supplied sample thread data without saving it

Segments: `all`, `open`, `done`, `assistant`, `client`, `no-reply`, `review`, `action-required`,
`waiting`, `meetings`, `important`, `general`. Clients only see their open
`client` conversations. All routes above require a bearer token except
`POST /api/demo/classify`, which supports the unsigned sample preview.
