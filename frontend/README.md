# Relay frontend

React and TypeScript prototype for Relay's landing page, onboarding, and assistant inbox. The inbox uses clearly labelled sample conversations when the API is offline.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL. `/signup` creates an assistant account, `/signin` logs in, `/account` edits a saved name or email, `/onboarding` sets up a simulated Gmail or Outlook connection, and `/inbox` opens the sample inbox. These paths can be loaded directly. To save account and inbox data, start MongoDB and `/backend`; Vite proxies `/api` to `http://127.0.0.1:5000`. A local sample flow is also available without the API.

For a separate Vercel deployment, set `VITE_API_URL` to the Render backend origin, for example `https://relay-api.onrender.com` (without `/api`). The frontend uses this public origin for its API calls. `vercel.json` keeps direct routes such as `/signup` and `/inbox` working after refresh.

Signed-in clients see a separate minimal screen at `/inbox` or `/client`, showing only open conversations assigned to them. They can review the original thread, mark a matter handled, or ask the assistant to take over. Assistants with a demo account can use **Open client view** to switch into a sample client's restricted view; those actions are saved in MongoDB. The unsigned inbox has **Preview client view**, which keeps sample actions in the current browser tab. Both paths return to the assistant inbox with the changes reflected there.

```bash
npm run build
```

Gmail, Outlook, and synchronization are simulated. The sample inbox starts with
prewritten suggestions. **Simulate email** uses Groq through the backend to classify
a new sample conversation or a reply from its thread history. Signed-in demo results
are saved in MongoDB; unsigned preview results are local to the page. The UI does not
send email.

The assistant inbox has direct No Reply Needed and General segments. Action Required
shows conversations classified in that category. Assistants can correct a
conversation's category and importance in its detail panel, alongside responsibility.
