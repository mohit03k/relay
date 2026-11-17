import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Archive, Bell, CheckCircle2, ChevronDown, Clock3, Flag, Forward,
  Inbox, Mail, PanelLeftClose, PanelLeftOpen, Search, Sparkles, Star, UserRound, UsersRound, X,
} from "lucide-react";
import Landing from "./Landing";
import Onboarding from "./Onboarding";
import ClientView from "./ClientView";

type Responsibility = "assistant" | "client" | "none" | "review";
type Status = "open" | "handled" | "archived";
type Category = "action-required" | "waiting" | "meetings" | "important" | "general";
type Segment = "all" | "review" | "assistant" | "client" | "no-reply" | "general" | "done";
type ViewFilter = "all" | "unread" | "action" | "waiting" | "important" | "meetings";
type Suggestion = { responsibility: Responsibility; reason: string };
type Insights = { keyPoints?: string[]; dates?: { label: string; when: string }[];
  followUp?: { waitingOn: string; nextStep: string; due: string }; followUpResolved?: boolean };
type Classification = Insights & { replyResponsibility: Responsibility; responsibilityReason: string; summary: string; category: Category; isImportant: boolean; confidence: number };
type User = { id: string; name: string; email: string; role: "assistant" | "client" };
type Session = { token: string; user: User };
type Account = { _id: string; email: string; provider: "gmail" | "outlook" };
type Message = { from: string; to: string; body: string; receivedAt: string };
type Conversation = Insights & {
  _id: string; accountId: string; subject: string; senderName: string; senderEmail: string;
  summary: string; category: Category; replyResponsibility: Responsibility;
  responsibilityReason: string; status: Status; isUnread: boolean; isImportant: boolean;
  draftReply?: string;
  draftApproved?: boolean;
  lastMessageAt: string; messages?: Message[]; clientLabel?: string;
  classificationSource?: "sample" | "ai" | "manual"; classificationModel?: string;
  suggestedResponsibility?: Responsibility; suggestedReason?: string;
  clientAction?: "handled" | "takeover"; clientActionAt?: string;
};

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
const extraPreview: Array<[string, string, string, string, Responsibility]> = [
  ["Noah Grant", "Updated project timeline", "riverside", "Riverside Co.", "none"],
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
  { _id: "demo-2", accountId: "riverside", senderName: "Jordan Miles", senderEmail: "jordan@riverside.co", subject: "Q1 campaign assets", summary: "Sending the final assets for review and approval. Are we still on track for Friday?", dates: [{ label: "Campaign timeline check", when: "Friday" }], category: "action-required", replyResponsibility: "assistant", responsibilityReason: "The assistant can coordinate the campaign review and confirm the timeline.", status: "open", isUnread: true, isImportant: false, lastMessageAt: hoursAgo(.6), clientLabel: "Riverside Co.", messages: [{ from: "jordan@riverside.co", to: "alex@riverside.co", body: "Sending the final assets for review and approval. Are we still on track for Friday?", receivedAt: hoursAgo(.6) }] },
  { _id: "demo-3", accountId: "brightwell", senderName: "Elena Park", senderEmail: "elena@brightwell.io", subject: "Meeting time next week?", summary: "Can we move our check-in to Tue or Wed? I have a conflict on Mon afternoon.", dates: [{ label: "Proposed check-in", when: "Tuesday or Wednesday" }], category: "meetings", replyResponsibility: "client", responsibilityReason: "The client should confirm their preferred meeting time.", status: "open", isUnread: false, isImportant: false, lastMessageAt: hoursAgo(2), clientLabel: "Brightwell", messages: [{ from: "elena@brightwell.io", to: "alex@brightwell.io", body: "Can we move our check-in to Tuesday or Wednesday?", receivedAt: hoursAgo(2) }] },
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
    const waiting = index === 0;
    const responsibilityReason = waiting ? "The updated timeline was sent. No action is needed while waiting for Noah's response." : replyResponsibility === "none" ? "This message is informational and needs no response." : replyResponsibility === "client" ? "The client should make this decision personally." : "The assistant can coordinate this next step.";
    return { _id: `demo-${12 + index}`, accountId, senderName, senderEmail, subject, summary: waiting ? "The updated timeline was sent; awaiting Noah's confirmation." : subject, category: waiting ? "waiting" : "action-required", replyResponsibility, responsibilityReason, status: "open", isUnread: false, isImportant: false, lastMessageAt: receivedAt, clientLabel, messages: [{ from: waiting ? "assistant@example.test" : senderEmail, to: waiting ? senderEmail : "assistant@example.test", body: waiting ? "Hi Noah, I sent the updated project timeline. Please let me know if the dates work for your team." : `Following up about ${subject.toLowerCase()}. Please let me know the next step.`, receivedAt }] };
  }),
];

function previewItems(): Conversation[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem("relay-preview-items") || "null");
    return Array.isArray(saved) && saved.length ? (saved as Conversation[]).map(item => {
      const currentSample = preview.find(sample => sample._id === item._id);
      return currentSample ? { ...currentSample, ...item, dates: item.dates ?? currentSample.dates } : item;
    }) : preview;
  } catch { return preview; }
}

const nav: { id: Segment; label: string; icon: typeof Inbox }[] = [
  { id: "all", label: "Inbox", icon: Inbox },
  { id: "review", label: "Needs review", icon: Flag },
  { id: "assistant", label: "Assigned to me", icon: UserRound },
  { id: "client", label: "Assigned to clients", icon: UsersRound },
  { id: "no-reply", label: "No reply needed", icon: Clock3 },
  { id: "general", label: "General", icon: Mail },
  { id: "done", label: "Archive", icon: CheckCircle2 },
];

