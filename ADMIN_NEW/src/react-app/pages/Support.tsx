import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  StickyNote,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

import { API_ROOT } from "../config/api";
import { useAuth } from "../hooks/useAuth";
import {
  addSupportInternalNote,
  createSupportSavedReply,
  getStaff,
  getSupportSavedReplies,
  getTickets,
  replyToTicket,
  updateSupportPresence,
  updateTicketStatus,
} from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketMessage {
  sender: "USER" | "ADMIN" | "ASSISTANT";
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
}

interface InternalNote {
  id: string;
  content: string;
  createdAt: string;
  authorName?: string;
}

interface Ticket {
  _id: string;
  id?: string;
  user?: { firstName: string; lastName: string; email: string };
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  subject: string;
  description: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  assistantState?: string;
  firstAgentResponseDueAt?: string;
  firstAgentResponseAt?: string | null;
  internalNotes?: InternalNote[];
  messages: TicketMessage[];
  createdAt: string;
}

interface StaffMember {
  _id: string;
  fullName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
}

interface SavedReply { id: string; title: string; body: string; }
interface Toast { id: string; msg: string; ok: boolean; }
type QueueFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uName  = (t: Ticket) => t.user ? `${t.user.firstName} ${t.user.lastName}`.trim() : `${t.userFirstName ?? ""} ${t.userLastName ?? ""}`.trim() || "User";
const uEmail = (t: Ticket) => t.user?.email || t.userEmail || "";
const uInit  = (t: Ticket) => uName(t)[0]?.toUpperCase() || "?";
const msgs   = (t: Ticket) => Array.isArray(t.messages) ? t.messages : [];
const lastTs = (t: Ticket) => { const m = msgs(t); return m[m.length - 1]?.timestamp || t.createdAt; };

