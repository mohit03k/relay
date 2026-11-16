# Relay frontend

React and TypeScript prototype for the assistant inbox. The initial view uses clearly labelled sample conversations, so the screen is useful before an API is running.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL. To use the existing API, start MongoDB and `/backend`, then use **Sign in** at the bottom of the left rail to sign in or create an assistant account. For a new account, use the empty inbox form to create a client and load the API's sample inbox. Vite proxies `/api` to `http://127.0.0.1:5000`.

```bash
npm run build
```

Gmail, Outlook, synchronization, and AI suggestions are simulated. The UI does not send email. The client view is a later phase.
