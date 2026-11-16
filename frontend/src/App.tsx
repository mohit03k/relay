import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bell, Check, CheckCircle2, ChevronDown, Clock3, Flag, Forward,
  Inbox, Menu, Search, Sparkles, UserRound, UsersRound, X,
} from "lucide-react";

type Responsibility = "assistant" | "client" | "none" | "review";
type Status = "open" | "handled";
type Segment = "all" | "review" | "assistant" | "client" | "no-reply" | "done";
type Suggestion = { responsibility: Responsibility; reason: string };
type User = { id: string; name: string; email: string; role: "assistant" | "client" };
type Session = { token: string; user: User };
type Account = { _id: string; email: string; provider: "gmail" | "outlook" };
type Message = { from: string; to: string; body: string; receivedAt: string };
type Conversation = {
  _id: string; accountId: string; subject: string; senderName: string; senderEmail: string;
  summary: string; category: string; replyResponsibility: Responsibility;
  responsibilityReason: string; status: Status; isUnread: boolean; isImportant: boolean;
  lastMessageAt: string; messages?: Message[]; clientLabel?: string;
};

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
const extraPreview: Array<[string, string, string, string, Responsibility]> = [
  ["Noah Grant", "Updated project timeline", "riverside", "Riverside Co.", "client"],
  ["Lena Foster", "Insurance certificate", "northstar", "Northstar Studio", "assistant"],
  ["Amir Patel", "Meeting recap and next steps", "brightwell", "Brightwell", "assistant"],
  ["Sophie Bell", "Vendor information", "everline", "Everline AI", "client"],
  ["Elliot Park", "Draft contract amendment", "lakeshore", "Lakeshore Creative", "client"],
  ["Jamie Lee", "Final drawings", "northstar", "Northstar Studio", "assistant"],
  ["Quinn Hall", "Access for delivery", "riverside", "Riverside Co.", "assistant"],
  ["Parker Wu", "Project kickoff notes", "starlight", "Starlight PR", "client"],
  ["Alex Torres", "Receipt for November", "lakeshore", "Lakeshore Creative", "none"],
  ["Dana Ross", "Site visit availability", "brightwell", "Brightwell", "client"],
  ["Harper Singh", "Signed agreement copy", "everline", "Everline AI", "none"],
  ["Riley Brooks", "Questions on scope", "northstar", "Northstar Studio", "assistant"],
  ["Casey Morgan", "Permit documents", "riverside", "Riverside Co.", "client"],
  ["Avery Stone", "Event confirmation", "starlight", "Starlight PR", "assistant"],
];
const preview: Conversation[] = [
  {
    _id: "demo-1", accountId: "northstar", senderName: "Maya Chen", senderEmail: "maya@northstar.studio", subject: "Contract signature", summary: "Updated service agreement is ready for signature. Can you send it to the client?", category: "action-required", replyResponsibility: "review", responsibilityReason: "This is a contract for the client's review and signature. The decision and signature should come from the client.", status: "open", isUnread: true, isImportant: true, lastMessageAt: hoursAgo(.2), clientLabel: "Northstar Studio", messages: [
      { from: "maya@northstar.studio", to: "alex@northstar.studio", body: "Looping back on the contract — let me know if you need anything else from me.", receivedAt: hoursAgo(18) },
      { from: "alex@northstar.studio", to: "maya@northstar.studio", body: "Thanks, Maya. I'll take a look and get this over to Northstar today.", receivedAt: hoursAgo(.6) },
      { from: "maya@northstar.studio", to: "alex@northstar.studio", body: "Hi Alex, the updated service agreement is ready for signature. Could you send it to the client and let me know once it's signed?", receivedAt: hoursAgo(.2) },
    ]
  },
  { _id: "demo-2", accountId: "riverside", senderName: "Jordan Miles", senderEmail: "jordan@riverside.co", subject: "Q1 campaign assets", summary: "Sending the final assets for review and approval. Are we still on track for Friday?", category: "action-required", replyResponsibility: "assistant", responsibilityReason: "The assistant can coordinate the campaign review and confirm the timeline.", status: "open", isUnread: true, isImportant: false, lastMessageAt: hoursAgo(.6), clientLabel: "Riverside Co.", messages: [{ from: "jordan@riverside.co", to: "alex@riverside.co", body: "Sending the final assets for review and approval. Are we still on track for Friday?", receivedAt: hoursAgo(.6) }] },
  { _id: "demo-3", accountId: "brightwell", senderName: "Elena Park", senderEmail: "elena@brightwell.io", subject: "Meeting time next week?", summary: "Can we move our check-in to Tue or Wed? I have a conflict on Mon afternoon.", category: "meetings", replyResponsibility: "client", responsibilityReason: "The client should confirm their preferred meeting time.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(2), clientLabel: "Brightwell", messages: [{ from: "elena@brightwell.io", to: "alex@brightwell.io", body: "Can we move our check-in to Tuesday or Wednesday?", receivedAt: hoursAgo(2) }] },
  { _id: "demo-4", accountId: "lakeshore", senderName: "Sam Ortiz", senderEmail: "sam@lakeshore.co", subject: "Invoice for January", summary: "Invoice #1043 for $4,200 is attached. Please confirm and let me know if anything changes.", category: "action-required", replyResponsibility: "assistant", responsibilityReason: "Routine invoice confirmation can be handled by the assistant.", status: "open", isUnread: true, isImportant: false, lastMessageAt: hoursAgo(3), clientLabel: "Lakeshore Creative", messages: [{ from: "sam@lakeshore.co", to: "alex@lakeshore.co", body: "Invoice #1043 for $4,200 is attached. Please confirm receipt.", receivedAt: hoursAgo(3) }] },
  { _id: "demo-5", accountId: "everline", senderName: "Priya Shah", senderEmail: "priya@everline.ai", subject: "Project kickoff materials", summary: "Sharing the kickoff deck for your review. Any comments before we send to the team?", category: "action-required", replyResponsibility: "client", responsibilityReason: "This requests the client's review of project material.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(5), clientLabel: "Everline AI", messages: [{ from: "priya@everline.ai", to: "alex@everline.ai", body: "Sharing the kickoff deck for your review. Any comments before we send to the team?", receivedAt: hoursAgo(5) }] },
  { _id: "demo-6", accountId: "northstar", senderName: "Daniel Kim", senderEmail: "daniel@northstar.studio", subject: "Revised scope and pricing", summary: "Updated scope based on our call. Let me know if this works, and I'll send the final contract.", category: "action-required", replyResponsibility: "assistant", responsibilityReason: "The assistant can coordinate the revised scope before approval.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(6), clientLabel: "Northstar Studio", messages: [{ from: "daniel@northstar.studio", to: "alex@northstar.studio", body: "Updated scope based on our call. Let me know if this works, and I'll send the final contract.", receivedAt: hoursAgo(6) }] },
  { _id: "demo-7", accountId: "starlight", senderName: "Anna Russo", senderEmail: "anna@starlightpr.com", subject: "Press inquiry — product launch", summary: "A reporter is requesting a comment on the launch. Who should respond?", category: "action-required", replyResponsibility: "review", responsibilityReason: "The assistant should confirm who is authorized to speak for the client.", status: "open", isUnread: true, isImportant: true, lastMessageAt: hoursAgo(8), clientLabel: "Starlight PR", messages: [{ from: "anna@starlightpr.com", to: "alex@starlightpr.com", body: "A reporter is requesting a comment on the launch. Who should respond?", receivedAt: hoursAgo(8) }] },
  { _id: "demo-8", accountId: "riverside", senderName: "Chris Lee", senderEmail: "chris@riverside.co", subject: "Team offsite dates", summary: "Sharing a few date options for the offsite. Please let me know which works best.", category: "meetings", replyResponsibility: "client", responsibilityReason: "The client should choose a preferred date.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(11), clientLabel: "Riverside Co.", messages: [{ from: "chris@riverside.co", to: "alex@riverside.co", body: "Sharing a few date options for the offsite. Please let me know which works best.", receivedAt: hoursAgo(11) }] },
  { _id: "demo-9", accountId: "brightwell", senderName: "Taylor Nguyen", senderEmail: "taylor@brightwell.io", subject: "Budget update", summary: "Updated Q1 budget is attached. Can you review and confirm we're good to proceed?", category: "action-required", replyResponsibility: "assistant", responsibilityReason: "The assistant can prepare the budget for the client's decision.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(14), clientLabel: "Brightwell", messages: [{ from: "taylor@brightwell.io", to: "alex@brightwell.io", body: "Updated Q1 budget is attached. Can you review and confirm we're good to proceed?", receivedAt: hoursAgo(14) }] },
  { _id: "demo-10", accountId: "lakeshore", senderName: "Morgan Reed", senderEmail: "morgan@lakeshore.co", subject: "Event space booking", summary: "The venue holds our date until March 18. Let me know if you'd like me to confirm and pay the deposit.", category: "action-required", replyResponsibility: "client", responsibilityReason: "The client should approve the booking and deposit.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(17), clientLabel: "Lakeshore Creative", messages: [{ from: "morgan@lakeshore.co", to: "alex@lakeshore.co", body: "The venue holds our date until March 18. Let me know if you'd like me to confirm and pay the deposit.", receivedAt: hoursAgo(17) }] },
  { _id: "demo-11", accountId: "northstar", senderName: "Olivia Brooks", senderEmail: "olivia@northstar.studio", subject: "Travel approval for next week", summary: "The booking window closes tomorrow. Should I confirm the itinerary?", category: "action-required", replyResponsibility: "review", responsibilityReason: "The assistant can arrange travel, but the client may need to approve this itinerary.", status: "open", isUnread: true, isImportant: false, lastMessageAt: hoursAgo(20), clientLabel: "Northstar Studio", messages: [{ from: "olivia@northstar.studio", to: "alex@northstar.studio", body: "The booking window closes tomorrow. Should I confirm the itinerary?", receivedAt: hoursAgo(20) }] },
  ...extraPreview.map(([senderName, subject, accountId, clientLabel, replyResponsibility], index): Conversation => {
    const senderEmail = `${senderName.toLowerCase().replace(" ", ".")}@example.test`;
    const receivedAt = hoursAgo(21 + index);
    const responsibilityReason = replyResponsibility === "none" ? "This message is informational and needs no response." : replyResponsibility === "client" ? "The client should make this decision personally." : "The assistant can coordinate this next step.";
    return { _id: `demo-${12 + index}`, accountId, senderName, senderEmail, subject, summary: subject, category: "action-required", replyResponsibility, responsibilityReason, status: "open", isUnread: false, isImportant: false, lastMessageAt: receivedAt, clientLabel, messages: [{ from: senderEmail, to: "assistant@example.test", body: `Following up about ${subject.toLowerCase()}. Please let me know the next step.`, receivedAt }] };
  }),
];

const nav: { id: Segment; label: string; icon: typeof Inbox }[] = [
  { id: "all", label: "Inbox", icon: Inbox },
  { id: "review", label: "Needs review", icon: Flag },
  { id: "assistant", label: "Assigned to me", icon: UserRound },
  { id: "client", label: "Assigned to clients", icon: UsersRound },
  { id: "no-reply", label: "No reply", icon: Clock3 },
  { id: "done", label: "Archive", icon: CheckCircle2 },
];

function formatAge(date: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m` : minutes < 24 * 60 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / 1440)}d`;
}
function formatDate(date: string) { return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date)); }
function responsibilityLabel(value: Responsibility) { return ({ assistant: "Assistant", client: "Client", none: "No reply", review: "Needs review" } as const)[value]; }
function matchesSegment(item: Conversation, segment: Segment) {
  if (segment === "done") return item.status === "handled";
  if (item.status !== "open") return false;
  return segment === "all" || item.replyResponsibility === (segment === "no-reply" ? "none" : segment);
}
async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => { try { return JSON.parse(localStorage.getItem("relay-session") || "null"); } catch { return null; } });
  const [items, setItems] = useState<Conversation[]>(preview);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [segment, setSegment] = useState<Segment>("all");
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const [accountFilter, setAccountFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(preview[0]._id);
  const [selectedDetail, setSelectedDetail] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>(() => {
    const initial = Object.fromEntries(preview.map(item => [item._id, { responsibility: item._id === "demo-1" ? "client" : item.replyResponsibility, reason: item.responsibilityReason }]));
    try { return { ...initial, ...JSON.parse(sessionStorage.getItem("relay-suggestions") || "{}") }; }
    catch { return initial; }
  });
  const authDialogRef = useRef<HTMLElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (session) localStorage.setItem("relay-session", JSON.stringify(session)); else localStorage.removeItem("relay-session"); }, [session]);
  useEffect(() => { sessionStorage.setItem("relay-suggestions", JSON.stringify(suggestions)); }, [suggestions]);
  useEffect(() => {
    if (!authOpen) return;
    authDialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setAuthOpen(false); return; }
      if (event.key !== "Tab" || !authDialogRef.current) return;
      const focusable = [...authDialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); accountButtonRef.current?.focus(); };
  }, [authOpen]);
  useEffect(() => {
    if (!session) { setItems(preview); setAccounts([]); return; }
    let active = true;
    setLoading(true);
    Promise.all([
      request<{ conversations: Conversation[] }>("/conversations", session.token),
      request<{ accounts: Account[] }>("/accounts", session.token),
    ]).then(([conversations, accountData]) => {
      if (!active) return;
      setItems(conversations.conversations);
      setSuggestions(current => {
        const next = { ...current };
        for (const item of conversations.conversations) if (!next[item._id] && item.responsibilityReason !== "Manually assigned by the assistant.") next[item._id] = { responsibility: item.replyResponsibility, reason: item.responsibilityReason };
        return next;
      });
      setAccounts(accountData.accounts);
      setSelectedId(current => conversations.conversations.some(item => item._id === current) ? current : conversations.conversations[0]?._id ?? null);
      setError("");
    }).catch((cause: Error) => { if (active) setError(`${cause.message}. Check that the API and MongoDB are running.`); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);
  useEffect(() => {
    if (!session || !selectedId) { setSelectedDetail(null); return; }
    let active = true;
    request<{ conversation: Conversation }>(`/conversations/${selectedId}`, session.token).then(({ conversation }) => {
      if (active) setSelectedDetail(conversation);
    }).catch(() => { if (active) setSelectedDetail(null); });
    return () => { active = false; };
  }, [selectedId, session, items]);

  const selected = useMemo(() => selectedDetail?._id === selectedId ? selectedDetail : items.find(item => item._id === selectedId) ?? null, [selectedDetail, selectedId, items]);
  const selectedSuggestion = selected ? suggestions[selected._id] : undefined;
  const filtered = useMemo(() => items.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.senderName, item.senderEmail, item.subject, item.summary].some(value => value.toLowerCase().includes(query));
    return matchesSearch && matchesSegment(item, segment) && (statusFilter === "all" || item.status === "open") && (accountFilter === "all" || item.accountId === accountFilter);
  }), [items, search, segment, statusFilter, accountFilter]);
  useEffect(() => {
    if (filtered.some(item => item._id === selectedId)) return;
    setSelectedId(filtered[0]?._id ?? null);
    setSelectedDetail(null);
  }, [filtered, selectedId]);
  const counts = useMemo(() => Object.fromEntries(nav.map(entry => [entry.id, items.filter(item => matchesSegment(item, entry.id)).length])) as Record<Segment, number>, [items]);
  const accountName = (item: Conversation) => item.clientLabel || accounts.find(account => account._id === item.accountId)?.email || "Client account";

  async function updateConversation(changes: Partial<Pick<Conversation, "replyResponsibility" | "status" | "isImportant" | "isUnread">>) {
    if (!selected || busy || (session && session.user.role !== "assistant")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (!suggestions[selected._id] && selected.responsibilityReason !== "Manually assigned by the assistant.") setSuggestions(current => ({ ...current, [selected._id]: { responsibility: selected.replyResponsibility, reason: selected.responsibilityReason } }));
      const updated = session
        ? (await request<{ conversation: Conversation }>(`/conversations/${selected._id}`, session.token, { method: "PATCH", body: JSON.stringify(changes) })).conversation
        : { ...selected, ...changes, responsibilityReason: changes.replyResponsibility ? "Manually assigned by the assistant." : selected.responsibilityReason };
      const nextItems = items.map(item => item._id === updated._id ? { ...item, ...updated } : item);
      setItems(nextItems);
      setSelectedDetail(updated);
      const query = search.trim().toLowerCase();
      const nextVisible = nextItems.filter(item =>
        (!query || [item.senderName, item.senderEmail, item.subject, item.summary].some(value => value.toLowerCase().includes(query))) &&
        matchesSegment(item, segment) && (statusFilter === "all" || item.status === "open") &&
        (accountFilter === "all" || item.accountId === accountFilter));
      if (!nextVisible.some(item => item._id === selected._id)) setSelectedId(nextVisible[0]?._id ?? null);
      setNotice(changes.status === "handled" ? "Conversation marked done." : `Responsibility updated to ${responsibilityLabel(updated.replyResponsibility).toLowerCase()}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update conversation."); }
    finally { setBusy(false); }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not sign in.");
      setSession(data); setAuthOpen(false); setAuthPassword(""); setNotice("Connected to the local API.");
    } catch (cause) { setError(cause instanceof Error ? `${cause.message} Check that the API is running.` : "Could not sign in."); }
    finally { setBusy(false); }
  }

  async function setupDemo(event: FormEvent) {
    event.preventDefault(); if (!session) return;
    setBusy(true); setError("");
    try {
      const { user } = await request<{ user: User }>("/auth/clients", session.token, { method: "POST", body: JSON.stringify({ name: clientName, email: clientEmail, password: clientPassword }) });
      const { account } = await request<{ account: Account }>("/accounts/connect", session.token, { method: "POST", body: JSON.stringify({ clientId: user.id, provider: "gmail", email: clientEmail }) });
      await request(`/accounts/${account._id}/sample`, session.token, { method: "POST" });
      const [conversationData, accountData] = await Promise.all([request<{ conversations: Conversation[] }>("/conversations", session.token), request<{ accounts: Account[] }>("/accounts", session.token)]);
      setItems(conversationData.conversations); setAccounts(accountData.accounts); setSelectedId(conversationData.conversations[0]?._id ?? null);
      setNotice("Sample inbox loaded. No live email was connected.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load sample inbox."); }
    finally { setBusy(false); }
  }

  function chooseSegment(value: Segment) { setSegment(value); setStatusFilter(value === "done" ? "all" : "open"); setMobileOpen(false); setMobileDetail(false); }
  function selectItem(item: Conversation) { setSelectedId(item._id); setSelectedDetail(null); setThreadExpanded(false); setMobileDetail(true); }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Inbox navigation">
      <div className="brand-row"><div><span className="brand">Relay</span><small>Assistant</small></div><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <nav className="nav-list" aria-label="Conversation queues">
        {nav.filter(entry => entry.id !== "no-reply").map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${segment === id ? "active" : ""}`} onClick={() => chooseSegment(id)} aria-current={segment === id ? "page" : undefined}>
          <Icon size={20} strokeWidth={2} aria-hidden="true" /><span>{label}</span>{id === "review" && <strong>{counts.review}</strong>}
        </button>)}
      </nav>
      <div className="sidebar-demo"><Inbox size={17} aria-hidden="true" />Demo inbox</div>
      <div className="sidebar-bottom"><button ref={accountButtonRef} className="sidebar-account" aria-label={session ? "Sign out" : "Sign in to local API"} onClick={() => session ? (setSession(null), setNotice("Signed out. Showing preview data.")) : setAuthOpen(true)}><UserRound size={18} aria-hidden="true" />{session ? `Sign out · ${session.user.name.split(" ")[0]}` : "Sign in"}</button></div>
    </aside>

    <main className={`dashboard-main ${mobileDetail ? "show-detail" : ""}`}>
      <div className="mobile-head"><button className="icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={22} /></button><strong>Relay</strong><span>Demo · no live sync</span></div>
      <div className="dashboard-heading"><h1>Demo inbox</h1><p>Relay assistant for client email <span aria-hidden="true">·</span> Demo inbox, no live sync</p></div>
      <div className="dashboard-columns">
        <section className={`inbox-pane ${mobileDetail ? "mobile-hidden" : ""}`} aria-label="Assistant inbox">
          <div className="list-toolbar">
            <label className="global-search"><Search size={20} aria-hidden="true" /><span className="sr-only">Search conversations</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" /></label>
            <label><span className="sr-only">Filter by client account</span><select value={accountFilter} onChange={event => setAccountFilter(event.target.value)}><option value="all">All clients</option>{(session ? accounts.map(account => ({ id: account._id, label: account.email })) : [...new Map(preview.map(item => [item.accountId, { id: item.accountId, label: item.clientLabel! }])).values()]).map(account => <option key={account.id} value={account.id}>{account.label}</option>)}</select></label>
            <label><span className="sr-only">Filter by responsibility</span><select value={segment === "done" ? "all" : segment} onChange={event => chooseSegment(event.target.value as Segment)}><option value="all">All responsibility</option><option value="review">Needs review</option><option value="assistant">Assistant</option><option value="client">Client</option><option value="no-reply">No reply</option></select></label>
            <label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "open" | "all")}><option value="open">Open</option><option value="all">All status</option></select></label>
          </div>
          <div className="list-meta"><span>{filtered.length} conversations</span><span>Sort: Most recent <ChevronDown size={15} aria-hidden="true" /></span></div>
          {error && <div className="message-banner error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
          {notice && <div className="message-banner success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button></div>}
          {loading ? <div className="empty-state" role="status">Loading conversations…</div> : filtered.length ? <div className="conversation-table" role="table" aria-label="Conversations">
            <div className="table-head" role="row"><span role="columnheader">Sender</span><span role="columnheader">Subject</span><span role="columnheader">Client</span><span role="columnheader">Time</span><span role="columnheader">Responsibility</span></div>
            <div className="table-body">{filtered.map(item => <button key={item._id} className={`conversation-row ${selectedId === item._id ? "selected" : ""}`} onClick={() => selectItem(item)} aria-label={`${item.senderName}, ${item.subject}, ${responsibilityLabel(item.replyResponsibility)}${item.isUnread ? ", unread" : ""}`} aria-current={selectedId === item._id ? "true" : undefined}><span className="sender-cell"><i className={`unread-marker ${selectedId === item._id ? "active" : ""}`} aria-hidden="true" /><strong>{item.senderName}</strong></span><span className="subject-cell">{item.subject}</span><span className="client-cell">{accountName(item)}</span><span className="age-cell">{formatAge(item.lastMessageAt)}</span><span className={`responsibility-badge ${item.replyResponsibility}`}>{responsibilityLabel(item.replyResponsibility)}</span></button>)}</div>
          </div> : <div className="empty-state"><Inbox size={28} /><h2>{session && !items.length ? "No conversations yet" : "No conversations found"}</h2><p>{session && !items.length ? "Create a client and load the sample inbox to explore this prototype." : "Try a different search or filter."}</p>{session && !items.length && <form className="setup-form" onSubmit={setupDemo}><label>Client name<input required value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Alex Morgan" /></label><label>Client email<input required type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="alex@example.com" /></label><label>Client password<input required minLength={8} type="password" value={clientPassword} onChange={event => setClientPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="primary-button" disabled={busy}>{busy ? "Loading…" : "Create client and load sample inbox"}</button></form>}</div>}
        </section>

        <aside className={`right-rail ${mobileDetail ? "mobile-visible" : ""}`} aria-label="Review and conversation detail">
          <button className="review-banner" onClick={() => chooseSegment("review")} aria-label={`Show ${counts.review} conversations needing review`}><span className="review-banner-title"><Flag size={26} aria-hidden="true" />Needs review <b>{counts.review}</b></span><small>Conversations that need a decision or next step.</small></button>
          <section className="detail-pane" aria-label="Selected conversation">
            <button className="back-to-list" onClick={() => setMobileDetail(false)}>← Back to inbox</button>
            {selected ? <><div className="detail-header"><div><h2>{selected.senderName} — {selected.subject}</h2><p>{accountName(selected)} <span aria-hidden="true">·</span> {formatDate(selected.lastMessageAt)}</p></div><label className="status-control"><span className="sr-only">Conversation status</span><select value={selected.status} disabled={busy || session?.user.role === "client"} onChange={event => updateConversation({ status: event.target.value as Status })}><option value="open">Open</option><option value="handled">Done</option></select></label></div>
              <div className="suggestion-card"><div className="suggestion-heading"><Sparkles size={18} aria-hidden="true" /><strong>{selectedSuggestion ? "Relay suggestion" : "Current responsibility"}</strong></div><strong className="suggestion-decision">{selectedSuggestion?.responsibility === "review" ? "Ownership needs review." : selectedSuggestion?.responsibility === "none" ? "No reply needed." : selectedSuggestion ? `${responsibilityLabel(selectedSuggestion.responsibility)} should reply.` : `${responsibilityLabel(selected.replyResponsibility)} assigned.`}</strong><p><b>Rationale:</b> {selectedSuggestion?.reason || selected.responsibilityReason}</p></div>
              {session?.user.role !== "client" && <div className="assignment-actions"><button className="primary-button" disabled={busy || selected.status === "handled"} onClick={() => updateConversation({ replyResponsibility: "client" })}><Forward size={23} /> Assign to client</button><label className="other-assignment"><span>Other assignment</span><select value="" disabled={busy || selected.status === "handled"} onChange={event => updateConversation({ replyResponsibility: event.target.value as Responsibility })}><option value="" disabled>Choose responsibility</option><option value="assistant">Assistant</option><option value="none">No reply</option><option value="review">Needs review</option></select></label></div>}
              <div className="ownership"><h3>Ownership route</h3><div className="route-track"><span className="route-node complete"><Check size={13} /></span><span className="route-line solid" /><span className={`route-node ${selected.replyResponsibility !== "review" ? "complete" : ""}`}>{selected.replyResponsibility !== "review" && <Check size={13} />}</span><span className="route-line" /><span className="route-node" /></div><div className="route-labels"><div><strong>AI suggestion</strong><small>{selectedSuggestion ? responsibilityLabel(selectedSuggestion.responsibility) : "Not recorded"}</small></div><div><strong>Your assignment</strong><small>{selected.replyResponsibility === "review" ? "Assign owner" : responsibilityLabel(selected.replyResponsibility)}</small></div><div><strong>Next action</strong><small>{selected.status === "handled" ? "Done" : selected.replyResponsibility === "client" ? "Client replies" : selected.replyResponsibility === "assistant" ? "Assistant replies" : selected.replyResponsibility === "none" ? "No reply" : "Pending"}</small></div></div></div>
              <div className="thread"><div className="thread-heading"><h3>Thread</h3><span>{selected.messages?.length || 0} messages</span></div>{selected.messages?.length ? [...selected.messages].reverse().slice(0, threadExpanded ? undefined : 3).map((message, index) => <article className="message" key={`${message.receivedAt}-${index}`}><span className="message-avatar">{message.from === selected.senderEmail ? selected.senderName.split(" ").map(word => word[0]).join("").slice(0, 2) : "A"}</span><div><div className="message-meta"><strong>{message.from === selected.senderEmail ? selected.senderName : "Assistant"}</strong><time dateTime={message.receivedAt}>{formatDate(message.receivedAt)}</time></div>{threadExpanded && <small className="message-to">To: {message.to}</small>}<p>{message.body}</p>{selected._id === "demo-1" && index === 0 && <span className="demo-attachment">Service_Agreement_v3.pdf · sample attachment</span>}</div></article>) : <p className="thread-empty">No messages in this conversation.</p>}</div>
              <button className="full-conversation" onClick={() => setThreadExpanded(!threadExpanded)}>{threadExpanded ? "Show compact thread" : "Open full conversation"}</button>
            </> : <div className="empty-detail"><Bell size={24} /><h2>Select a conversation</h2><p>Review its messages and decide who should reply.</p></div>}
          </section>
        </aside>
      </div>
    </main>

    {authOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section ref={authDialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="dialog-close icon-button" aria-label="Close sign in" onClick={() => setAuthOpen(false)}><X size={20} /></button><h2 id="auth-title">{authMode === "login" ? "Sign in to Relay" : "Create assistant account"}</h2><p>Connect to the local prototype API. The inbox will use your stored demo conversations.</p>{error && <div className="auth-error" role="alert">{error}</div>}<form onSubmit={submitAuth}>{authMode === "signup" && <label>Name<input required value={authName} onChange={event => setAuthName(event.target.value)} autoComplete="name" /></label>}<label>Email<input required type="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} autoComplete="email" /></label><label>Password<input required minLength={8} type="password" value={authPassword} onChange={event => setAuthPassword(event.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label><button className="primary-button" disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}</button></form><button className="mode-switch" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>{authMode === "login" ? "New assistant? Create an account" : "Already have an account? Sign in"}</button></section></div>}
  </div>;
}