function ago(v: string) {
  const d = Date.now() - new Date(v).getTime();
  if (d < 60_000)      return "now";
  if (d < 3_600_000)   return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000)  return `${Math.floor(d / 3_600_000)}h`;
  if (d < 604_800_000) return `${Math.floor(d / 86_400_000)}d`;
  return new Date(v).toLocaleDateString();
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function slaInfo(dueAt: string): { label: string; hot: boolean } {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Breached", hot: true };
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return { label: h > 0 ? `${h}h ${m}m left` : `${m}m left`, hot: ms < 4 * 3_600_000 };
}

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };
const STATUS_CLS: Record<string, string>   = {
  OPEN:        "bg-amber-50  text-amber-700  ring-1 ring-amber-200",
  IN_PROGRESS: "bg-blue-50   text-blue-700   ring-1 ring-blue-200",
  RESOLVED:    "bg-green-50  text-green-700  ring-1 ring-green-200",
  CLOSED:      "bg-gray-100  text-gray-500   ring-1 ring-gray-200",
};
const STATUS_DOT: Record<string, string> = { OPEN: "bg-amber-400", IN_PROGRESS: "bg-blue-500", RESOLVED: "bg-green-500", CLOSED: "bg-gray-300" };
const PRI_CLS: Record<string, string> = { URGENT: "text-red-600 font-semibold", HIGH: "text-orange-500 font-semibold", MEDIUM: "text-slate-600", LOW: "text-slate-400" };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Support() {
  const { user } = useAuth();
  const me = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Agent" : "Agent";

  const [tickets,  setTickets]   = useState<Ticket[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [sel,      setSel]       = useState<Ticket | null>(null);
  const [reply,    setReply]     = useState("");
  const [sending,  setSending]   = useState(false);
  const [filter,   setFilter]    = useState<QueueFilter>("ALL");
  const [search,   setSearch]    = useState("");
  const [live,     setLive]      = useState(false);
  const [newIds,   setNewIds]    = useState<Set<string>>(new Set());
  const [staff,    setStaff]     = useState<StaffMember[]>([]);
  const [assignee, setAssignee]  = useState("");
  const [replies,  setReplies]   = useState<SavedReply[]>([]);
  const [note,     setNote]      = useState("");
  const [saving,   setSaving]    = useState(false);
  const [presence, setPresence]  = useState<"AVAILABLE"|"AWAY">("AVAILABLE");
  const [toasts,   setToasts]    = useState<Toast[]>([]);
  const [showNotes,setShowNotes] = useState(false);
  const [srOpen,   setSrOpen]    = useState(false);
  const [srTitle,  setSrTitle]   = useState("");
  const [srBody,   setSrBody]    = useState("");
  const [, setTick] = useState(0);

  const sockRef  = useRef<Socket | null>(null);
  const endRef   = useRef<HTMLDivElement>(null);
  const selRef   = useRef<Ticket | null>(null);
  selRef.current = sel;

  useEffect(() => { const id = setInterval(() => setTick(n => n + 1), 60_000); return () => clearInterval(id); }, []);

  const push = (msg: string, ok = true) => {
    const id = `${Date.now()}`;
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // Socket
  useEffect(() => {
    const s = io(API_ROOT.replace("/api", ""), { transports: ["websocket","polling"], reconnection: true });
    sockRef.current = s;
    s.on("connect",    () => { setLive(true); s.emit("join_support_agents"); });
    s.on("disconnect", () => setLive(false));
    s.on("new_support_ticket", ({ ticket }: { ticket: Ticket }) => {
      setTickets(p => { const id = ticket._id || ticket.id || ""; if (p.some(t => t._id === id)) return p; return [{ ...ticket, _id: id }, ...p]; });
      setNewIds(p => new Set(p).add(ticket._id || ticket.id || ""));
    });
    s.on("support_message", ({ ticketId, message }: { ticketId: string; message: TicketMessage }) => {
      const dup = (ms: TicketMessage[]) => (Array.isArray(ms) ? ms : []).some(m => m.timestamp === message.timestamp && m.content === message.content);
      setTickets(p => p.map(t => t._id !== ticketId || dup(msgs(t)) ? t : { ...t, messages: [...msgs(t), message] }));
      if (selRef.current?._id === ticketId)
        setSel(p => !p || dup(msgs(p)) ? p : { ...p, messages: [...msgs(p), message] });
    });
    return () => { s.disconnect(); };
  }, []);

  // Presence
  useEffect(() => {
    const sync = (p: "AVAILABLE"|"AWAY"|"OFFLINE") => updateSupportPresence(p).catch(() => {});
    sync("AVAILABLE");
    const id = setInterval(() => { if (presence === "AVAILABLE") sync("AVAILABLE"); }, 30_000);
    const onVis = () => { const p = document.hidden ? "AWAY" : "AVAILABLE"; setPresence(p); sync(p); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); sync("OFFLINE"); };
  }, [presence]);

  // On select
  useEffect(() => {
    if (!sel) return;
    sockRef.current?.emit("join_support_ticket", sel._id);
    sockRef.current?.emit("support_agent_joined", { ticketId: sel._id, agentId: user?.id, agentName: me });
    setNewIds(p => { const n = new Set(p); n.delete(sel._id); return n; });
    setNote(""); setShowNotes(false);
  }, [sel?._id]);

  useEffect(() => { setAssignee(sel?.assignedTo || ""); }, [sel?._id, sel?.assignedTo]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sel ? msgs(sel).length : 0]);

  // Data
  useEffect(() => { (async () => { try { setLoading(true); const d = await getTickets(); if (d.success) setTickets(d.data); } catch {/**/ } finally { setLoading(false); } })(); }, []);
  useEffect(() => { (async () => { try { const d = await getStaff(); if (d.success) setStaff(d.data); } catch {/**/ } })(); }, []);
  useEffect(() => { (async () => { try { const d = await getSupportSavedReplies(); if (d.success) setReplies(d.data); } catch {/**/ } })(); }, []);

  const filtered = tickets
    .filter(t => (filter === "ALL" || t.status === filter) && (!search.trim() || [t.subject, uName(t), uEmail(t), t.category].join(" ").toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => new Date(lastTs(b)).getTime() - new Date(lastTs(a)).getTime());

  // Actions
  const sendReply = async () => {
    if (!sel || !reply.trim()) return;
    const txt = reply.trim(), prev = msgs(sel);
    setSending(true); setReply("");
    const opt: TicketMessage = { sender: "ADMIN", senderId: user?.id ?? "", senderName: me, content: txt, timestamp: new Date().toISOString() };
    setSel(p => p ? { ...p, messages: [...msgs(p), opt], status: "IN_PROGRESS" } : p);
    setTickets(p => p.map(t => t._id === sel._id ? { ...t, messages: [...msgs(t), opt], status: "IN_PROGRESS" } : t));
    try { await replyToTicket(sel._id, txt, me); }
    catch { setSel(p => p ? { ...p, messages: prev } : p); setTickets(p => p.map(t => t._id === sel._id ? { ...t, messages: prev } : t)); push("Failed to send.", false); }
    finally { setSending(false); }
  };

  const changeStatus = async (id: string, status: Ticket["status"]) => {
    const prev = tickets.find(t => t._id === id)?.status;
    setTickets(p => p.map(t => t._id === id ? { ...t, status } : t));
    if (sel?._id === id) setSel(p => p ? { ...p, status } : p);
    try { await updateTicketStatus(id, status); }
    catch { if (prev) { setTickets(p => p.map(t => t._id === id ? { ...t, status: prev } : t)); if (sel?._id === id) setSel(p => p ? { ...p, status: prev } : p); } push("Failed to update status.", false); }
  };

  const changeAssignee = async (val: string) => {
    if (!sel) return;
    setAssignee(val);
    try { await updateTicketStatus(sel._id, sel.status, val || null); setTickets(p => p.map(t => t._id === sel._id ? { ...t, assignedTo: val } : t)); setSel(p => p ? { ...p, assignedTo: val } : p); }
    catch { setAssignee(sel.assignedTo || ""); push("Failed to assign.", false); }
  };

  const saveNote = async () => {
    if (!sel || !note.trim()) return;
    setSaving(true);
    try { const d = await addSupportInternalNote(sel._id, note.trim()); if (d.success) { setSel(d.data); setTickets(p => p.map(t => t._id === sel._id ? d.data : t)); setNote(""); push("Note saved."); } }
    catch { push("Failed to save note.", false); } finally { setSaving(false); }
  };

  const createSR = async () => {
    if (!srTitle.trim() || !srBody.trim()) return;
    try { const d = await createSupportSavedReply({ title: srTitle.trim(), body: srBody.trim() }); if (d.success) { setReplies(p => [d.data, ...p]); setSrTitle(""); setSrBody(""); setSrOpen(false); push("Saved reply created."); } }
    catch { push("Failed.", false); }
  };

  const supportStaff = staff.filter(m => ["SUPPORT_ADMIN","SUPER_ADMIN","SAFETY_ADMIN"].includes(m.role));
  const assignedName = supportStaff.find(m => String(m._id) === String(assignee));
  const sla = sel?.firstAgentResponseDueAt && !sel.firstAgentResponseAt ? slaInfo(sel.firstAgentResponseDueAt) : null;

  const counts = { open: tickets.filter(t => t.status === "OPEN").length, active: tickets.filter(t => t.status === "IN_PROGRESS").length, resolved: tickets.filter(t => t.status === "RESOLVED").length };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50 font-sans text-gray-900">

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg ${t.ok ? "bg-white border border-gray-200 text-gray-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            {t.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
            {t.msg}
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="ml-1 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>

      {/* ── LEFT: Queue ─────────────────────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">

        {/* Header */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[13px] font-semibold text-gray-900">Support</h1>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span className={`flex items-center gap-1 ${live ? "text-green-600" : "text-gray-400"}`}>
                {live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {live ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-3 flex gap-3 text-[11px]">
            {[{ l: "Open", v: counts.open, c: "text-amber-600" }, { l: "Active", v: counts.active, c: "text-blue-600" }, { l: "Done", v: counts.resolved, c: "text-green-600" }].map(s => (
              <div key={s.l} className="flex items-center gap-1">
                <span className={`font-bold ${s.c}`}>{s.v}</span>
                <span className="text-gray-400">{s.l}</span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-100">
          {(["ALL","OPEN","IN_PROGRESS","RESOLVED"] as QueueFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors ${filter === f ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
              {f === "IN_PROGRESS" ? "Active" : f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-gray-400">No conversations</div>
          ) : filtered.map(ticket => {
            const active = sel?._id === ticket._id;
            return (
              <button key={ticket._id} onClick={() => setSel(ticket)}
                className={`relative w-full border-b border-gray-50 px-4 py-3 text-left transition-colors ${active ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-gray-50"}`}>
                {newIds.has(ticket._id) && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-400" />}
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {uInit(ticket)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="truncate text-[13px] font-medium text-gray-900">{uName(ticket)}</span>
                      <span className="shrink-0 text-[11px] text-gray-400">{ago(lastTs(ticket))}</span>
                    </div>
                    <p className="truncate text-[12px] text-gray-500">{ticket.subject}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[ticket.status] || "bg-gray-300"}`} />
                      <span className="text-[11px] text-gray-400">{STATUS_LABEL[ticket.status]}</span>
                      <span className={`ml-auto text-[10px] ${PRI_CLS[ticket.priority] || ""}`}>{ticket.priority}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Presence */}
        <div className="border-t border-gray-100 px-4 py-2.5">
          <button onClick={() => { const n = presence === "AVAILABLE" ? "AWAY" : "AVAILABLE"; setPresence(n); updateSupportPresence(n).catch(() => {}); }}
            className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
            <span className={`h-2 w-2 rounded-full ${presence === "AVAILABLE" ? "bg-green-400" : "bg-amber-400"}`} />
            <span>{me}</span>
            <span className="text-gray-400">·</span>
            <span>{presence === "AVAILABLE" ? "Online" : "Away"}</span>
          </button>
        </div>
      </div>

      {/* ── CENTER: Chat ─────────────────────────────────────────────────── */}
      {sel ? (
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Chat header */}
          <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[15px] font-semibold text-gray-900 truncate">{sel.subject}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CLS[sel.status] || ""}`}>
                    {STATUS_LABEL[sel.status]}
                  </span>
                  {sel.assistantState === "ACTIVE" && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200">
                      <Bot className="h-3 w-3" /> Bot
                    </span>
                  )}
                  {sla && (
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${sla.hot ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
                      <Clock className="h-3 w-3" /> {sla.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-gray-400">{uName(sel)} · {uEmail(sel)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select value={assignee} onChange={e => changeAssignee(e.target.value)}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 outline-none focus:border-indigo-400">
                  <option value="">Unassigned</option>
                  {supportStaff.map(m => (
                    <option key={m._id} value={m._id}>
                      {(m.fullName || `${m.first_name||""} ${m.last_name||""}`.trim() || m.email).trim()}
                    </option>
                  ))}
                </select>
                <select value={sel.status} onChange={e => changeStatus(sel._id, e.target.value as Ticket["status"])}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 outline-none focus:border-indigo-400">
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-5 space-y-3">

            {/* Original request */}
            <div className="flex justify-start">
              <div className="max-w-[66%]">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="font-medium text-gray-600">{uName(sel)}</span>
                  <span>·</span>
                  <span>Original request</span>
                </div>
                <div className="rounded-lg rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-[14px] leading-6 text-gray-700 shadow-sm">
                  {sel.description}
                </div>
              </div>
            </div>

            {msgs(sel).map((msg, i) => {
              const isAdmin = msg.sender === "ADMIN";
              const isBot   = msg.sender === "ASSISTANT";
              return (
                <div key={`${msg.timestamp}-${i}`} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[66%]">
                    <div className={`mb-1 flex items-center gap-1.5 text-[11px] text-gray-400 ${isAdmin ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium text-gray-600">
                        {isAdmin ? (msg.senderName || me) : isBot ? "Bago Assistant" : uName(sel)}
                      </span>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className={`rounded-lg px-4 py-3 text-[14px] leading-6 ${
                      isAdmin ? "rounded-tr-sm bg-indigo-600 text-white"
                      : isBot  ? "rounded-tl-sm border border-violet-200 bg-violet-50 text-violet-900"
                      : "rounded-tl-sm border border-gray-200 bg-white text-gray-800 shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Reply box */}
          {sel.status !== "CLOSED" ? (
            <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
              {/* Saved reply chips */}
              {replies.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {replies.map(r => (
                    <button key={r.id} onClick={() => setReply(p => p.trim() ? `${p}\n\n${r.body}` : r.body)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Write a reply… (Enter to send)"
                  rows={3}
                  className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-[14px] leading-6 text-gray-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-100 placeholder:text-gray-400 transition-all"
                />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-3 text-center text-[13px] text-gray-400">
              This conversation is closed.
            </div>
          )}
        </div>

      ) : (
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-[14px] font-medium text-gray-500">Select a conversation</p>
            <p className="mt-1 text-[12px] text-gray-400">Choose one from the list to open it here.</p>
          </div>
        </div>
      )}

      {/* ── RIGHT: Context panel ─────────────────────────────────────────── */}
      {sel && (
        <div className="flex w-60 shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-white">

          {/* Customer */}
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[14px] font-bold text-gray-600">
                {uInit(sel)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-gray-900">{uName(sel)}</p>
                <p className="truncate text-[11px] text-gray-400">{uEmail(sel)}</p>
              </div>
            </div>
          </div>

          {/* Ticket details */}
          <div className="border-b border-gray-100 px-4 py-4 space-y-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Details</p>
            <Row label="Status"   value={STATUS_LABEL[sel.status] || sel.status} />
            <Row label="Priority" value={sel.priority} vClass={PRI_CLS[sel.priority]} />
            <Row label="Category" value={sel.category} />
            <Row label="Assigned" value={assignedName ? (assignedName.fullName || `${assignedName.first_name||""} ${assignedName.last_name||""}`.trim() || assignedName.email).trim() : "Unassigned"} />
            <Row label="Created"  value={fmtDate(sel.createdAt)} />
            <Row label="Bot"      value={sel.assistantState === "HANDOFF" ? "Handed off" : sel.assistantState === "ACTIVE" ? "Active" : sel.assistantState || "—"} />
            {sel.firstAgentResponseAt && <Row label="1st reply" value="Sent ✓" vClass="text-green-600" />}
            {sla && <Row label="SLA" value={sla.label} vClass={sla.hot ? "text-red-600 font-semibold" : "text-amber-600"} />}
          </div>

          {/* Internal notes */}
          <div className="border-b border-gray-100">
            <button onClick={() => setShowNotes(p => !p)}
              className="flex w-full items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              <div className="flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" />
                Notes {(sel.internalNotes?.length ?? 0) > 0 && `(${sel.internalNotes!.length})`}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNotes ? "rotate-180" : ""}`} />
            </button>
            {showNotes && (
              <div className="px-4 pb-4 space-y-3">
                {(sel.internalNotes ?? []).map(n => (
                  <div key={n.id} className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
                    <p className="text-[12px] leading-5 text-gray-700">{n.content}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{n.authorName || "Team"} · {ago(n.createdAt)}</p>
                  </div>
                ))}
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" rows={2}
                  className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" />
                <button onClick={saveNote} disabled={saving || !note.trim()}
                  className="w-full rounded-md bg-gray-800 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-900 disabled:opacity-40 transition-colors">
                  {saving ? "Saving…" : "Save note"}
                </button>
              </div>
            )}
          </div>

          {/* Saved replies */}
          <div className="px-4 py-3">
            <button onClick={() => setSrOpen(p => !p)}
              className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              <span>Saved replies</span>
              <Plus className={`h-3.5 w-3.5 transition-transform ${srOpen ? "rotate-45" : ""}`} />
            </button>
            {srOpen && (
              <div className="mt-3 space-y-2">
                <input value={srTitle} onChange={e => setSrTitle(e.target.value)} placeholder="Title"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-[12px] outline-none focus:border-indigo-400" />
                <textarea value={srBody} onChange={e => setSrBody(e.target.value)} placeholder="Reply text" rows={3}
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-1.5 text-[12px] outline-none focus:border-indigo-400" />
                <button onClick={createSR} disabled={!srTitle.trim() || !srBody.trim()}
                  className="w-full rounded-md bg-indigo-600 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
                  Create
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Row({ label, value, vClass = "" }: { label: string; value: string; vClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-[11px] text-gray-400">{label}</span>
      <span className={`truncate text-right text-[12px] text-gray-800 ${vClass}`}>{value}</span>
    </div>
  );
}