function formatAge(date: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m` : minutes < 24 * 60 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / 1440)}d`;
}
function formatDate(date: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)); }
function responsibilityLabel(value: Responsibility) { return ({ assistant: "Assistant", client: "Client", none: "No reply", review: "Needs review" } as const)[value]; }
function categoryLabel(value: Category) { return ({ "action-required": "Action required", waiting: "Waiting for response", meetings: "Meetings & appointments", important: "Important update", general: "General" } as const)[value]; }
function matchesSegment(item: Conversation, segment: Segment) {
  if (segment === "done") return item.status === "archived";
  if (segment === "all") return true;
  if (item.status !== "open") return false;
  if (segment === "general") return item.category === "general";
  return item.replyResponsibility === (segment === "no-reply" ? "none" : segment);
}
function matchesView(item: Conversation, view: ViewFilter) {
  if (view === "all") return true;
  if (view === "unread") return item.isUnread;
  if (view === "important") return item.isImportant || item.category === "important";
  if (view === "action") return item.category === "action-required";
  if (view === "waiting") return !item.followUpResolved && (item.category === "waiting" || !!item.followUp?.waitingOn);
  return item.category === view;
}
async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}
async function demoRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/demo/${path}`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `AI request failed (${response.status})`);
  return data as T;
}

function Dashboard() {
  useEffect(() => {
    document.documentElement.classList.add("inbox-route");
    return () => document.documentElement.classList.remove("inbox-route");
  }, []);
  const [session, setSession] = useState<Session | null>(() => { try { return JSON.parse(localStorage.getItem("relay-session") || "null"); } catch { return null; } });
  const [items, setItems] = useState<Conversation[]>(previewItems);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [segment, setSegment] = useState<Segment>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const [accountFilter, setAccountFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(preview[0]._id);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("relay-sidebar-collapsed");
    return saved === null ? window.matchMedia("(min-width: 701px) and (max-width: 950px)").matches : saved === "true";
  });
  const [mobileDetail, setMobileDetail] = useState(false);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [reviewingDraft, setReviewingDraft] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"new" | "reply">("new");
  const [simulationAccountId, setSimulationAccountId] = useState("");
  const [simulationSender, setSimulationSender] = useState("Morgan Hale");
  const [simulationEmail, setSimulationEmail] = useState("morgan@example.test");
  const [simulationSubject, setSimulationSubject] = useState("Approval for the proposed venue");
  const [simulationBody, setSimulationBody] = useState("Hi Alex, the venue can hold the date until Friday. Could Alex personally approve the deposit before I confirm the booking?");
  const [simulationError, setSimulationError] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<{ answer: string; conversationIds: string[] } | null>(null);
  const [askError, setAskError] = useState("");
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>(() => {
    const initial = Object.fromEntries(preview.map(item => [item._id, { responsibility: item._id === "demo-1" ? "client" : item.replyResponsibility, reason: item.responsibilityReason }]));
    try { return { ...initial, ...JSON.parse(sessionStorage.getItem("relay-suggestions") || "{}") }; }
    catch { return initial; }
  });
  const authDialogRef = useRef<HTMLElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const assignmentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (session) localStorage.setItem("relay-session", JSON.stringify(session)); else localStorage.removeItem("relay-session"); }, [session]);
  useEffect(() => { localStorage.setItem("relay-sidebar-collapsed", String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { sessionStorage.setItem("relay-suggestions", JSON.stringify(suggestions)); }, [suggestions]);
  useEffect(() => {
    if (!assignmentMenuOpen) return;
    function dismissMenu(event: PointerEvent) {
      if (!assignmentMenuRef.current?.contains(event.target as Node)) setAssignmentMenuOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAssignmentMenuOpen(false);
    }
    document.addEventListener("pointerdown", dismissMenu);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissMenu);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [assignmentMenuOpen]);
  useEffect(() => { setAssignmentMenuOpen(false); }, [selectedId]);
  useEffect(() => {
    if (!simulationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) setSimulationOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [simulationOpen, busy]);
  useEffect(() => {
    if (!askOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) setAskOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [askOpen, busy]);
  useEffect(() => {
    if (!datesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDatesOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [datesOpen]);
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
    if (!session) { setItems(previewItems()); setAccounts([]); return; }
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
        for (const item of conversations.conversations) {
          if (item.suggestedResponsibility && item.suggestedReason) next[item._id] = { responsibility: item.suggestedResponsibility, reason: item.suggestedReason };
          else if (!next[item._id] && item.responsibilityReason !== "Manually assigned by the assistant.") next[item._id] = { responsibility: item.replyResponsibility, reason: item.responsibilityReason };
        }
        return next;
      });
      setAccounts(accountData.accounts);
      setSelectedId(current => conversations.conversations.some(item => item._id === current) ? current : conversations.conversations[0]?._id ?? null);
      setError("");
    }).catch((cause: Error) => { if (active) setError(`${cause.message}. Check that the API and MongoDB are running.`); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);
  useEffect(() => {
    if (session?.user.role !== "assistant") return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      request<{ conversations: Conversation[] }>("/conversations", session.token)
        .then(({ conversations }) => { if (active) setItems(conversations); })
        .catch(() => { /* Keep the current list if the local API is unavailable. */ });
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
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
  const replyDraft = selected ? replyDrafts[selected._id] ?? selected.draftReply ?? "" : "";
  const draftChanged = !!selected && replyDraft !== (selected.draftReply ?? "");
  const selectedSuggestion = selected ? suggestions[selected._id] : undefined;
  const filtered = useMemo(() => items.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.senderName, item.senderEmail, item.subject, item.summary].some(value => value.toLowerCase().includes(query));
    return matchesSearch && matchesSegment(item, segment) && matchesView(item, viewFilter) && (statusFilter === "all" || item.status === "open") && (accountFilter === "all" || item.accountId === accountFilter);
  }), [items, search, segment, viewFilter, statusFilter, accountFilter]);
  useEffect(() => {
    setCheckedIds(current => current.filter(id => filtered.some(item => item._id === id && item.status === "open")));
  }, [filtered]);
  useEffect(() => {
    if (filtered.some(item => item._id === selectedId)) return;
    setSelectedId(filtered[0]?._id ?? null);
    setSelectedDetail(null);
  }, [filtered, selectedId]);
  const counts = useMemo(() => Object.fromEntries(nav.map(entry => [entry.id, items.filter(item => matchesSegment(item, entry.id)).length])) as Record<Segment, number>, [items]);
  const overview = useMemo(() => {
    const open = items.filter(item => item.status === "open");
    return {
      total: items.length,
      unread: open.filter(item => item.isUnread).length,
      action: open.filter(item => matchesView(item, "action")).length,
      waiting: open.filter(item => matchesView(item, "waiting")).length,
      important: open.filter(item => matchesView(item, "important")).length,
      meetings: open.filter(item => item.category === "meetings").length,
      assistant: open.filter(item => item.replyResponsibility === "assistant").length,
      client: open.filter(item => item.replyResponsibility === "client").length,
    };
  }, [items]);
  const dateMentions = useMemo(() => items.filter(item => item.status === "open")
    .flatMap(item => (item.dates || []).map(date => ({ conversation: item, ...date })))
    .slice(0, 12), [items]);
  const accountName = (item: Conversation) => item.clientLabel || accounts.find(account => account._id === item.accountId)?.email || "Client account";
  const demoAccounts = session
    ? accounts.map(account => ({ id: account._id, label: account.email, email: account.email }))
    : [...new Map(preview.map(item => [item.accountId, { id: item.accountId, label: item.clientLabel!, email: "alex@example.test" }])).values()];

  async function simulateEmail(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const accountId = simulationAccountId || demoAccounts[0]?.id;
    if (simulationMode === "new" && !accountId) { setSimulationError("Set up a demo account first."); return; }
    if (simulationMode === "reply" && !selected) { setSimulationError("Select a conversation first."); return; }
    setBusy(true); setSimulationError(""); setError(""); setNotice("");
    try {
      const now = new Date().toISOString();
      let conversation: Conversation;
      let classification: Classification;
      let model: string;
      if (session) {
        const result = await request<{ conversation: Conversation; classification: Classification; model: string }>("/conversations/simulate", session.token, {
          method: "POST",
          body: JSON.stringify({ mode: simulationMode, accountId, conversationId: selected?._id,
            senderName: simulationSender.trim(), senderEmail: simulationEmail.trim(), subject: simulationSubject.trim(), body: simulationBody.trim() }),
        });
        ({ conversation, classification, model } = result);
      } else {
        const account = demoAccounts.find(item => item.id === accountId);
        const message: Message = { from: simulationMode === "reply" ? selected!.senderEmail : simulationEmail.trim(),
          to: account?.email || "alex@example.test", body: simulationBody.trim(), receivedAt: now };
        const messages = simulationMode === "reply" ? [...(selected!.messages || []), message] : [message];
        const response = await fetch("/api/demo/classify", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: simulationMode === "reply" ? selected!.subject : simulationSubject.trim(), accountEmail: message.to, messages }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || `Classification failed (${response.status})`);
        classification = result.classification;
        model = result.model;
        conversation = simulationMode === "reply"
          ? { ...selected!, ...classification, messages, status: "open", isUnread: true, lastMessageAt: now, classificationSource: "ai", classificationModel: model,
              followUpResolved: false, draftApproved: false,
              suggestedResponsibility: classification.replyResponsibility, suggestedReason: classification.responsibilityReason }
          : { _id: `sim-${Date.now()}`, accountId: accountId!, senderName: simulationSender.trim(), senderEmail: simulationEmail.trim(),
            subject: simulationSubject.trim(), messages, ...classification, status: "open", isUnread: true, lastMessageAt: now,
            classificationSource: "ai", classificationModel: model, clientLabel: account?.label,
            suggestedResponsibility: classification.replyResponsibility, suggestedReason: classification.responsibilityReason };
      }
      setItems(current => [conversation, ...current.filter(item => item._id !== conversation._id)]);
      setSuggestions(current => ({ ...current, [conversation._id]: { responsibility: classification.replyResponsibility, reason: classification.responsibilityReason } }));
      setSelectedId(conversation._id); setSelectedDetail(conversation);
      setSegment("all"); setViewFilter("all"); setStatusFilter("open"); setAccountFilter("all"); setSearch("");
      setMobileDetail(true); setSimulationOpen(false);
      setNotice(`AI classified the ${simulationMode === "new" ? "new conversation" : "new reply"} as ${responsibilityLabel(classification.replyResponsibility).toLowerCase()}.`);
    } catch (cause) { setSimulationError(cause instanceof Error ? cause.message : "Could not classify this sample message."); }
    finally { setBusy(false); }
  }

  async function analyzeSelected() {
    if (!selected || busy || !selected.messages?.length) return;
    setBusy(true); setError(""); setNotice("");
    try {
      let updated: Conversation;
      if (session) {
        updated = (await request<{ conversation: Conversation }>(`/conversations/${selected._id}/analyze`, session.token,
          { method: "POST" })).conversation;
      } else {
        const accountEmail = selected.messages.at(-1)?.to || "assistant@example.test";
        const { classification, model } = await demoRequest<{ classification: Classification; model: string }>("classify",
          { subject: selected.subject, accountEmail, messages: selected.messages.slice(-20) });
        updated = { ...selected, summary: classification.summary, keyPoints: classification.keyPoints,
          dates: classification.dates, followUp: classification.followUp,
          classificationModel: model };
      }
      setItems(current => current.map(item => item._id === updated._id ? { ...item, ...updated } : item));
      setSelectedDetail(updated);
      setNotice("Thread insights updated from the conversation.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not analyze this conversation."); }
    finally { setBusy(false); }
  }

  async function suggestReply() {
    if (!selected || busy || !selected.messages?.length) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await demoRequest<{ draft: string }>("assist", { task: "draft", selected: {
        subject: selected.subject, senderName: selected.senderName, senderEmail: selected.senderEmail,
        summary: selected.summary, responsibility: selected.replyResponsibility, reason: selected.responsibilityReason,
        messages: selected.messages.slice(-20),
      } });
      setReplyDrafts(current => ({ ...current, [selected._id]: result.draft }));
      setReviewingDraft(true);
      setNotice("AI reply suggested. Review and edit it before approval.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not suggest a reply."); }
    finally { setBusy(false); }
  }

  async function askInbox(event: FormEvent) {
    event.preventDefault();
    if (!askQuestion.trim() || busy) return;
    if (/\b(draft|write|compose|prepare)\b.*\b(reply|response)\b/i.test(askQuestion)) {
      if (!selected?.messages?.length) { setAskError("Open a conversation before requesting a reply draft."); return; }
      setAskOpen(false);
      await suggestReply();
      return;
    }
    setBusy(true); setAskError(""); setAskAnswer(null);
    try {
      const result = await demoRequest<{ answer: string; conversationIds: string[] }>("assist", { task: "ask",
        question: askQuestion.trim(), conversations: items.slice(0, 40).map(item => ({
          id: item._id, sender: item.senderName, subject: item.subject, summary: item.summary,
          responsibility: item.replyResponsibility, reason: item.responsibilityReason, category: item.category,
          status: item.status, followUp: item.followUpResolved ? "Resolved" : item.followUp
            ? [item.followUp.waitingOn, item.followUp.nextStep, item.followUp.due].filter(Boolean).join("; ") : "",
          keyPoints: item.keyPoints?.join("; ") || "", dates: item.dates?.map(date => `${date.label}: ${date.when}`).join("; ") || "",
        })), selected: selected?.messages?.length ? {
          subject: selected.subject, senderName: selected.senderName, senderEmail: selected.senderEmail,
          summary: selected.summary, responsibility: selected.replyResponsibility, reason: selected.responsibilityReason,
          messages: selected.messages.slice(-20),
        } : undefined });
      setAskAnswer(result);
    } catch (cause) { setAskError(cause instanceof Error ? cause.message : "Could not answer that question."); }
    finally { setBusy(false); }
  }

  async function updateConversation(changes: Partial<Pick<Conversation, "replyResponsibility" | "status" | "category" | "isImportant" | "isUnread" | "draftReply" | "draftApproved" | "followUpResolved">>) {
    if (!selected || busy || (session && session.user.role !== "assistant")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (changes.replyResponsibility && !suggestions[selected._id] && selected.responsibilityReason !== "Manually assigned by the assistant.") setSuggestions(current => ({ ...current, [selected._id]: { responsibility: selected.replyResponsibility, reason: selected.responsibilityReason } }));
      const updated = session
        ? (await request<{ conversation: Conversation }>(`/conversations/${selected._id}`, session.token, { method: "PATCH", body: JSON.stringify(changes) })).conversation
        : { ...selected, ...changes, draftApproved: changes.draftReply !== undefined ? false : changes.draftApproved ?? selected.draftApproved,
            responsibilityReason: changes.replyResponsibility ? "Manually assigned by the assistant." : selected.responsibilityReason };
      const nextItems = items.map(item => item._id === updated._id ? { ...item, ...updated } : item);
      setItems(nextItems);
      setSelectedDetail(updated);
      if (changes.draftReply !== undefined) setReplyDrafts(current => {
        const next = { ...current };
        delete next[selected._id];
        return next;
      });
      const query = search.trim().toLowerCase();
      const nextVisible = nextItems.filter(item =>
        (!query || [item.senderName, item.senderEmail, item.subject, item.summary].some(value => value.toLowerCase().includes(query))) &&
        matchesSegment(item, segment) && matchesView(item, viewFilter) && (statusFilter === "all" || item.status === "open") &&
        (accountFilter === "all" || item.accountId === accountFilter));
      if (!nextVisible.some(item => item._id === selected._id)) setSelectedId(nextVisible[0]?._id ?? null);
      setNotice(changes.status === "handled" ? "Conversation marked done."
        : changes.status === "archived" ? "Conversation moved to Archive."
        : changes.status === "open" ? "Conversation reopened."
        : changes.draftReply !== undefined ? "Reply draft saved. No email was sent."
        : changes.draftApproved ? "Draft approved for the demo. No email was sent."
        : changes.followUpResolved !== undefined ? changes.followUpResolved ? "Follow-up marked resolved." : "Follow-up reopened."
        : changes.isUnread !== undefined ? changes.isUnread ? "Marked unread." : "Marked read."
        : changes.category ? `Category changed to ${categoryLabel(changes.category).toLowerCase()}.`
        : changes.isImportant !== undefined ? changes.isImportant ? "Marked important." : "Removed from Important."
        : changes.replyResponsibility ? `Responsibility updated to ${responsibilityLabel(updated.replyResponsibility).toLowerCase()}.`
        : "Conversation updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update conversation."); }
    finally { setBusy(false); }
  }

  async function archiveChecked() {
    if (!checkedIds.length || busy || (session && session.user.role !== "assistant")) return;
    setBusy(true); setError(""); setNotice("");
    const archived: string[] = [];
    try {
      for (const id of checkedIds) {
        if (session) await request(`/conversations/${id}`, session.token, { method: "PATCH", body: JSON.stringify({ status: "archived" }) });
        archived.push(id);
      }
      setNotice(`${archived.length} conversation${archived.length === 1 ? "" : "s"} moved to Archive.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not archive conversations.");
    } finally {
      if (archived.length) {
        setItems(current => current.map(item => archived.includes(item._id) ? { ...item, status: "archived" } : item));
        setCheckedIds(current => current.filter(id => !archived.includes(id)));
        if (selectedId && archived.includes(selectedId)) setSelectedDetail(null);
      }
      setBusy(false);
    }
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

  async function openClientDemo() {
    if (!session) {
      sessionStorage.setItem("relay-preview-items", JSON.stringify(items));
      sessionStorage.setItem("relay-client-preview", "true");
      window.location.assign("/client");
      return;
    }
    if (session.user.role !== "assistant" || busy) return;
    const accountId = accounts.find(account => account._id === selected?.accountId)?._id || accounts[0]?._id;
    if (!accountId) { setError("Set up a demo client account first."); return; }
    setBusy(true); setError("");
    try {
      const clientSession = await request<Session>("/auth/demo-client", session.token,
        { method: "POST", body: JSON.stringify({ accountId }) });
      sessionStorage.setItem("relay-assistant-session", JSON.stringify(session));
      localStorage.setItem("relay-session", JSON.stringify(clientSession));
      window.location.assign("/client");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open client demo."); setBusy(false); }
  }

  function chooseSegment(value: Segment) { setSegment(value); setViewFilter("all"); setStatusFilter(value === "done" ? "all" : "open"); setMobileOpen(false); setMobileDetail(false); }
  function chooseView(value: ViewFilter, includeHandled = false) { setSegment("all"); setViewFilter(value); setStatusFilter(includeHandled ? "all" : "open"); setMobileDetail(false); }
  function selectItem(item: Conversation) { setSelectedId(item._id); setSelectedDetail(null); setThreadExpanded(false); setReviewingDraft(false); setMobileDetail(true); }

  return <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Inbox navigation">
      <div className="brand-row"><div><span className="brand">Relay</span><small>Assistant</small></div><button className="sidebar-toggle icon-button" aria-label={mobileOpen ? "Close navigation" : sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={mobileOpen ? "Close navigation" : sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => { if (window.matchMedia("(max-width: 700px)").matches) setMobileOpen(false); else setSidebarCollapsed(value => !value); }}>{sidebarCollapsed && !mobileOpen ? <PanelLeftOpen size={21} strokeWidth={1.5} /> : <PanelLeftClose size={21} strokeWidth={1.5} />}</button></div>
      <nav className="nav-list" aria-label="Conversation queues">
        {nav.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${segment === id ? "active" : ""}`} aria-label={label} title={sidebarCollapsed ? label : undefined} onClick={() => chooseSegment(id)} aria-current={segment === id ? "page" : undefined}>
          <Icon size={20} strokeWidth={2} aria-hidden="true" /><span>{label}</span>{id === "review" && <strong>{counts.review}</strong>}
        </button>)}
      </nav>
      <button className="sidebar-demo" aria-label="Demo inbox setup and status" title={sidebarCollapsed ? "Demo inbox setup and status" : undefined} onClick={() => { window.location.assign("/onboarding"); }}><Inbox size={17} aria-hidden="true" /><span>{session && accounts.length ? "Demo connected · status" : localStorage.getItem("relay-demo-connection") ? "Sample ready · status" : "Demo inbox · setup"}</span></button>
      <div className="sidebar-bottom"><button ref={accountButtonRef} className="sidebar-account" aria-label={session ? "Sign out" : "Sign in to local API"} title={sidebarCollapsed ? session ? "Sign out" : "Sign in" : undefined} onClick={() => session ? (setSession(null), setNotice("Signed out. Showing preview data.")) : window.location.assign("/signin")}><UserRound size={18} aria-hidden="true" /><span>{session ? `Sign out · ${session.user.name.split(" ")[0]}` : "Sign in"}</span></button></div>
    </aside>

    <main className={`dashboard-main ${mobileDetail ? "show-detail" : ""}`}>
      <div className="mobile-head"><button className="icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><PanelLeftOpen size={22} strokeWidth={1.5} /></button><strong>Relay</strong><span>Demo · no live sync</span></div>
      <div className="dashboard-heading"><div><h1>Demo inbox</h1><p>Relay assistant for client email <span aria-hidden="true">·</span> Demo inbox, no live sync</p></div>{(!session || (session.user.role === "assistant" && accounts.length > 0)) && <button className="client-view-launch" disabled={busy} onClick={openClientDemo}><UsersRound size={17} aria-hidden="true" /> {session ? "Open client view" : "Preview client view"}</button>}</div>
      <div className="dashboard-columns">
        <section className={`inbox-pane ${mobileDetail ? "mobile-hidden" : ""}`} aria-label="Assistant inbox">
          <div className="inbox-overview" aria-label="Inbox overview across all clients">
            <div className="overview-metrics">
              <button className={segment === "all" && viewFilter === "all" && statusFilter === "all" ? "active" : ""} onClick={() => chooseView("all", true)} aria-pressed={segment === "all" && viewFilter === "all" && statusFilter === "all"}><strong>{overview.total}</strong><span>Conversations</span></button>
              <button className={viewFilter === "unread" ? "active" : ""} onClick={() => chooseView("unread")} aria-pressed={viewFilter === "unread"}><strong>{overview.unread}</strong><span>Unread</span></button>
              <button className={viewFilter === "action" ? "active" : ""} onClick={() => chooseView("action")} aria-pressed={viewFilter === "action"}><strong>{overview.action}</strong><span>Action required</span></button>
              <button className={viewFilter === "waiting" ? "active" : ""} onClick={() => chooseView("waiting")} aria-pressed={viewFilter === "waiting"}><strong>{overview.waiting}</strong><span>Waiting on reply</span></button>
            </div>
            <div className="overview-more">
              <button className={viewFilter === "important" ? "active" : ""} onClick={() => chooseView("important")} aria-pressed={viewFilter === "important"}>Important <b>{overview.important}</b></button>
              <button type="button" onClick={() => setDatesOpen(true)}>Dates to watch <b>{dateMentions.length}</b></button>
              <button className={segment === "assistant" ? "active" : ""} onClick={() => chooseSegment("assistant")} aria-pressed={segment === "assistant"}>Assistant <b>{overview.assistant}</b></button>
              <button className={segment === "client" ? "active" : ""} onClick={() => chooseSegment("client")} aria-pressed={segment === "client"}>Client attention <b>{overview.client}</b></button>
              <button className={viewFilter === "meetings" ? "active" : ""} onClick={() => chooseView("meetings")} aria-pressed={viewFilter === "meetings"}>Meeting threads <b>{overview.meetings}</b></button>
            </div>
          </div>
          <div className="list-toolbar">
            <label className="global-search"><Search size={20} aria-hidden="true" /><span className="sr-only">Search conversations</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" /></label>
            <label><span className="sr-only">Filter by client account</span><select value={accountFilter} onChange={event => setAccountFilter(event.target.value)}><option value="all">All clients</option>{demoAccounts.map(account => <option key={account.id} value={account.id}>{account.label}</option>)}</select></label>
            <label><span className="sr-only">Filter by responsibility</span><select value={segment === "done" || segment === "general" ? "all" : segment} onChange={event => chooseSegment(event.target.value as Segment)}><option value="all">All responsibility</option><option value="review">Needs review</option><option value="assistant">Assistant</option><option value="client">Client</option><option value="no-reply">No reply</option></select></label>
            <label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "open" | "all")}><option value="open">Open</option><option value="all">All status</option></select></label>
          </div>
          <div className="list-meta"><span>{filtered.length} conversations</span><div className="list-meta-actions"><button className="simulate-trigger" onClick={() => { setAskOpen(true); setAskError(""); }}><Sparkles size={16} aria-hidden="true" /> Ask Relay</button><button className="simulate-trigger" onClick={() => { setSimulationMode("new"); setSimulationAccountId(demoAccounts[0]?.id || ""); setSimulationError(""); setSimulationOpen(true); }} disabled={session?.user.role === "client"}><Sparkles size={16} aria-hidden="true" /> Simulate email</button></div><span>Sort: Most recent <ChevronDown size={15} aria-hidden="true" /></span></div>
          {checkedIds.length > 0 && <div className="selection-toolbar"><span>{checkedIds.length} selected</span><button disabled={busy} onClick={archiveChecked}><Archive size={16} aria-hidden="true" />Archive</button><button className="clear-selection" disabled={busy} onClick={() => setCheckedIds([])}>Clear</button></div>}
          {error && <div className="message-banner error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
          {notice && <div className="message-banner success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button></div>}
          {loading ? <div className="empty-state" role="status">Loading conversations…</div> : filtered.length ? <div className="conversation-table" role="table" aria-label="Conversations">
            <div className="table-head" role="row"><span role="columnheader">Sender</span><span role="columnheader">Subject</span><span role="columnheader">Client</span><span role="columnheader">Time</span><span role="columnheader">Responsibility</span></div>
            <div className="table-body">{filtered.map(item => <div key={item._id} className={`conversation-row ${selectedId === item._id ? "selected" : ""} ${checkedIds.includes(item._id) ? "checked" : ""}`}><input type="checkbox" aria-label={`Select ${item.subject} from ${item.senderName}`} checked={checkedIds.includes(item._id)} disabled={busy || item.status !== "open" || session?.user.role === "client"} onChange={event => setCheckedIds(current => event.target.checked ? [...current, item._id] : current.filter(id => id !== item._id))} /><button className="conversation-open" onClick={() => selectItem(item)} aria-label={`Open ${item.senderName}, ${item.subject}, ${responsibilityLabel(item.replyResponsibility)}${item.isUnread ? ", unread" : ""}`} aria-current={selectedId === item._id ? "true" : undefined}><span className={`sender-cell ${item.isUnread ? "is-unread" : ""}`}><strong>{item.senderName}</strong></span><span className="subject-cell">{(item.isImportant || item.category === "important") && <Star size={12} fill="currentColor" aria-label="Important" />}{item.subject}</span><span className="client-cell">{accountName(item)}</span><span className="age-cell">{formatAge(item.lastMessageAt)}</span><span className={`responsibility-badge ${item.replyResponsibility}`}>{responsibilityLabel(item.replyResponsibility)}</span></button></div>)}</div>
          </div> : <div className="empty-state"><Inbox size={28} /><h2>{session && !items.length ? "No conversations yet" : "No conversations found"}</h2><p>{session && !items.length ? "Create a client and load the sample inbox to explore this prototype." : "Try a different search or filter."}</p>{session && !items.length && <form className="setup-form" onSubmit={setupDemo}><label>Client name<input required value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Alex Morgan" /></label><label>Client email<input required type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="alex@example.com" /></label><label>Client password<input required minLength={8} type="password" value={clientPassword} onChange={event => setClientPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="primary-button" disabled={busy}>{busy ? "Loading…" : "Create client and load sample inbox"}</button></form>}</div>}
        </section>

        <aside className={`right-rail ${mobileDetail ? "mobile-visible" : ""}`} aria-label="Review and conversation detail">
          <button className="review-banner" onClick={() => chooseSegment("review")} aria-label={`Show ${counts.review} conversations needing review`}><span className="review-banner-title"><Flag size={26} aria-hidden="true" />Needs review <b>{counts.review}</b></span><small>Conversations that need a decision or next step.</small></button>
          <section className="detail-pane" aria-label="Selected conversation">
            <button className="back-to-list" onClick={() => setMobileDetail(false)}>← Back to inbox</button>
            {selected ? <><div className="detail-header"><div><h2>{selected.senderName} — {selected.subject}</h2><p>{selected.senderEmail} <span aria-hidden="true">·</span> {accountName(selected)}</p><p><time dateTime={selected.lastMessageAt}>{formatDate(selected.lastMessageAt)}</time></p></div><label className="status-control"><span className="sr-only">Conversation status</span><select value={selected.status} disabled={busy || session?.user.role === "client"} onChange={event => updateConversation({ status: event.target.value as Status })}><option value="open">Open</option><option value="handled">Done</option><option value="archived">Archived</option></select></label></div>
              {selected.clientAction && <div className="client-update" role="status">{selected.clientAction === "handled" ? "Client marked this matter handled." : "Client asked the assistant to take over."}{selected.clientActionAt && <small> {formatDate(selected.clientActionAt)}</small>}</div>}
              <div className="suggestion-card"><div className="suggestion-heading"><Sparkles size={18} aria-hidden="true" /><strong>{selected.classificationSource === "ai" ? "AI classification" : selected.classificationModel ? "AI suggestion" : selectedSuggestion ? "Sample suggestion" : "Current responsibility"}</strong></div><div className="detail-summary"><span>{selected.classificationSource === "ai" ? "AI summary" : "Summary"}</span><p>{selected.summary}</p></div><strong className="suggestion-decision">{selectedSuggestion?.responsibility === "review" ? "Ownership needs review." : selectedSuggestion?.responsibility === "none" ? "No reply needed." : selectedSuggestion ? `${responsibilityLabel(selectedSuggestion.responsibility)} should reply.` : `${responsibilityLabel(selected.replyResponsibility)} assigned.`}</strong><p>{selectedSuggestion?.reason || selected.responsibilityReason}</p>{selected.classificationModel && <small className="ai-model-note">Classified with Groq · {selected.classificationModel}</small>}</div>
              <section className="ai-insights" aria-label="AI thread insights"><div className="ai-insights-heading"><h3>Thread insights</h3><button type="button" disabled={busy || !selected.messages?.length} onClick={analyzeSelected}>{busy ? "Working…" : selected.keyPoints?.length || selected.dates?.length || selected.followUp?.nextStep ? "Refresh AI insights" : "Analyze thread"}</button></div>{selected.keyPoints?.length ? <ul>{selected.keyPoints.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}</ul> : <p className="ai-insights-empty">Analyze this thread to pull out key information.</p>}{!!selected.dates?.length && <div className="ai-dates"><strong>Dates &amp; deadlines</strong>{selected.dates.map((date, index) => <p key={`${date.label}-${index}`}><span>{date.label}</span><b>{date.when}</b></p>)}</div>}{(selected.followUp?.waitingOn || selected.followUp?.nextStep || selected.category === "waiting") && <div className="ai-follow-up"><strong>{selected.followUpResolved ? "Follow-up resolved" : "Pending follow-up"}</strong>{selected.followUp?.waitingOn && <p>Waiting on: {selected.followUp.waitingOn}</p>}{selected.followUp?.nextStep && <p>Next: {selected.followUp.nextStep}</p>}{selected.followUp?.due && <p>Due: {selected.followUp.due}</p>}{!selected.followUp?.waitingOn && !selected.followUp?.nextStep && <p>Waiting for a response in this conversation.</p>}<button type="button" disabled={busy} onClick={() => updateConversation({ followUpResolved: !selected.followUpResolved })}>{selected.followUpResolved ? "Reopen follow-up" : "Mark follow-up resolved"}</button></div>}</section>
              {session?.user.role !== "client" && <div className="assignment-actions"><button className="primary-button" disabled={busy || selected.status !== "open"} onClick={() => updateConversation({ replyResponsibility: "client" })}><Forward size={19} aria-hidden="true" /> Assign to client</button><div className="other-assignment" ref={assignmentMenuRef}><button type="button" className="other-assignment-trigger" disabled={busy || selected.status !== "open"} aria-haspopup="menu" aria-expanded={assignmentMenuOpen} onClick={() => setAssignmentMenuOpen(open => !open)} onMouseEnter={() => { if (assignmentMenuOpen) setAssignmentMenuOpen(false); }}><span>Other assignment</span><span className="choose-owner">Choose owner <ChevronDown size={15} aria-hidden="true" /></span></button>{assignmentMenuOpen && <div className="other-assignment-menu" role="menu" aria-label="Choose owner">{(["assistant", "none", "review"] as const).map(owner => <button key={owner} type="button" role="menuitem" onClick={() => { setAssignmentMenuOpen(false); updateConversation({ replyResponsibility: owner }); }}>{responsibilityLabel(owner)}</button>)}</div>}</div></div>}
              <div className="organize-controls"><label>Category<select value={selected.category} disabled={busy} onChange={event => updateConversation({ category: event.target.value as Category })}><option value="action-required">Action required</option><option value="waiting">Waiting for response</option><option value="meetings">Meetings &amp; appointments</option><option value="important">Important update</option><option value="general">General</option></select></label><button className={`important-toggle ${selected.isImportant ? "active" : ""}`} type="button" aria-pressed={selected.isImportant} disabled={busy} onClick={() => updateConversation({ isImportant: !selected.isImportant })}><Star size={17} fill={selected.isImportant ? "currentColor" : "none"} aria-hidden="true" />{selected.isImportant ? "Important" : "Mark important"}</button><button className="read-toggle" type="button" aria-pressed={selected.isUnread} disabled={busy || session?.user.role === "client"} onClick={() => updateConversation({ isUnread: !selected.isUnread })}><Mail size={16} aria-hidden="true" />{selected.isUnread ? "Mark read" : "Mark unread"}</button></div>
              <div className="thread"><div className="thread-heading"><h3>Thread</h3><span>{selected.messages?.length || 0} messages</span></div>{selected.messages?.length ? [...selected.messages].reverse().slice(0, threadExpanded ? undefined : 3).map((message, index) => <article className="message" key={`${message.receivedAt}-${index}`}><span className="message-avatar">{message.from === selected.senderEmail ? selected.senderName.split(" ").map(word => word[0]).join("").slice(0, 2) : "A"}</span><div><div className="message-meta"><strong>{message.from === selected.senderEmail ? selected.senderName : "Assistant"}</strong><time dateTime={message.receivedAt}>{formatDate(message.receivedAt)}</time></div>{threadExpanded && <small className="message-to">To: {message.to}</small>}<p>{message.body}</p>{selected._id === "demo-1" && index === 0 && <span className="demo-attachment">Service_Agreement_v3.pdf · sample attachment</span>}</div></article>) : <p className="thread-empty">No messages in this conversation.</p>}</div>
              <button className="full-conversation" onClick={() => setThreadExpanded(!threadExpanded)}>{threadExpanded ? "Show compact thread" : "Open full conversation"}</button>
              {session?.user.role !== "client" && <section className="reply-draft" aria-label="Reply draft"><div className="reply-draft-heading"><div><h3>Reply draft</h3><p>Generate, edit, save and approve a response. No email is sent.</p></div>{selected.draftApproved && !draftChanged ? <span className="draft-saved">Approved</span> : selected.draftReply && !draftChanged && <span className="draft-saved">Saved</span>}</div><button type="button" className="suggest-reply-button" disabled={busy || !selected.messages?.length} onClick={suggestReply}><Sparkles size={15} aria-hidden="true" /> {busy ? "Working…" : "Suggest reply with AI"}</button><label className="sr-only" htmlFor="reply-draft-body">Reply text</label><textarea id="reply-draft-body" rows={5} maxLength={5000} placeholder={`Write a reply to ${selected.senderName}…`} value={replyDraft} onChange={event => { setReplyDrafts(current => ({ ...current, [selected._id]: event.target.value })); setReviewingDraft(false); }} disabled={busy} /><div className="reply-draft-actions"><button type="button" className="draft-review-button" disabled={!replyDraft.trim()} onClick={() => setReviewingDraft(value => !value)}>{reviewingDraft ? "Hide review" : "Review reply"}</button><button type="button" className="draft-save-button" disabled={busy || !draftChanged} onClick={() => updateConversation({ draftReply: replyDraft })}>{busy ? "Saving…" : "Save draft"}</button></div>{reviewingDraft && <div className="reply-preview"><strong>Review draft</strong><span>To: {selected.senderName} &lt;{selected.senderEmail}&gt;</span><span>Re: {selected.subject}</span><p>{replyDraft}</p><button type="button" className="approve-draft-button" disabled={busy || draftChanged || !!selected.draftApproved || !selected.draftReply?.trim()} onClick={() => updateConversation({ draftApproved: true })}>{selected.draftApproved && !draftChanged ? "Approved" : "Approve saved draft"}</button><small>{draftChanged ? "Save changes before approval." : "Approval is recorded for the demo. No email is sent."}</small></div>}</section>}
            </> : <div className="empty-detail"><Bell size={24} /><h2>Select a conversation</h2><p>Review its messages and decide who should reply.</p></div>}
          </section>
        </aside>
      </div>
    </main>

    {datesOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDatesOpen(false); }}><section className="simulation-dialog dates-dialog" role="dialog" aria-modal="true" aria-labelledby="dates-title"><button className="dialog-close icon-button" aria-label="Close dates" onClick={() => setDatesOpen(false)}><X size={20} /></button><h2 id="dates-title">Dates to watch</h2><p className="simulation-intro">Dates mentioned in open conversations. Confirm the details in the original thread.</p>{dateMentions.length ? <div className="date-mention-list">{dateMentions.map(({ conversation, label, when }, index) => <button key={`${conversation._id}-${label}-${index}`} type="button" onClick={() => { setSegment("all"); setViewFilter("all"); setStatusFilter("open"); setAccountFilter("all"); setSearch(""); selectItem(conversation); setDatesOpen(false); }}><span><strong>{label}</strong><small>{conversation.senderName} · {conversation.subject}</small></span><b>{when}</b></button>)}</div> : <p className="dates-empty">No dates have been identified yet. Analyze a conversation to extract them.</p>}</section></div>}
    {askOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setAskOpen(false); }}><section className="simulation-dialog ask-dialog" role="dialog" aria-modal="true" aria-labelledby="ask-title"><button className="dialog-close icon-button" aria-label="Close Ask Relay" disabled={busy} onClick={() => setAskOpen(false)}><X size={20} /></button><div className="simulation-eyebrow"><Sparkles size={16} /> INBOX ASSISTANT</div><h2 id="ask-title">Ask Relay</h2><p className="simulation-intro">Ask about the current inbox or selected thread. Answers use the inbox conversation data.</p><div className="ask-examples">{["Show me emails that need my attention.", "What am I waiting for a response on?", "Which emails require the client's attention?", "Summarize this conversation.", "Why was this assigned to the client?", "Draft a reply to this conversation."].map(example => <button type="button" key={example} onClick={() => { setAskQuestion(example); setAskAnswer(null); }}>{example}</button>)}</div><form onSubmit={askInbox}><label>Your question<input value={askQuestion} onChange={event => setAskQuestion(event.target.value)} maxLength={500} placeholder="Ask about your emails…" required /></label><button className="primary-button" disabled={busy || !askQuestion.trim()}>{busy ? "Thinking…" : "Ask question"}</button></form>{askError && <div className="auth-error" role="alert">{askError}</div>}{askAnswer && <div className="ask-answer" role="status"><strong>Relay's answer</strong><p>{askAnswer.answer}</p>{askAnswer.conversationIds.length > 0 && <div className="ask-references"><small>Relevant conversations</small>{askAnswer.conversationIds.map(id => { const item = items.find(conversation => conversation._id === id); return item && <button key={id} type="button" onClick={() => { setSegment("all"); setViewFilter("all"); setStatusFilter("all"); setAccountFilter("all"); setSearch(""); selectItem(item); setAskOpen(false); }}>{item.senderName} · {item.subject}</button>; })}</div>}</div>}</section></div>}
    {simulationOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setSimulationOpen(false); }}><section className="simulation-dialog" role="dialog" aria-modal="true" aria-labelledby="simulation-title"><button className="dialog-close icon-button" aria-label="Close simulation" disabled={busy} onClick={() => setSimulationOpen(false)}><X size={20} /></button><div className="simulation-eyebrow"><Sparkles size={16} /> LIVE AI DEMO</div><h2 id="simulation-title">Simulate an incoming email</h2><p className="simulation-intro">Add a sample message. Groq will read the conversation and decide who should reply. No real mailbox is connected.</p><div className="simulation-tabs" role="group" aria-label="Simulation type"><button type="button" className={simulationMode === "new" ? "active" : ""} onClick={() => setSimulationMode("new")}>New conversation</button><button type="button" className={simulationMode === "reply" ? "active" : ""} disabled={!selected} onClick={() => setSimulationMode("reply")}>Reply to selected</button></div><form onSubmit={simulateEmail}>{simulationMode === "new" ? <><label>Sample account<select required value={simulationAccountId || demoAccounts[0]?.id || ""} onChange={event => setSimulationAccountId(event.target.value)}><option value="" disabled>Choose account</option>{demoAccounts.map(account => <option key={account.id} value={account.id}>{account.label}</option>)}</select></label><div className="simulation-fields"><label>Sender name<input required maxLength={100} value={simulationSender} onChange={event => setSimulationSender(event.target.value)} /></label><label>Sender email<input required type="email" value={simulationEmail} onChange={event => setSimulationEmail(event.target.value)} /></label></div><label>Subject<input required maxLength={200} value={simulationSubject} onChange={event => setSimulationSubject(event.target.value)} /></label></> : <><p className="simulation-mode-note">Add a sample reply to the selected conversation. Relay will read the full thread and update who should respond.</p><div className="simulation-thread">Reply to <strong>{selected?.subject}</strong> from {selected?.senderName}</div></>}<label>Incoming message<textarea required maxLength={2500} rows={5} value={simulationBody} onChange={event => setSimulationBody(event.target.value)} /></label>{simulationError && <div className="auth-error" role="alert">{simulationError}</div>}<button className="primary-button" disabled={busy || (simulationMode === "new" && !demoAccounts.length)}>{busy ? "Analyzing conversation…" : "Receive sample email & classify"}</button>{simulationMode === "new" && !demoAccounts.length && <small>Set up a demo email account in onboarding first.</small>}</form></section></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section ref={authDialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="dialog-close icon-button" aria-label="Close sign in" onClick={() => setAuthOpen(false)}><X size={20} /></button><h2 id="auth-title">{authMode === "login" ? "Sign in to Relay" : "Create assistant account"}</h2><p>Connect to the local prototype API. The inbox will use your stored demo conversations.</p>{error && <div className="auth-error" role="alert">{error}</div>}<form onSubmit={submitAuth}>{authMode === "signup" && <label>Name<input required value={authName} onChange={event => setAuthName(event.target.value)} autoComplete="name" /></label>}<label>Email<input required type="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} autoComplete="email" /></label><label>Password<input required minLength={8} type="password" value={authPassword} onChange={event => setAuthPassword(event.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label><button className="primary-button" disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}</button></form><button className="mode-switch" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>{authMode === "login" ? "New assistant? Create an account" : "Already have an account? Sign in"}</button></section></div>}
  </div>;
}

export default function App() {
  const route = window.location.pathname.replace(/\/$/, "") || "/";
  if (route === "/inbox") {
    try { if (JSON.parse(localStorage.getItem("relay-session") || "null")?.user?.role === "client") return <ClientView />; }
    catch { /* The assistant preview still works without a stored session. */ }
    return <Dashboard />;
  }
  if (route === "/client") return <ClientView />;
  if (route === "/onboarding") return <Onboarding intent="onboarding" />;
  if (route === "/signin") return <Onboarding intent="signin" />;
  if (route === "/signup") return <Onboarding intent="signup" />;
  if (route === "/account") return <Onboarding intent="account" />;
  return <Landing />;
}
