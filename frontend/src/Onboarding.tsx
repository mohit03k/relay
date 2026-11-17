import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, Inbox, LockKeyhole, Mail, RefreshCw } from "lucide-react";
import "./onboarding.css";
import { apiUrl } from "./apiUrl";

type Provider = "gmail" | "outlook";
type User = { id: string; name: string; email: string; role: "assistant" | "client" };
type Session = { token: string; user: User };
type Account = { _id: string; email: string; provider: Provider; status?: string; syncStatus?: string; connectionType?: string };
type AccountStatus = { status: string; syncStatus: string };
type DemoConnection = { provider: Provider; email: string; connectedAt: string };
type Step = "account" | "connect" | "authorize" | "ready";

function storedSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("relay-session") || "null"); } catch { return null; }
}
function storedDemo(): DemoConnection | null {
  try { return JSON.parse(localStorage.getItem("relay-demo-connection") || "null"); } catch { return null; }
}
async function api<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}
const providerName = (provider: Provider) => provider === "gmail" ? "Gmail" : "Outlook / Microsoft";

export default function Onboarding({ intent = "onboarding" }: { intent?: "signin" | "signup" | "account" | "onboarding" }) {
  const [session, setSession] = useState<Session | null>(storedSession);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [demo, setDemo] = useState<DemoConnection | null>(storedDemo);
  const [step, setStep] = useState<Step>(() => intent === "signin" || intent === "signup" || intent === "account" ? "account" : storedDemo() ? "ready" : storedSession() ? "connect" : "account");
  const [authMode, setAuthMode] = useState<"signup" | "login">(intent === "signin" || intent === "account" ? "login" : "signup");
  const editingAccount = intent === "account" && !!session;
  const [name, setName] = useState(() => sessionStorage.getItem("relay-signup-name") || (intent === "account" ? storedSession()?.user.name : "") || "");
  const [email, setEmail] = useState(() => sessionStorage.getItem("relay-signup-email") || (intent === "account" ? storedSession()?.user.email : "") || "");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState(() => sessionStorage.getItem("relay-client-name") || "");
  const [clientEmail, setClientEmail] = useState(() => sessionStorage.getItem("relay-client-email") || "");
  const [provider, setProvider] = useState<Provider>(() => sessionStorage.getItem("relay-provider") === "outlook" ? "outlook" : "gmail");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState(() => localStorage.getItem("relay-onboarding-account") || "");
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(!!storedSession());
  const [error, setError] = useState("");

  useEffect(() => {
    sessionStorage.setItem("relay-signup-name", name);
    sessionStorage.setItem("relay-signup-email", email);
    sessionStorage.setItem("relay-client-name", clientName);
    sessionStorage.setItem("relay-client-email", clientEmail);
    sessionStorage.setItem("relay-provider", provider);
  }, [name, email, clientName, clientEmail, provider]);

  useEffect(() => {
    if (intent !== "onboarding") { setChecking(false); return; }
    if (!session) { setChecking(false); return; }
    let active = true;
    setChecking(true);
    api<{ accounts: Account[] }>("/accounts", session.token).then(async ({ accounts: next }) => {
      if (!active) return;
      setAccounts(next);
      if (next.length) {
        const preferredId = localStorage.getItem("relay-onboarding-account");
        const latest = next.find(account => account._id === preferredId) || next[0];
        setActiveAccountId(latest._id);
        setProvider(latest.provider);
        setClientEmail(latest.email);
        setStatus(await api<AccountStatus>(`/accounts/${latest._id}/status`, session.token));
        if (active) setStep("ready");
      } else if (active) setStep("connect");
      if (active) setError("");
    }).catch((cause: Error) => {
      if (!active) return;
      if (cause.message === "Invalid session" || cause.message === "Please log in") {
        localStorage.removeItem("relay-session");
        setSession(null); setAuthMode("login"); setStep("account");
        setError("Your session expired. Please sign in again.");
      } else setError(`${cause.message}. The local API may be offline; you can still try the sample flow.`);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [session, intent]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (editingAccount && session) {
        const { user } = await api<{ user: User }>("/auth/me", session.token, { method: "PATCH", body: JSON.stringify({ name: name.trim(), email: email.trim() }) });
        const updated = { ...session, user };
        localStorage.setItem("relay-session", JSON.stringify(updated));
        sessionStorage.removeItem("relay-signup-name");
        sessionStorage.removeItem("relay-signup-email");
        window.location.assign("/onboarding");
        return;
      }
      const result = await api<Session>(`/auth/${authMode}`, undefined, { method: "POST", body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) });
      localStorage.setItem("relay-session", JSON.stringify(result));
      sessionStorage.removeItem("relay-assistant-session");
      localStorage.removeItem("relay-demo-connection");
      sessionStorage.removeItem("relay-signup-name");
      sessionStorage.removeItem("relay-signup-email");
      if (result.user.role === "client") window.location.assign("/inbox");
      else window.location.assign("/onboarding");
    } catch (cause) {
      if (editingAccount && cause instanceof Error && (cause.message === "Invalid session" || cause.message === "Please log in")) {
        localStorage.removeItem("relay-session");
        window.location.assign("/signin");
      } else setError(cause instanceof Error ? cause.message : "Could not continue.");
    }
    finally { setBusy(false); }
  }

  function startDemo() {
    setPreviewOnly(true); setError(""); setStep("connect");
  }

  async function authorize(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!clientEmail.trim()) { setError("Enter the email address you want to use for this demo."); return; }
    if (session && !previewOnly && !clientName.trim()) { setError("Enter a client name for this sample inbox."); return; }
    setStep("authorize");
  }

  async function finishConnection() {
    setBusy(true); setError("");
    try {
      if (session && !previewOnly) {
        const { account } = await api<{ account: Account }>("/accounts/demo-setup", session.token, { method: "POST", body: JSON.stringify({ clientName: clientName.trim(), provider, email: clientEmail.trim() }) });
        localStorage.setItem("relay-onboarding-account", account._id);
        setActiveAccountId(account._id);
        const [{ accounts: next }, connectionStatus] = await Promise.all([
          api<{ accounts: Account[] }>("/accounts", session.token),
          api<AccountStatus>(`/accounts/${account._id}/status`, session.token),
        ]);
        setAccounts(next); setStatus(connectionStatus);
      } else {
        const connection = { provider, email: clientEmail.trim(), connectedAt: new Date().toISOString() };
        localStorage.setItem("relay-demo-connection", JSON.stringify(connection));
        setDemo(connection);
        if (session) { localStorage.removeItem("relay-session"); setSession(null); setAccounts([]); setStatus(null); }
        window.history.replaceState({}, "", "/onboarding");
      }
      setStep("ready");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the demo connection."); }
    finally { setBusy(false); }
  }

  const currentEmail = session ? clientEmail : demo?.email || clientEmail;
  const currentProvider = session ? provider : demo?.provider || provider;
  const connected = step === "ready" && (demo || accounts.length > 0);

  async function selectDemoAccount(account: Account) {
    if (!session || busy || account._id === activeAccountId) return;
    setBusy(true); setError("");
    try {
      const nextStatus = await api<AccountStatus>(`/accounts/${account._id}/status`, session.token);
      setActiveAccountId(account._id);
      setClientEmail(account.email);
      setProvider(account.provider);
      setStatus(nextStatus);
      localStorage.setItem("relay-onboarding-account", account._id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load that demo account."); }
    finally { setBusy(false); }
  }

  return <div className="ob-page">
    <header className="ob-header"><a href="/" className="ob-brand"><span><ArrowUpRight size={23} /></span>relay</a>
    </header>
    <main className="ob-main">
      <aside className="ob-intro"><span className="ob-eyebrow">GETTING STARTED WITH RELAY</span><h1>Make room for<br /><em>what matters.</em></h1><p>Bring client conversations into one clear place. See who should reply, why, and what happens next.</p><div className="ob-intro-divider" />
        <div className="ob-intro-steps">
          <div className={step === "account" ? "current" : "complete"}><span>01</span><div>
            <strong>Create your account</strong><small>Sign up or sign in to the local prototype.</small></div>
          </div>
          <div className={step === "connect" || step === "authorize" ? "current" : step === "ready" ? "complete" : ""}><span>02</span>
            <div><strong>Choose an email provider</strong><small>Gmail or Outlook, with sample data.</small></div></div>
          <div className={step === "ready" ? "current" : ""}><span>03</span><div><strong>Open your inbox</strong>
            <small>Review the next action for each thread.</small></div></div></div>
      </aside>
      <section className={`ob-panel ${step === "ready" ? "ob-panel-ready" : ""}`} aria-live="polite">
        {checking && <div className="ob-loading"><RefreshCw size={24} className="ob-spin" /> Checking your demo connection…</div>}
        {!checking && step === "account" && <>
          <div className="ob-panel-label">STEP 01 / YOUR ACCOUNT</div>
          <h2>{editingAccount ? "Your account details." : authMode === "signup" ? "A calmer inbox starts here." : "Welcome back."}</h2>
          <p className="ob-panel-lead">{editingAccount ? "Update the name or email on your Relay account." : authMode === "signup" ? "Create an assistant account to save your demo conversations." : "Sign in to continue where you left off."}</p>
          <form className="ob-form" onSubmit={submitAuth}>
            {(authMode === "signup" || editingAccount) && <label>Your name<input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" /></label>}
            <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            {!editingAccount && <label>Password<input required minLength={8} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>}
            {error && <p className="ob-error" role="alert"><AlertCircle size={16} /> {error}</p>}
            <button className="ob-primary" disabled={busy}>{busy ? "Please wait…" : editingAccount ? "Save account details" : authMode === "signup" ? "Create account" : "Sign in"}<ArrowRight size={17} /></button>
          </form>
          {editingAccount ? <a className="ob-text-button" href="/onboarding"><ArrowLeft size={15} /> Back to email setup</a> : <a className="ob-text-button" href={authMode === "signup" ? "/signin" : "/signup"}>{authMode === "signup" ? "Already have an account? Sign in" : "New to Relay? Create an account"}</a>}
          {!editingAccount && <><div className="ob-or"><span>or</span></div><button className="ob-demo-button" onClick={startDemo}>Try a simulated connection without signing in <ArrowRight size={16} /></button></>}
        </>}
        {!checking && step === "connect" && <>
          <div className="ob-panel-label">STEP 02 / EMAIL CONNECTION</div><h2>Choose your inbox.</h2>
          <p className="ob-panel-lead">Select a provider and enter an email address. Relay will create a demo connection and load sample conversations.</p>
          <div className="ob-provider-grid" role="group" aria-label="Email provider">
            <button type="button" className={provider === "gmail" ? "selected" : ""} onClick={() => setProvider("gmail")} aria-pressed={provider === "gmail"}><span className="ob-provider-symbol"><img src="/provider-logos/gmail.svg" alt="" /></span><strong>Gmail</strong><small>Google email</small>{provider === "gmail" && <Check size={17} className="ob-provider-check" />}</button>
            <button type="button" className={provider === "outlook" ? "selected" : ""} onClick={() => setProvider("outlook")} aria-pressed={provider === "outlook"}><span className="ob-provider-symbol"><img src="/provider-logos/outlook.svg" alt="" /></span><strong>Outlook</strong><small>Microsoft email</small>{provider === "outlook" && <Check size={17} className="ob-provider-check" />}</button>
          </div>
          <form className="ob-form" onSubmit={authorize}>
            {session && !previewOnly && <label>Client name<input required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Alex Morgan" /></label>}
            <label>{session && !previewOnly ? "Client email address" : "Email address"}<input required type="email" autoComplete="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder={provider === "gmail" ? "alex@gmail.com" : "alex@outlook.com"} /></label>
            {error && <p className="ob-error" role="alert"><AlertCircle size={16} /> {error}</p>}
            <button className="ob-primary">Continue with {providerName(provider)} <ArrowRight size={17} /></button>
          </form>
          <p className="ob-disclosure"><LockKeyhole size={16} /> This demonstrates authorization; it does not open Google or Microsoft sign-in.</p>
          {previewOnly ? <button className="ob-text-button" onClick={() => { setPreviewOnly(false); setError(""); if (!session) window.location.assign("/signup"); }}><ArrowLeft size={15} /> {session ? "Back to client name and email" : "Back to account setup"}</button> : session && <><a className="ob-text-button" href="/account"><ArrowLeft size={15} /> Back to account details</a><button className="ob-text-button" onClick={startDemo}>Use the local sample flow instead</button></>}
        </>}
        {!checking && step === "authorize" && <><div className="ob-panel-label">STEP 02 / DEMO AUTHORIZATION</div><h2>Review the connection.</h2><p className="ob-panel-lead">You are about to set up a simulated {providerName(provider)} connection for <strong>{clientEmail}</strong>.</p><div className="ob-auth-card"><div><Mail size={25} /><span><strong>{providerName(provider)}</strong><small>{clientEmail}</small></span></div><ul><li><Check size={16} /> Create a demo connection record</li><li><Check size={16} /> Load sample conversations</li><li><Check size={16} /> Show connection and sample-data status</li></ul></div><p className="ob-disclosure"><LockKeyhole size={16} /> No OAuth permission is requested, and no real email is read or synced.</p>{error && <p className="ob-error" role="alert"><AlertCircle size={16} /> {error}</p>}<button className="ob-primary" onClick={finishConnection} disabled={busy}>{busy ? "Preparing sample inbox…" : "Authorize demo connection"}<ArrowRight size={17} /></button><button className="ob-text-button" onClick={() => { setStep("connect"); setError(""); }} disabled={busy}><ArrowLeft size={15} /> Change provider or address</button></>}
        {!checking && step === "ready" && <>
          <div className="ob-panel-label">STEP 03 / READY TO GO</div><div className="ob-ready-icon"><Check size={30} /></div>
          <h2>Your inbox is ready.</h2><p className="ob-panel-lead">The sample conversations are ready to explore. You can review each thread and decide who replies.</p>
          {connected && <div className="ob-connection-card">
            <div className="ob-connection-top"><div className="ob-connection-icon"><Mail size={21} /></div><div className="ob-connection-identity"><strong>{providerName(currentProvider)}</strong><span>{currentEmail}</span></div><span className="ob-connected-pill"><CheckCircle2 size={15} /> {status?.status === "error" ? "Needs attention" : "Demo connected"}</span></div>
            <div className="ob-sync-status"><span className="ob-sync-dot" /><strong>{status?.syncStatus === "demo" || demo ? "Sample conversations ready" : status?.syncStatus || "Demo data ready"}</strong><span>No live sync</span></div>
          </div>}
          {session && accounts.length > 1 && <div className="ob-account-list"><strong>Demo email accounts</strong><p>Switch the address shown above. All sample conversations remain in the inbox.</p><div>{accounts.map(account => <button key={account._id} type="button" className={account._id === activeAccountId ? "active" : ""} onClick={() => selectDemoAccount(account)} disabled={busy} aria-pressed={account._id === activeAccountId}><img src={`/provider-logos/${account.provider}.svg`} alt="" /><span>{account.email}</span>{account._id === activeAccountId && <Check size={16} aria-hidden="true" />}</button>)}</div></div>}
          {error && <p className="ob-error" role="alert"><AlertCircle size={16} /> {error}</p>}
          <a className="ob-primary ob-link-primary" href="/inbox">Open inbox <Inbox size={18} /></a>
          <button className="ob-text-button" onClick={() => { setStep("connect"); setError(""); }}>Set up another demo address</button>
          <a className="ob-text-button" href={session ? "/account" : "/signup"}><ArrowLeft size={15} /> {session ? "Back to account details" : "Back to create account"}</a>
        </>}
      </section>
    </main>
  </div>;
}
