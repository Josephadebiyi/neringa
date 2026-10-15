import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flag,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  StickyNote,
  Wifi,
  WifiOff,
  X,
  Zap,
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

const msgs   = (t: Ticket) => Array.isArray(t.messages) ? t.messages : [];
const uName  = (t: Ticket) => t.user ? `${t.user.firstName} ${t.user.lastName}`.trim() : `${t.userFirstName ?? ""} ${t.userLastName ?? ""}`.trim() || "User";
const uEmail = (t: Ticket) => t.user?.email || t.userEmail || "";
const uInit  = (t: Ticket) => uName(t)[0]?.toUpperCase() || "?";
const lastTs = (t: Ticket) => { const m = msgs(t); return m[m.length - 1]?.timestamp || t.createdAt; };

function ago(v?: string | null) {
  if (!v) return "—";
  const d = Date.now() - new Date(v).getTime();
  if (isNaN(d)) return "—";
  if (d < 60_000)      return "now";
  if (d < 3_600_000)   return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000)  return `${Math.floor(d / 3_600_000)}h ago`;
  if (d < 604_800_000) return `${Math.floor(d / 86_400_000)}d ago`;
  return new Date(v).toLocaleDateString();
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function slaInfo(dueAt: string): { label: string; hot: boolean } {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Breached", hot: true };
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return { label: h > 0 ? `${h}h ${m}m left` : `${m}m left`, hot: ms < 4 * 3_600_000 };
}

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };

const STATUS_PILL: Record<string, string> = {
  OPEN:        "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100  text-blue-700",
  RESOLVED:    "bg-green-100 text-green-700",
  CLOSED:      "bg-gray-100  text-gray-500",
};

const PRI_PILL: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH:   "bg-orange-100 text-orange-700",
  MEDIUM: "bg-gray-100 text-gray-600",
  LOW:    "bg-gray-50 text-gray-400",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

function formatAbsoluteTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function messageSpeakerLabel(message: TicketMessage, ticket: Ticket, agentName: string) {
  if (message.sender === "ADMIN") {
    return message.senderName?.trim() || agentName;
  }
  if (message.sender === "ASSISTANT") {
    return message.senderName?.trim() || "Bago Assistant";
  }
  return uName(ticket);
}

