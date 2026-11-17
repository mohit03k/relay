import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Inbox, X } from "lucide-react";
import "./client.css";
import { apiUrl } from "./apiUrl";

type Session = { token: string; user: { id: string; name: string; role: "assistant" | "client" } };
type Message = { from: string; to: string; body: string; receivedAt: string };
type ClientConversation = {
  _id: string; senderName: string; senderEmail: string; subject: string;
  summary: string; responsibilityReason: string; classificationSource?: string;
  lastMessageAt: string; messages?: Message[];
  replyResponsibility?: string; status?: string; clientAction?: string; clientActionAt?: string;
};

function storedSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("relay-session") || "null") as Session | null; }
  catch { return null; }
}

function previewConversations(): ClientConversation[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem("relay-preview-items") || "[]");
    return Array.isArray(saved) ? saved.filter((item: ClientConversation) => item.replyResponsibility === "client" && item.status === "open") : [];
  } catch { return []; }
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}

function dateLabel(date: string, withTime = false) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {})
  }).format(new Date(date));
}

export default function ClientView() {
  const [session] = useState(storedSession);
  const previewMode = !session && sessionStorage.getItem("relay-client-preview") === "true";
  const [items, setItems] = useState<ClientConversation[]>(previewMode ? previewConversations : []);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientConversation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasAssistantDemo = !!sessionStorage.getItem("relay-assistant-session");

  useEffect(() => {
    if (previewMode) { setLoading(false); return; }
    if (session?.user.role !== "client") { setLoading(false); return; }
    let active = true;
    api<{ conversations: ClientConversation[] }>("/conversations", session.token)
      .then(({ conversations }) => { if (active) { setItems(conversations); setError(""); } })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, previewMode]);

  useEffect(() => {
    if (previewMode) {
      setDetail(items.find(item => item._id === detailId) || null);
      return;
    }
    if (!detailId || session?.user.role !== "client") return;
    let active = true;
    setDetail(null); setDetailLoading(true);
    api<{ conversation: ClientConversation }>(`/conversations/${detailId}`, session.token)
      .then(({ conversation }) => { if (active) setDetail(conversation); })
      .catch((cause: Error) => { if (active) { setError(cause.message); setDetailId(null); } })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [detailId, session, previewMode]);

  useEffect(() => {
    if (!detailId) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDetailId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detailId]);

  async function act(item: ClientConversation, action: "handled" | "takeover") {
    if ((!session && !previewMode) || busyId) return;
    setBusyId(item._id); setError(""); setNotice("");
    try {
      if (previewMode) {
        const all = JSON.parse(sessionStorage.getItem("relay-preview-items") || "[]") as ClientConversation[];
        sessionStorage.setItem("relay-preview-items", JSON.stringify(all.map(entry => entry._id === item._id
          ? {
            ...entry, status: action === "handled" ? "handled" : "open",
            replyResponsibility: action === "takeover" ? "assistant" : entry.replyResponsibility,
            responsibilityReason: action === "takeover" ? "The client asked the assistant to take over this conversation." : entry.responsibilityReason,
            clientAction: action, clientActionAt: new Date().toISOString()
          }
          : entry)));
      } else {
        await api(`/conversations/${item._id}/client-action`, session!.token, { method: "PATCH", body: JSON.stringify({ action }) });
      }
      setItems(current => current.filter(entry => entry._id !== item._id));
      setDetailId(null); setDetail(null);
      setNotice(action === "handled" ? "Marked handled. Your assistant can see the update." : "Passed to your assistant. They can see your request.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this matter."); }
    finally { setBusyId(null); }
  }

  function signOut() {
    localStorage.removeItem("relay-session");
    sessionStorage.removeItem("relay-assistant-session");
    window.location.assign("/signin");
  }

  function returnToAssistant() {
    if (previewMode) {
      sessionStorage.removeItem("relay-client-preview");
      window.location.assign("/inbox");
      return;
    }
    const saved = sessionStorage.getItem("relay-assistant-session");
    if (!saved) return;
    localStorage.setItem("relay-session", saved);
    sessionStorage.removeItem("relay-assistant-session");
    window.location.assign("/inbox");
  }

  if (session?.user.role !== "client" && !previewMode) return <div className="client-access"><span className="client-brand">Relay</span><div><h1>Client space</h1><p>Sign in with a client account to see only matters that need your response.</p><a href={session ? "/inbox" : "/signin"}>{session ? "Return to assistant inbox" : "Sign in"} <ArrowRight size={17} /></a></div></div>;

  return <div className="client-app">
    <header className="client-topbar"><div className="client-topbar-inner"><a href="/client" className="client-brand">Relay<span>Client space</span></a><div className="client-topbar-actions"><span>{previewMode ? "Sample client" : session!.user.name}</span>{(hasAssistantDemo || previewMode) && <button onClick={returnToAssistant}><ArrowLeft size={16} /> Assistant demo</button>}{!previewMode && <button onClick={signOut}>Sign out</button>}</div></div></header>
    <main className="client-main"><div className="client-intro"><div><span className="client-eyebrow">FOR YOUR ATTENTION</span><h1>Needs your response</h1><p>Only conversations that need your personal input appear here.</p></div><strong className="client-count">{items.length} {items.length === 1 ? "matter" : "matters"}</strong></div>
      {notice && <div className="client-notice" role="status"><Check size={17} />{notice}<button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16} /></button></div>}
      {error && <div className="client-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
      {loading ? <div className="client-empty" role="status">Loading your matters…</div> : items.length ? <div className="client-list">{items.map(item => <article className="client-card" key={item._id}><div className="client-card-top"><span className="client-sender">From {item.senderName}</span><time dateTime={item.lastMessageAt}>{dateLabel(item.lastMessageAt)}</time></div><h2>{item.subject}</h2><p className="client-summary">{item.summary}</p><div className="client-reason"><span>WHY YOU</span><p>{item.responsibilityReason}</p></div><div className="client-card-actions"><button className="client-review" onClick={() => setDetailId(item._id)}>Review conversation <ArrowRight size={16} /></button><button className="client-handled" disabled={!!busyId} onClick={() => act(item, "handled")}><Check size={17} /> Mark handled</button><button className="client-takeover" disabled={!!busyId} onClick={() => act(item, "takeover")}>Ask assistant to take over</button></div></article>)}</div> : <div className="client-empty"><Inbox size={30} /><h2>You're all caught up</h2><p>There are no conversations waiting for your response.</p></div>}
      <p className="client-footnote">Sample inbox · No live email is connected or sent from this view.</p>
    </main>
    {detailId && <div className="client-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDetailId(null); }}><section className="client-thread-dialog" role="dialog" aria-modal="true" aria-labelledby="client-thread-title"><button ref={closeRef} className="client-thread-close" onClick={() => setDetailId(null)} aria-label="Close conversation"><X size={20} /></button>{detailLoading || !detail ? <h2 id="client-thread-title">Loading conversation…</h2> : <><span className="client-eyebrow"><i /> ORIGINAL CONVERSATION</span><h2 id="client-thread-title">{detail.subject}</h2><p className="client-thread-subtitle">{detail.senderName} · {detail.senderEmail}</p><div className="client-thread-messages">{detail.messages?.map((message, index) => <article key={`${message.receivedAt}-${index}`}><div><strong>{message.from}</strong><time dateTime={message.receivedAt}>{dateLabel(message.receivedAt, true)}</time></div><p>{message.body}</p><small>To: {message.to}</small></article>)}</div><div className="client-thread-actions"><button className="client-handled" disabled={busyId === detail._id} onClick={() => act(detail, "handled")}><Check size={17} /> Mark handled</button><button className="client-takeover" disabled={busyId === detail._id} onClick={() => act(detail, "takeover")}>Ask assistant to take over</button></div></>}</section></div>}
  </div>;
}
