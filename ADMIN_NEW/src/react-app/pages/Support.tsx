import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flag,
  Inbox,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Search,
  Send,
  Shield,
  StickyNote,
  UserRound,
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
  authorId?: string;
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
  category: "SHIPMENT" | "PAYMENT" | "ACCOUNT" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  assistantState?: "ACTIVE" | "HANDOFF" | "DISABLED";
  firstAgentResponseDueAt?: string;
  firstAgentResponseAt?: string | null;
  internalNotes?: InternalNote[];
  messages: TicketMessage[];
  createdAt: string;
}

interface StaffMember {
  _id: string;
  id?: number | string;
  fullName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: "SUPER_ADMIN" | "SAFETY_ADMIN" | "SUPPORT_ADMIN";
}

interface SavedReply { id: string; title: string; body: string; }
interface Toast     { id: string; message: string; type: "success" | "error" | "info"; }

type QueueFilter    = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";
type Presence       = "AVAILABLE" | "AWAY" | "OFFLINE";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function userName(t: Ticket) {
  if (t.user) return `${t.user.firstName} ${t.user.lastName}`.trim();
  return `${t.userFirstName ?? ""} ${t.userLastName ?? ""}`.trim() || "User";
}
function userEmail(t: Ticket) { return t.user?.email || t.userEmail || ""; }
function userInitial(t: Ticket) { return userName(t)[0]?.toUpperCase() || "U"; }
function lastActivity(t: Ticket) {
  return t.messages[t.messages.length - 1]?.timestamp || t.createdAt;
}

function relativeTime(v: string) {
  const d = Date.now() - new Date(v).getTime();
  const m = 60_000, h = 60 * m, day = 24 * h;
  if (d < m)       return "now";
  if (d < h)       return `${Math.floor(d / m)}m`;
  if (d < day)     return `${Math.floor(d / h)}h`;
  if (d < 7 * day) return `${Math.floor(d / day)}d`;
  return new Date(v).toLocaleDateString();
}

function slaCountdown(dueAt: string): { label: string; hot: boolean } {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "SLA breached", hot: true };
  const h = Math.floor(ms / 3_600_000), mm = Math.floor((ms % 3_600_000) / 60_000);
  return { label: h > 0 ? `${h}h ${mm}m` : `${mm}m`, hot: ms < 4 * 3_600_000 };
}

