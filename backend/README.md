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
These records demonstrate the UI and API only. Gmail, Outlook, synchronization,
and AI classification are not connected yet.

## Routes

- `POST /api/accounts/connect` — assistant only; body: `clientId`, `provider` (`gmail` or `outlook`), `email`
- `GET /api/accounts` — connected accounts for the logged-in assistant or client
- `GET /api/accounts/:id/status` — connection and sync status
- `POST /api/accounts/:id/sample` — explicitly load the sample inbox for a demo account
- `GET /api/conversations` — list; optional `search`, `segment`, and `accountId` query parameters
- `GET /api/conversations/:id` — conversation with its messages
- `PATCH /api/conversations/:id` — assistant can change responsibility, status, important, or unread

Segments: `all`, `open`, `done`, `assistant`, `client`, `no-reply`, `review`, `action-required`,
`waiting`, `meetings`, `important`, `general`. Clients only see their open
`client` conversations. All routes above require a bearer token.