function messageRoleLabel(message: TicketMessage) {
  if (message.sender === "ADMIN") return "Teammate";
  if (message.sender === "ASSISTANT") return "Assistant";
  return "Customer";
}

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
  const [showNotes, setShowNotes] = useState(false);
  const [srOpen,   setSrOpen]    = useState(false);
  const [srTitle,  setSrTitle]   = useState("");
  const [srBody,   setSrBody]    = useState("");
  const [,         setTick]      = useState(0);

  const sockRef = useRef<Socket | null>(null);
  const endRef  = useRef<HTMLDivElement>(null);
  const selRef  = useRef<Ticket | null>(null);
  selRef.current = sel;

  useEffect(() => { const id = setInterval(() => setTick(n => n + 1), 60_000); return () => clearInterval(id); }, []);

  const push = (msg: string, ok = true) => {
    const id = `${Date.now()}`;
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // Socket
  useEffect(() => {
    const s = io(API_ROOT.replace("/api", ""), { transports: ["websocket", "polling"], reconnection: true });
    sockRef.current = s;
    s.on("connect",    () => { setLive(true); s.emit("join_support_agents"); });
    s.on("disconnect", () => setLive(false));
    s.on("new_support_ticket", ({ ticket }: { ticket: Ticket }) => {
      setTickets(p => { const id = ticket._id || ticket.id || ""; if (p.some(t => t._id === id)) return p; return [{ ...ticket, _id: id }, ...p]; });
      setNewIds(p => new Set(p).add(ticket._id || ticket.id || ""));
    });
    s.on("support_message", ({ ticketId, message }: { ticketId: string; message: TicketMessage }) => {
      // Dedup by content+sender within 10 s to handle optimistic-vs-server timestamp mismatch
      const dup = (ms: TicketMessage[]) => (Array.isArray(ms) ? ms : []).some(m =>
        m.content === message.content && m.sender === message.sender &&
        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 10_000
      );
      setTickets(p => p.map(t => t._id !== ticketId || dup(msgs(t)) ? t : { ...t, messages: [...msgs(t), message] }));
      if (selRef.current?._id === ticketId)
        setSel(p => !p || dup(msgs(p)) ? p : { ...p, messages: [...msgs(p), message] });
    });
    return () => { s.disconnect(); };
  }, []);

  // Presence
  useEffect(() => {
    const sync = (p: "AVAILABLE" | "AWAY" | "OFFLINE") => updateSupportPresence(p).catch(() => {});
    sync("AVAILABLE");
    const ivl = setInterval(() => { if (presence === "AVAILABLE") sync("AVAILABLE"); }, 30_000);
    const onVis = () => { const p = document.hidden ? "AWAY" : "AVAILABLE"; setPresence(p); sync(p); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(ivl); document.removeEventListener("visibilitychange", onVis); sync("OFFLINE"); };
  }, [presence]);

  // On ticket select
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
    const txt = reply.trim();
    setSending(true); setReply("");
    try {
      const d = await replyToTicket(sel._id, txt, me);
      if (d?.success && d?.data?.messages?.length) {
        // Append only the new admin message (last item) — don't replace the whole array,
        // otherwise user messages that arrived via socket during the in-flight request get wiped.
        const newMsg: TicketMessage = d.data.messages[d.data.messages.length - 1];
        const appendIfNew = (ms: TicketMessage[]) => {
          const already = ms.some(m =>
            m.content === newMsg.content && m.sender === newMsg.sender &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 10_000
          );
          return already ? ms : [...ms, newMsg];
        };
        setSel(p => p ? { ...p, messages: appendIfNew(msgs(p)) } : p);
        setTickets(p => p.map(t => t._id === sel._id ? { ...t, messages: appendIfNew(msgs(t)) } : t));
      }
    }
    catch (e: any) { push(e?.message || "Failed to send.", false); }
    finally { setSending(false); }
  };

  const changeStatus = async (id: string, status: Ticket["status"]) => {
    const prev = tickets.find(t => t._id === id)?.status;
    setTickets(p => p.map(t => t._id === id ? { ...t, status } : t));
    if (sel?._id === id) setSel(p => p ? { ...p, status } : p);
    try { await updateTicketStatus(id, status); }
    catch { if (prev) { setTickets(p => p.map(t => t._id === id ? { ...t, status: prev as Ticket["status"] } : t)); if (sel?._id === id) setSel(p => p ? { ...p, status: prev as Ticket["status"] } : p); } push("Failed to update status.", false); }
  };

  const changeAssignee = async (val: string) => {
    if (!sel) return;
    setAssignee(val);
    try { await updateTicketStatus(sel._id, undefined, val || null); setTickets(p => p.map(t => t._id === sel._id ? { ...t, assignedTo: val } : t)); setSel(p => p ? { ...p, assignedTo: val } : p); }
    catch (e: any) { setAssignee(sel.assignedTo || ""); push(e?.message || "Failed to assign.", false); }
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

  const supportStaff = staff.filter(m => ["SUPPORT_ADMIN", "SUPER_ADMIN", "SAFETY_ADMIN"].includes(m.role));
  const assignedMember = supportStaff.find(m => String(m._id) === String(assignee));
  const assignedName = assignedMember ? (assignedMember.fullName || `${assignedMember.first_name || ""} ${assignedMember.last_name || ""}`.trim() || assignedMember.email).trim() : "";
  const sla = sel?.firstAgentResponseDueAt && !sel.firstAgentResponseAt ? slaInfo(sel.firstAgentResponseDueAt) : null;

  const counts = {
    open:    tickets.filter(t => t.status === "OPEN").length,
    active:  tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved:tickets.filter(t => t.status === "RESOLVED").length,
    urgent:  tickets.filter(t => t.priority === "URGENT").length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col overflow-hidden font-sans text-gray-900" style={{ height: "calc(100vh - 80px)" }}>

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

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 px-8 py-5">
        <div className="flex items-start justify-between gap-6">

          {/* Left: branding */}
          <div className="min-w-0">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Bago Conversation Desk
            </p>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              <Zap className="h-3 w-3" /> Intercom-style support workspace
            </div>
            <h1 className="mb-1 text-[26px] font-bold leading-tight text-gray-900">
              Support inbox for teammates
            </h1>
            <p className="max-w-lg text-[13px] leading-5 text-gray-500">
              Keep every conversation in one operator workspace, move fast on urgent tickets, and make the queue feel like a real support messenger.
            </p>
          </div>

          {/* Right: metric cards */}
          <div className="flex shrink-0 gap-3">
            {[
              { label: "OPEN",     value: counts.open,     icon: Inbox,          color: "text-amber-500" },
              { label: "ACTIVE",   value: counts.active,   icon: Clock,          color: "text-blue-500"  },
              { label: "RESOLVED", value: counts.resolved, icon: CheckCircle2,   color: "text-green-500" },
              { label: "URGENT",   value: counts.urgent,   icon: Flag,           color: "text-red-500"   },
            ].map(c => (
              <div key={c.label} className="flex flex-col items-center rounded-xl border border-white/80 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm">
                <c.icon className={`mb-1.5 h-5 w-5 ${c.color}`} />
                <span className="text-[22px] font-bold text-gray-900 leading-none">{c.value}</span>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-gray-400">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN LAYOUT ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Queue ─────────────────────────────────────────────── */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">

          {/* Queue header */}
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="mb-0.5 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Queue</h2>
              <span className={`flex items-center gap-1 text-[11px] font-medium ${live ? "text-green-600" : "text-gray-400"}`}>
                {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {live ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-[12px] text-gray-400">{filtered.length} conversation{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Search */}
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search people, subjects, or messages"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[12px] outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 border-b border-gray-100 px-4 py-2.5">
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as QueueFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                {f === "IN_PROGRESS" ? "IN PROGRESS" : f === "ALL" ? "ALL" : f === "RESOLVED" ? "RES" : f}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-gray-400">No conversations</div>
            ) : (
              filtered.map(ticket => {
                const active = sel?._id === ticket._id;
                const lastMsg = msgs(ticket).slice(-1)[0];
                return (
                  <button
                    key={ticket._id}
                    onClick={() => setSel(ticket)}
                    className={`relative w-full border-b border-gray-100 px-4 py-4 text-left transition-colors ${
                      active ? "border-l-[3px] border-l-indigo-500 bg-indigo-50/60 pl-[13px]" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {newIds.has(ticket._id) && (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-400" />
                    )}

                    {/* Row 1: Avatar + name + email + time */}
                    <div className="mb-2 flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${active ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                        {uInit(ticket)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="truncate text-[13px] font-semibold text-gray-900">{uName(ticket)}</span>
                          <span className="shrink-0 text-[11px] text-gray-400">{ago(lastTs(ticket))}</span>
                        </div>
                        <p className="truncate text-[11px] text-gray-400">{uEmail(ticket)}</p>
                      </div>
                    </div>

                    {/* Subject */}
                    <p className="mb-1.5 truncate text-[13px] font-semibold text-gray-800">{ticket.subject}</p>

                    {/* Message preview */}
                    {lastMsg && (
                      <p className="mb-2.5 line-clamp-2 text-[12px] leading-5 text-gray-500">{lastMsg.content}</p>
                    )}

                    {/* Pills */}
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_PILL[ticket.status] || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABEL[ticket.status] || ticket.status}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${PRI_PILL[ticket.priority] || "bg-gray-100 text-gray-500"}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{ticket.category}</span>
                    </div>

                    {/* Footer: assistant status + assignee */}
                    <div className="flex items-center justify-between">
                      {ticket.assistantState === "ACTIVE" ? (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Bot className="h-3 w-3" /> Assistant currently covering
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Agent handling</span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {ticket.assignedTo ? "Assigned" : "Unassigned"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Presence toggle */}
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => { const n = presence === "AVAILABLE" ? "AWAY" : "AVAILABLE"; setPresence(n); updateSupportPresence(n).catch(() => {}); }}
              className="flex items-center gap-2 text-[12px] text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className={`h-2 w-2 rounded-full ${presence === "AVAILABLE" ? "bg-green-400" : "bg-amber-400"}`} />
              <span className="font-medium">{me}</span>
              <span className="text-gray-300">·</span>
              <span>{presence === "AVAILABLE" ? "Online" : "Away"}</span>
            </button>
          </div>
        </div>

        {/* CENTER: Chat ─────────────────────────────────────────────── */}
        {sel ? (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">

            {/* Chat header */}
            <div className="shrink-0 border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">

                {/* Left: category + status + description */}
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {sel.category}
                    </span>
                    <span className={`rounded px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_PILL[sel.status] || ""}`}>
                      {STATUS_LABEL[sel.status]}
                    </span>
                    {sel.assistantState === "ACTIVE" && (
                      <span className="flex items-center gap-1 rounded bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                        <Bot className="h-3 w-3" /> Bot active
                      </span>
                    )}
                    {sla && (
                      <span className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-semibold ${sla.hot ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        <Clock className="h-3 w-3" /> {sla.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-400">
                    Talking with <span className="font-medium text-gray-700">{uName(sel)}</span>. Last activity {ago(lastTs(sel))}.
                  </p>
                </div>

                {/* Right: replying-as + assignee + status */}
                <div className="flex shrink-0 items-end gap-4">
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Replying as</p>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-800">
                      {me}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Assignee</p>
                    <select
                      value={assignee}
                      onChange={e => changeAssignee(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-indigo-300"
                    >
                      <option value="">Unassigned</option>
                      {supportStaff.map(m => (
                        <option key={m._id} value={m._id}>
                          {(m.fullName || `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email).trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                    <select
                      value={sel.status}
                      onChange={e => changeStatus(sel._id, e.target.value as Ticket["status"])}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-indigo-300"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 px-6 py-5 space-y-5">

              {/* Original description */}
              <MessageBlock
                label="Customer"
                labelCls="bg-indigo-100 text-indigo-700"
                name={uName(sel)}
                time={fmtTime(sel.createdAt)}
                initial={uInit(sel)}
                avatarCls="bg-indigo-200 text-indigo-800"
                bubbleCls="bg-white border border-gray-200 text-gray-800 shadow-sm"
                content={sel.description}
              />

              {msgs(sel).map((msg, i) => {
                const isAdmin = msg.sender === "ADMIN";
                const isBot   = msg.sender === "ASSISTANT";
                return (
                  <MessageBlock
                    key={`${msg.timestamp}-${i}`}
                    label={isAdmin ? "Admin" : isBot ? "Assistant" : "Customer"}
                    labelCls={isAdmin ? "bg-green-100 text-green-700" : isBot ? "bg-violet-100 text-violet-700" : "bg-indigo-100 text-indigo-700"}
                    name={isAdmin ? (msg.senderName || me) : isBot ? "Bago Assistant" : uName(sel)}
                    time={fmtTime(msg.timestamp)}
                    initial={(isAdmin ? (msg.senderName || me) : isBot ? "B" : uName(sel))[0]?.toUpperCase() || "?"}
                    avatarCls={isAdmin ? "bg-green-500 text-white" : isBot ? "bg-violet-500 text-white" : "bg-indigo-200 text-indigo-800"}
                    bubbleCls={isAdmin ? "bg-indigo-600 text-white shadow-sm" : isBot ? "bg-violet-50 border border-violet-200 text-violet-900" : "bg-white border border-gray-200 text-gray-800 shadow-sm"}
                    content={msg.content}
                  />
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Reply box */}
            {sel.status !== "CLOSED" ? (
              <div className="shrink-0 border-t border-gray-200 bg-white p-4">
                {replies.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {replies.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setReply(p => p.trim() ? `${p}\n\n${r.body}` : r.body)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
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
                    placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
                    rows={3}
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                  >
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
              <p className="text-[14px] font-semibold text-gray-500">Select a conversation</p>
              <p className="mt-1 text-[13px] text-gray-400">Choose one from the queue to open it here.</p>
            </div>
          </div>
        )}

        {/* RIGHT: Context panel ─────────────────────────────────────── */}
        {sel && (
          <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-white">

            {/* Requester */}
            <div className="border-b border-gray-100 px-5 py-5">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Requester</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[14px] font-bold text-white">
                  {uInit(sel)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-900">{uName(sel)}</p>
                  <p className="truncate text-[11px] text-gray-400">{uEmail(sel)}</p>
                </div>
              </div>
            </div>

            {/* Ticket fields */}
            <div className="border-b border-gray-100 px-5 py-4 space-y-4">
              <FieldBlock label="Category"    value={sel.category} />
              <FieldBlock label="Priority"    value={sel.priority} vClass={sel.priority === "URGENT" || sel.priority === "HIGH" ? "text-red-600 font-semibold" : ""} />
              <FieldBlock label="Assistant"   value={sel.assistantState === "HANDOFF" ? "Handed off" : sel.assistantState === "ACTIVE" ? "Active" : sel.assistantState || "—"} />
              <FieldBlock label="Assigned to" value={assignedName || "Unassigned"} />
              <FieldBlock label="Created"     value={fmtDate(sel.createdAt)} />
              {sel.firstAgentResponseAt && <FieldBlock label="First reply" value="Sent ✓" vClass="text-green-600" />}
              {sla && <FieldBlock label="SLA" value={sla.label} vClass={sla.hot ? "text-red-600 font-semibold" : "text-amber-600"} />}
            </div>

            {/* Internal notes */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => setShowNotes(p => !p)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600"
              >
                <span className="flex items-center gap-1.5">
                  <StickyNote className="h-3 w-3" />
                  Notes {(sel.internalNotes?.length ?? 0) > 0 && `(${sel.internalNotes!.length})`}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNotes ? "rotate-180" : ""}`} />
              </button>
              {showNotes && (
                <div className="px-5 pb-4 space-y-3">
                  {(sel.internalNotes ?? []).map(n => (
                    <div key={n.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="text-[12px] leading-5 text-gray-700">{n.content}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{n.authorName || "Team"} · {ago(n.createdAt)}</p>
                    </div>
                  ))}
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a note…"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                  />
                  <button
                    onClick={saveNote}
                    disabled={saving || !note.trim()}
                    className="w-full rounded-lg bg-gray-800 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-gray-900 disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save note"}
                  </button>
                </div>
              )}
            </div>

            {/* Saved replies manager */}
            <div className="px-5 py-4">
              <button
                onClick={() => setSrOpen(p => !p)}
                className="flex w-full items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600"
              >
                <span>Saved replies</span>
                <Plus className={`h-3.5 w-3.5 transition-transform ${srOpen ? "rotate-45" : ""}`} />
              </button>
              {srOpen && (
                <div className="mt-3 space-y-2">
                  <input
                    value={srTitle}
                    onChange={e => setSrTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] outline-none focus:border-indigo-300"
                  />
                  <textarea
                    value={srBody}
                    onChange={e => setSrBody(e.target.value)}
                    placeholder="Reply text"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] outline-none focus:border-indigo-300"
                  />
                  <button
                    onClick={createSR}
                    disabled={!srTitle.trim() || !srBody.trim()}
                    className="w-full rounded-lg bg-indigo-600 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBlock({
  label, labelCls, name, time, initial, avatarCls, bubbleCls, content,
}: {
  label: string; labelCls: string; name: string; time: string;
  initial: string; avatarCls: string; bubbleCls: string; content: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <span className={`rounded px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${labelCls}`}>
          {label}
        </span>
        <span className="text-[11px] text-gray-400">
          {name} {time ? `· ${time}` : ""}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${avatarCls}`}>
          {initial}
        </div>
        <div className={`max-w-xl rounded-xl px-4 py-3 text-[14px] leading-6 ${bubbleCls}`}>
          {content}
        </div>
      </div>
    </div>
  );
}

function FieldBlock({ label, value, vClass = "" }: { label: string; value: string; vClass?: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-[13px] font-semibold text-gray-900 ${vClass}`}>{value}</p>
    </div>
  );
}