const STATUS_COLORS: Record<Ticket["status"], string> = {
  OPEN:        "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED:    "bg-emerald-100 text-emerald-700",
  CLOSED:      "bg-slate-100 text-slate-500",
};
const STATUS_DOT: Record<Ticket["status"], string> = {
  OPEN:        "bg-amber-400",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED:    "bg-emerald-500",
  CLOSED:      "bg-slate-400",
};
const PRIORITY_COLORS: Record<Ticket["priority"], string> = {
  URGENT: "text-red-600",
  HIGH:   "text-orange-500",
  MEDIUM: "text-indigo-500",
  LOW:    "text-slate-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Support() {
  const { user } = useAuth();
  const agentName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Agent"
    : "Agent";

  const [tickets, setTickets]             = useState<Ticket[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState<Ticket | null>(null);
  const [reply, setReply]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [filter, setFilter]               = useState<QueueFilter>("ALL");
  const [search, setSearch]               = useState("");
  const [connected, setConnected]         = useState(false);
  const [newIds, setNewIds]               = useState<Set<string>>(new Set());
  const [staff, setStaff]                 = useState<StaffMember[]>([]);
  const [assignee, setAssignee]           = useState("");
  const [savedReplies, setSavedReplies]   = useState<SavedReply[]>([]);
  const [noteDraft, setNoteDraft]         = useState("");
  const [savingNote, setSavingNote]       = useState(false);
  const [srTitle, setSrTitle]             = useState("");
  const [srBody, setSrBody]               = useState("");
  const [creatingSr, setCreatingSr]       = useState(false);
  const [presence, setPresence]           = useState<Presence>("AVAILABLE");
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const [showNotes, setShowNotes]         = useState(false);
  const [showSavedReplyForm, setShowSavedReplyForm] = useState(false);
  const [, setTick]                       = useState(0);

  const socketRef  = useRef<Socket | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const selRef     = useRef<Ticket | null>(null);
  selRef.current   = selected;

  // ── SLA ticker ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setTick(n => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = (message: string, type: Toast["type"] = "info") => {
    const id = `${Date.now()}`;
    setToasts(p => [...p, { id, message, type }]);
    window.setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_ROOT.replace("/api", ""), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect",    () => { setConnected(true);  socket.emit("join_support_agents"); });
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_support_ticket", ({ ticket }: { ticket: Ticket }) => {
      setTickets(prev => {
        const nid = ticket._id || ticket.id || "";
        if (prev.some(t => t._id === nid)) return prev;
        return [{ ...ticket, _id: nid }, ...prev];
      });
      setNewIds(prev => new Set(prev).add(ticket._id || ticket.id || ""));
    });

    socket.on("support_message", ({ ticketId, message }: { ticketId: string; message: TicketMessage }) => {
      const dup = (msgs: TicketMessage[]) =>
        msgs.some(m => m.timestamp === message.timestamp && m.content === message.content);

      setTickets(prev => prev.map(t => {
        if (t._id !== ticketId || dup(t.messages)) return t;
        return { ...t, messages: [...t.messages, message] };
      }));
      if (selRef.current?._id === ticketId) {
        setSelected(prev => {
          if (!prev || dup(prev.messages)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        });
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Presence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = (p: Presence) => updateSupportPresence(p).catch(() => {});
    sync("AVAILABLE");
    const id = window.setInterval(() => { if (presence === "AVAILABLE") sync("AVAILABLE"); }, 30_000);
    const vis = () => { const p: Presence = document.hidden ? "AWAY" : "AVAILABLE"; setPresence(p); sync(p); };
    document.addEventListener("visibilitychange", vis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", vis); sync("OFFLINE"); };
  }, [presence]);

  // ── Select ticket ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    socketRef.current?.emit("join_support_ticket", selected._id);
    socketRef.current?.emit("support_agent_joined", { ticketId: selected._id, agentId: user?.id, agentName });
    setNewIds(prev => { const n = new Set(prev); n.delete(selected._id); return n; });
    setNoteDraft("");
    setShowNotes(false);
  }, [selected?._id]);

  useEffect(() => {
    setAssignee(selected?.assignedTo || "");
  }, [selected?._id, selected?.assignedTo]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length]);

  // ── Data ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try { setLoading(true); const d = await getTickets(); if (d.success) setTickets(d.data); }
      catch { /**/ } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { const d = await getStaff(); if (d.success) setStaff(d.data); } catch { /**/ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { const d = await getSupportSavedReplies(); if (d.success) setSavedReplies(d.data); } catch { /**/ }
    })();
  }, []);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = tickets
    .filter(t => {
      if (filter !== "ALL" && t.status !== filter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [t.subject, t.description, userName(t), userEmail(t), t.category,
              t.messages[t.messages.length - 1]?.content || ""]
        .join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime());

  const counts = {
    open:     tickets.filter(t => t.status === "OPEN").length,
    active:   tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    urgent:   tickets.filter(t => t.priority === "URGENT").length,
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const content = reply.trim();
    const prevMsgs = selected.messages;
    setSending(true);
    setReply("");

    const opt: TicketMessage = {
      sender: "ADMIN", senderId: user?.id ?? "", senderName: agentName,
      content, timestamp: new Date().toISOString(),
    };
    setSelected(p => p ? { ...p, messages: [...p.messages, opt], status: "IN_PROGRESS" } : p);
    setTickets(p => p.map(t => t._id === selected._id
      ? { ...t, messages: [...t.messages, opt], status: "IN_PROGRESS" } : t));

    try {
      await replyToTicket(selected._id, content, agentName);
    } catch {
      setSelected(p => p ? { ...p, messages: prevMsgs } : p);
      setTickets(p => p.map(t => t._id === selected._id ? { ...t, messages: prevMsgs } : t));
      toast("Failed to send reply.", "error");
    } finally { setSending(false); }
  };

  const changeStatus = async (id: string, status: Ticket["status"]) => {
    const prev = tickets.find(t => t._id === id)?.status;
    setTickets(p => p.map(t => t._id === id ? { ...t, status } : t));
    if (selected?._id === id) setSelected(p => p ? { ...p, status } : p);
    try { await updateTicketStatus(id, status); }
    catch {
      if (prev) {
        setTickets(p => p.map(t => t._id === id ? { ...t, status: prev } : t));
        if (selected?._id === id) setSelected(p => p ? { ...p, status: prev } : p);
      }
      toast("Failed to update status.", "error");
    }
  };

  const changeAssignee = async (val: string) => {
    if (!selected) return;
    setAssignee(val);
    try {
      await updateTicketStatus(selected._id, selected.status, val || null);
      setTickets(p => p.map(t => t._id === selected._id ? { ...t, assignedTo: val } : t));
      setSelected(p => p ? { ...p, assignedTo: val } : p);
    } catch {
      setAssignee(selected.assignedTo || "");
      toast("Failed to assign ticket.", "error");
    }
  };

  const saveNote = async () => {
    if (!selected || !noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const d = await addSupportInternalNote(selected._id, noteDraft.trim());
      if (d.success) {
        setSelected(d.data);
        setTickets(p => p.map(t => t._id === selected._id ? d.data : t));
        setNoteDraft("");
        toast("Note saved.", "success");
      }
    } catch { toast("Failed to save note.", "error"); }
    finally { setSavingNote(false); }
  };

  const saveSavedReply = async () => {
    if (!srTitle.trim() || !srBody.trim()) return;
    setCreatingSr(true);
    try {
      const d = await createSupportSavedReply({ title: srTitle.trim(), body: srBody.trim() });
      if (d.success) {
        setSavedReplies(p => [d.data, ...p]);
        setSrTitle(""); setSrBody("");
        setShowSavedReplyForm(false);
        toast("Saved reply created.", "success");
      }
    } catch { toast("Failed.", "error"); }
    finally { setCreatingSr(false); }
  };

  const supportStaff = staff.filter(m =>
    m.role === "SUPPORT_ADMIN" || m.role === "SUPER_ADMIN" || m.role === "SAFETY_ADMIN"
  );
  const assignedMember = supportStaff.find(m => String(m._id) === String(assignee));
  const assignedName = assignedMember
    ? (assignedMember.fullName || `${assignedMember.first_name || ""} ${assignedMember.last_name || ""}`.trim() || assignedMember.email).trim()
    : null;

  const sla = selected?.firstAgentResponseDueAt && !selected.firstAgentResponseAt
    ? slaCountdown(selected.firstAgentResponseDueAt) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  // -m-6 cancels the DashboardLayout p-6 so we own the full viewport below the topbar
  return (
    <div className="-m-6 flex h-[calc(100vh-80px)] overflow-hidden bg-[#F0F2F8]">

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            t.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : t.type === "error" ? "bg-red-50 text-red-800 border border-red-200"
            : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}>
            {t.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {t.type === "error"   && <AlertCircle  className="h-4 w-4 shrink-0" />}
            {t.message}
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="ml-1 opacity-50 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ══════════════════ LEFT — QUEUE PANEL ══════════════════════════════ */}
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#E2E5EF] bg-white">

        {/* Queue header */}
        <div className="shrink-0 border-b border-[#E2E5EF] px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-[#1e2749]">Inbox</h2>
              <p className="text-[11px] text-[#98A2B3]">{filtered.length} conversations</p>
            </div>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "Live" : "Off"}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#C0C5D4]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-xl border border-[#E7EAF0] bg-[#F8F9FC] py-2.5 pl-9 pr-3 text-[13px] text-[#1e2749] outline-none focus:border-[#5240E8] focus:ring-2 focus:ring-[#5240E8]/10"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["ALL","OPEN","IN_PROGRESS","RESOLVED"] as QueueFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] transition ${
                  filter === f ? "bg-[#5240E8] text-white" : "bg-[#F0F2F8] text-[#667085] hover:bg-[#E7EAF0]"
                }`}>
                {f.replace("_"," ")}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#5240E8]" />
              <p className="text-[11px] font-medium text-[#98A2B3]">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox className="mx-auto h-8 w-8 text-[#C0C5D4]" />
              <p className="mt-3 text-[13px] font-medium text-[#98A2B3]">No conversations</p>
            </div>
          ) : filtered.map(ticket => {
            const isActive = selected?._id === ticket._id;
            const preview = ticket.messages[ticket.messages.length - 1]?.content || ticket.description;
            return (
              <button key={ticket._id} onClick={() => setSelected(ticket)}
                className={`relative w-full border-b border-[#F0F2F8] px-4 py-3.5 text-left transition-colors ${
                  isActive ? "bg-[#F0EEFF] border-l-2 border-l-[#5240E8]" : "hover:bg-[#F8F9FC]"
                }`}
              >
                {newIds.has(ticket._id) && (
                  <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-red-500" />
                )}
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-black ${
                    isActive ? "bg-[#5240E8] text-white" : "bg-[#EAF1FF] text-[#355CC9]"
                  }`}>
                    {userInitial(ticket)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[13px] font-bold text-[#1e2749]">{userName(ticket)}</p>
                      <span className="shrink-0 text-[11px] text-[#B0B8CC]">{relativeTime(lastActivity(ticket))}</span>
                    </div>
                    <p className="truncate text-[12px] font-medium text-[#667085]">{ticket.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-[#9AA3B5]">{preview}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[ticket.status]}`} />
                      <span className="text-[10px] font-semibold text-[#9AA3B5]">
                        {ticket.status.replace("_"," ")}
                      </span>
                      <span className={`ml-auto text-[10px] font-black ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Presence footer */}
        <div className="shrink-0 border-t border-[#E2E5EF] p-3">
          <button
            onClick={() => {
              const next: Presence = presence === "AVAILABLE" ? "AWAY" : "AVAILABLE";
              setPresence(next);
              updateSupportPresence(next).catch(() => {});
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-[#F0F2F8] transition-colors"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              presence === "AVAILABLE" ? "bg-emerald-400" : "bg-amber-400"
            }`} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[#1e2749]">{agentName}</p>
              <p className="text-[10px] text-[#98A2B3]">
                {presence === "AVAILABLE" ? "Online · click to go away" : "Away · click to go online"}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* ══════════════════ CENTER — CHAT ════════════════════════════════════ */}
      {selected ? (
        <main className="flex min-w-0 flex-1 flex-col bg-white">

          {/* Chat topbar */}
          <div className="shrink-0 border-b border-[#E2E5EF] bg-white px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[15px] font-black text-[#1e2749]">{selected.subject}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] ${STATUS_COLORS[selected.status]}`}>
                    {selected.status.replace("_"," ")}
                  </span>
                  {selected.assistantState === "ACTIVE" && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
                      <Bot className="h-3 w-3" /> Bot active
                    </span>
                  )}
                  {selected.assistantState === "HANDOFF" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      Agent took over
                    </span>
                  )}
                  {sla && (
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      sla.hot ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      <Clock3 className="h-3 w-3" /> {sla.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-[#98A2B3]">
                  {userName(selected)} · {userEmail(selected)} · {relativeTime(lastActivity(selected))} ago
                </p>
              </div>

              {/* Status + assign controls */}
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={assignee} onChange={e => changeAssignee(e.target.value)}
                  className="rounded-xl border border-[#E2E5EF] bg-[#F8F9FC] px-3 py-2 text-[12px] font-semibold text-[#1e2749] outline-none focus:border-[#5240E8]"
                >
                  <option value="">Unassigned</option>
                  {supportStaff.map(m => (
                    <option key={m._id} value={m._id}>
                      {(m.fullName || `${m.first_name||""} ${m.last_name||""}`.trim() || m.email).trim()}
                    </option>
                  ))}
                </select>
                <select
                  value={selected.status}
                  onChange={e => changeStatus(selected._id, e.target.value as Ticket["status"])}
                  className="rounded-xl border border-[#E2E5EF] bg-[#F8F9FC] px-3 py-2 text-[12px] font-semibold text-[#1e2749] outline-none focus:border-[#5240E8]"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Message thread — fills all remaining space */}
          <div className="flex-1 overflow-y-auto bg-[#F8F9FC] px-6 py-5 space-y-4">

            {/* Original request */}
            <div className="flex justify-start">
              <div className="max-w-[70%]">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF1FF] text-[11px] font-black text-[#355CC9]">
                    {userInitial(selected)}
                  </div>
                  <span className="text-[12px] font-bold text-[#667085]">{userName(selected)}</span>
                  <span className="text-[11px] text-[#B0B8CC]">Original request</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-[#E7EAF0] bg-white px-4 py-3 text-[14px] leading-6 text-[#475467] shadow-sm">
                  {selected.description}
                </div>
              </div>
            </div>

            {/* Messages */}
            {selected.messages.map((msg, i) => {
              const isAdmin     = msg.sender === "ADMIN";
              const isAssistant = msg.sender === "ASSISTANT";
              return (
                <div key={`${msg.timestamp}-${i}`} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[68%] ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#9AA3B5] ${isAdmin ? "flex-row-reverse" : ""}`}>
                      {!isAdmin && (
                        <div className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${
                          isAssistant ? "bg-violet-100 text-violet-700" : "bg-[#EAF1FF] text-[#355CC9]"
                        }`}>
                          {isAssistant ? <Bot className="h-3 w-3" /> : userInitial(selected)}
                        </div>
                      )}
                      {isAdmin && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5240E8] text-[10px] font-black text-white">
                          {(msg.senderName || agentName)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span>{isAdmin ? (msg.senderName || "Agent") : isAssistant ? "Bago Assistant" : userName(selected)}</span>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                      isAdmin
                        ? "rounded-tr-sm bg-[#5240E8] text-white"
                        : isAssistant
                          ? "rounded-tl-sm border border-violet-200 bg-violet-50 text-violet-900"
                          : "rounded-tl-sm border border-[#E7EAF0] bg-white text-[#344054]"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply area */}
          {selected.status !== "CLOSED" ? (
            <div className="shrink-0 border-t border-[#E2E5EF] bg-white px-5 py-4">
              {/* Saved reply chips */}
              {savedReplies.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {savedReplies.map(sr => (
                    <button key={sr.id}
                      onClick={() => setReply(p => p.trim() ? `${p}\n\n${sr.body}` : sr.body)}
                      className="rounded-full border border-[#DDE2F2] bg-[#F6F4FF] px-3 py-1 text-[11px] font-bold text-[#5240E8] hover:bg-[#EDE9FF] transition-colors"
                    >
                      {sr.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea + send */}
              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-2xl border border-[#E2E5EF] bg-[#F8F9FC] px-4 py-3 focus-within:border-[#5240E8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5240E8]/10 transition-all">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder={`Reply as ${agentName}… (Enter to send, Shift+Enter for new line)`}
                    rows={3}
                    className="w-full resize-none bg-transparent text-[14px] leading-6 text-[#1e2749] outline-none placeholder:text-[#B0B8CC]"
                  />
                </div>
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5240E8] text-white shadow-md transition hover:bg-[#4030C8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-[#E2E5EF] bg-[#F8F9FC] px-5 py-4 text-center text-[13px] text-[#98A2B3]">
              This conversation is closed.
            </div>
          )}
        </main>
      ) : (
        /* Empty state */
        <main className="flex flex-1 items-center justify-center bg-[#F8F9FC]">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-md text-[#5240E8]">
              <MessageSquare className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-black text-[#1e2749]">Select a conversation</h3>
            <p className="mt-2 text-[13px] text-[#98A2B3]">Pick one from the inbox on the left to start helping.</p>
          </div>
        </main>
      )}

      {/* ══════════════════ RIGHT — CONTEXT PANEL ═══════════════════════════ */}
      {selected && (
        <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-l border-[#E2E5EF] bg-white">

          {/* Customer */}
          <div className="border-b border-[#F0F2F8] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FF] text-lg font-black text-[#355CC9]">
                {userInitial(selected)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-black text-[#1e2749]">{userName(selected)}</p>
                <p className="truncate text-[11px] text-[#98A2B3]">{userEmail(selected)}</p>
              </div>
            </div>
          </div>

          {/* Ticket meta */}
          <div className="border-b border-[#F0F2F8] p-4 space-y-2.5">
            <MRow label="Category"  value={selected.category} />
            <MRow label="Priority"  value={selected.priority} className={PRIORITY_COLORS[selected.priority]} />
            <MRow label="Assigned"  value={assignedName || "Unassigned"} />
            <MRow label="Bot"       value={selected.assistantState === "HANDOFF" ? "Handed off" : selected.assistantState || "ACTIVE"} />
            <MRow label="Created"   value={new Date(selected.createdAt).toLocaleDateString()} />
            {sla && (
              <MRow label="SLA" value={sla.label} className={sla.hot ? "text-red-600 font-bold" : "text-amber-700 font-bold"} />
            )}
            {selected.firstAgentResponseAt && (
              <MRow label="1st reply" value="✓ Sent" className="text-emerald-700" />
            )}
          </div>

          {/* Internal notes */}
          <div className="border-b border-[#F0F2F8]">
            <button
              onClick={() => setShowNotes(p => !p)}
              className="flex w-full items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#667085] hover:bg-[#F8F9FC] transition-colors"
            >
              <div className="flex items-center gap-2">
                <StickyNote className="h-3.5 w-3.5" />
                Internal notes {(selected.internalNotes?.length ?? 0) > 0 && `(${selected.internalNotes!.length})`}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNotes ? "rotate-180" : ""}`} />
            </button>
            {showNotes && (
              <div className="px-4 pb-4 space-y-3">
                {/* Existing notes */}
                {(selected.internalNotes ?? []).map(note => (
                  <div key={note.id} className="rounded-xl border border-[#E7EAF0] bg-[#FAFBFF] p-3">
                    <p className="text-[12px] leading-5 text-[#475467]">{note.content}</p>
                    <p className="mt-1 text-[10px] text-[#B0B8CC]">
                      {note.authorName || "Team"} · {relativeTime(note.createdAt)}
                    </p>
                  </div>
                ))}
                <textarea
                  value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Add a note…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E7EAF0] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#1e2749] outline-none focus:border-[#5240E8] focus:ring-2 focus:ring-[#5240E8]/10"
                />
                <button onClick={saveNote} disabled={savingNote || !noteDraft.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1E2749] py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white disabled:opacity-40 transition-opacity">
                  {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {savingNote ? "Saving…" : "Save note"}
                </button>
              </div>
            )}
          </div>

          {/* Saved replies management */}
          <div className="p-4">
            <button
              onClick={() => setShowSavedReplyForm(p => !p)}
              className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-[#667085] hover:text-[#5240E8] transition-colors mb-3"
            >
              <span>Saved replies</span>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {showSavedReplyForm && (
              <div className="space-y-2.5">
                <input value={srTitle} onChange={e => setSrTitle(e.target.value)} placeholder="Title"
                  className="w-full rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-[12px] text-[#1e2749] outline-none focus:border-[#5240E8]" />
                <textarea value={srBody} onChange={e => setSrBody(e.target.value)} placeholder="Reply text" rows={3}
                  className="w-full resize-none rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-[12px] text-[#1e2749] outline-none focus:border-[#5240E8]" />
                <button onClick={saveSavedReply} disabled={creatingSr || !srTitle.trim() || !srBody.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5240E8] py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white disabled:opacity-40">
                  {creatingSr ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {creatingSr ? "Saving…" : "Create"}
                </button>
              </div>
            )}

            {/* Quick tips */}
            <div className="mt-4 space-y-2">
              <TipRow icon={Clock3}    text="Respond within 4 h of first open." />
              <TipRow icon={Shield}    text="Mark IN PROGRESS as soon as you start." />
              <TipRow icon={UserRound} text="Assign to yourself to own the thread." />
              <TipRow icon={Flag}      text="URGENT tickets need an ack in 30 min." />
            </div>
          </div>
        </aside>
      )}

      {/* Metric bar — fixed at the very bottom when no ticket selected */}
      {!selected && (
        <div className="pointer-events-none absolute bottom-0 left-[300px] right-0 flex items-center justify-center gap-6 border-t border-[#E2E5EF] bg-white/90 px-8 py-3 backdrop-blur">
          <Stat icon={Inbox}        label="Open"     value={counts.open}     color="text-amber-600" />
          <Stat icon={Clock3}       label="Active"   value={counts.active}   color="text-blue-600" />
          <Stat icon={CheckCircle2} label="Resolved" value={counts.resolved} color="text-emerald-600" />
          <Stat icon={Flag}         label="Urgent"   value={counts.urgent}   color="text-red-600" />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-[#B0B8CC] shrink-0">{label}</span>
      <span className={`text-right text-[12px] font-semibold text-[#344054] truncate ${className}`}>{value}</span>
    </div>
  );
}

function TipRow({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[11px] text-[#98A2B3]">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-[#C0C5D4]" />
      {text}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Inbox; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-[13px] font-black text-[#1e2749]">{value}</span>
      <span className="text-[11px] text-[#98A2B3]">{label}</span>
    </div>
  );
}
