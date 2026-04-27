import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Flag,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  UserRound,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

import { API_ROOT } from "../config/api";
import { BAGO_BRAND } from "../config/brand";
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
  isActive?: boolean;
}

interface SavedReply {
  id: string;
  title: string;
  body: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

type QueueFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";
type PriorityFilter = "ALL" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";
type Presence = "AVAILABLE" | "AWAY" | "OFFLINE";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const queueFilters: QueueFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];
const priorityFilters: PriorityFilter[] = ["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"];

function userName(ticket: Ticket) {
  if (ticket.user) return `${ticket.user.firstName} ${ticket.user.lastName}`.trim();
  return `${ticket.userFirstName ?? ""} ${ticket.userLastName ?? ""}`.trim() || "User";
}

function userEmail(ticket: Ticket) {
  return ticket.user?.email || ticket.userEmail || "No email available";
}

function userInitial(ticket: Ticket) {
  return userName(ticket)[0]?.toUpperCase() || "U";
}

function lastActivity(ticket: Ticket) {
  const lastMessage = ticket.messages[ticket.messages.length - 1];
  return lastMessage?.timestamp || ticket.createdAt;
}

function statusTone(status: Ticket["status"]) {
  switch (status) {
    case "OPEN":       return "bg-[#FFF4D8] text-[#9A6200] border-[#F6DE9A]";
    case "IN_PROGRESS": return "bg-[#EAF1FF] text-[#355CC9] border-[#C9D8FF]";
    case "RESOLVED":   return "bg-[#E9F8EF] text-[#16794A] border-[#BEE8CD]";
    case "CLOSED":     return "bg-[#F3F4F7] text-[#667085] border-[#E4E7EC]";
  }
}

function priorityTone(priority: Ticket["priority"]) {
  switch (priority) {
    case "URGENT": return "bg-[#FFF0F0] text-[#C73737]";
    case "HIGH":   return "bg-[#FFF3E8] text-[#C66A1C]";
    case "MEDIUM": return "bg-[#EEF2FF] text-[#4F46E5]";
    case "LOW":    return "bg-[#F4F5F7] text-[#667085]";
  }
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  if (diff < minute)      return "Just now";
  if (diff < hour)        return `${Math.floor(diff / minute)}m ago`;
  if (diff < day)         return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day)     return `${Math.floor(diff / day)}d ago`;
  return new Date(value).toLocaleDateString();
}

function formatSlaCountdown(dueAt: string): { label: string; urgent: boolean } {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "SLA breached", urgent: true };
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const urgent = ms < 4 * 3_600_000;
  if (hours > 0) return { label: `${hours}h ${minutes}m until SLA breach`, urgent };
  return { label: `${minutes}m until SLA breach`, urgent };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Support() {
  const { user } = useAuth();
  const agentName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Agent"
    : "Agent";

  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [filter, setFilter]           = useState<QueueFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [searchTerm, setSearchTerm]   = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const [staff, setStaff]             = useState<StaffMember[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [savingNote, setSavingNote]   = useState(false);
  const [newSavedReplyTitle, setNewSavedReplyTitle] = useState("");
  const [newSavedReplyBody, setNewSavedReplyBody]   = useState("");
  const [creatingSavedReply, setCreatingSavedReply] = useState(false);
  const [presence, setPresence]       = useState<Presence>("AVAILABLE");
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [, setSlaTick]                = useState(0);

  const socketRef         = useRef<Socket | null>(null);
  const chatBottomRef     = useRef<HTMLDivElement>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  selectedTicketRef.current = selectedTicket;

  // SLA countdown ticks every minute
  useEffect(() => {
    const id = window.setInterval(() => setSlaTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ── Toasts ────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = API_ROOT.replace("/api", "");
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_support_agents");
    });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("error", (err: unknown) => console.error("Socket error:", err));

    socket.on("new_support_ticket", ({ ticket }: { ticket: Ticket }) => {
      setTickets((prev) => {
        const nid = ticket._id || ticket.id || "";
        if (prev.some((t) => t._id === nid)) return prev;
        return [{ ...ticket, _id: nid }, ...prev];
      });
      setNewTicketIds((prev) => new Set(prev).add(ticket._id || ticket.id || ""));
    });

    socket.on("support_message", ({ ticketId, message }: { ticketId: string; message: TicketMessage }) => {
      const isDuplicate = (msgs: TicketMessage[]) =>
        msgs.some((m) => m.timestamp === message.timestamp && m.content === message.content);

      setTickets((prev) =>
        prev.map((t) => {
          if (t._id !== ticketId || isDuplicate(t.messages)) return t;
          return { ...t, messages: [...t.messages, message] };
        }),
      );

      if (selectedTicketRef.current?._id === ticketId) {
        setSelectedTicket((prev) => {
          if (!prev || isDuplicate(prev.messages)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        });
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Presence sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = async (p: Presence) => {
      try { await updateSupportPresence(p); } catch (e) { /* silent */ }
    };

    sync("AVAILABLE");
    const id = window.setInterval(() => {
      if (presence === "AVAILABLE") sync("AVAILABLE");
    }, 30_000);

    const onVisibility = () => {
      const next: Presence = document.hidden ? "AWAY" : "AVAILABLE";
      setPresence(next);
      sync(next);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      sync("OFFLINE");
    };
  }, [presence]);

  const handleTogglePresence = async () => {
    const next: Presence = presence === "AVAILABLE" ? "AWAY" : "AVAILABLE";
    setPresence(next);
    try { await updateSupportPresence(next); } catch (e) { /* silent */ }
  };

  // ── Join ticket room on select ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTicket) return;
    socketRef.current?.emit("join_support_ticket", selectedTicket._id);
    socketRef.current?.emit("support_agent_joined", {
      ticketId: selectedTicket._id,
      agentId: user?.id,
      agentName,
    });
    setNewTicketIds((prev) => { const n = new Set(prev); n.delete(selectedTicket._id); return n; });
  }, [selectedTicket?._id, agentName]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages.length]);

  // ── Data fetches ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getTickets();
        if (data.success) setTickets(data.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getStaff();
        if (data.success) setStaff(data.data);
      } catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSupportSavedReplies();
        if (data.success) setSavedReplies(data.data);
      } catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTicket) { setInternalNoteDraft(""); return; }
    setInternalNoteDraft("");
  }, [selectedTicket?._id]);

  useEffect(() => {
    setSelectedAssignee(selectedTicket?.assignedTo || "");
  }, [selectedTicket?._id, selectedTicket?.assignedTo]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredTickets = tickets
    .filter((ticket) => {
      if (filter !== "ALL" && ticket.status !== filter) return false;
      if (priorityFilter !== "ALL" && ticket.priority !== priorityFilter) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return [
        ticket.subject,
        ticket.description,
        userName(ticket),
        userEmail(ticket),
        ticket.category,
        ticket.messages[ticket.messages.length - 1]?.content || "",
      ].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime());

  const openCount     = tickets.filter((t) => t.status === "OPEN").length;
  const activeCount   = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const urgentCount   = tickets.filter((t) => t.priority === "URGENT").length;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    const content = reply.trim();
    setSending(true);
    setReply("");

    const optimistic: TicketMessage = {
      sender: "ADMIN",
      senderId: user?.id ?? "",
      senderName: agentName,
      content,
      timestamp: new Date().toISOString(),
    };

    const prevMessages = selectedTicket.messages;
    setSelectedTicket((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
    setTickets((prev) =>
      prev.map((t) =>
        t._id === selectedTicket._id
          ? { ...t, messages: [...t.messages, optimistic], status: "IN_PROGRESS" }
          : t,
      ),
    );

    try {
      await replyToTicket(selectedTicket._id, content, agentName);
    } catch {
      // Roll back optimistic message on failure
      setSelectedTicket((prev) => prev ? { ...prev, messages: prevMessages } : prev);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === selectedTicket._id ? { ...t, messages: prevMessages } : t,
        ),
      );
      addToast("Failed to send reply. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Ticket["status"]) => {
    const prev = tickets.find((t) => t._id === id)?.status;
    setTickets((prev_) => prev_.map((t) => (t._id === id ? { ...t, status } : t)));
    if (selectedTicket?._id === id) setSelectedTicket((prev_) => prev_ ? { ...prev_, status } : prev_);
    try {
      await updateTicketStatus(id, status);
    } catch {
      // Rollback
      if (prev) {
        setTickets((prev_) => prev_.map((t) => (t._id === id ? { ...t, status: prev } : t)));
        if (selectedTicket?._id === id)
          setSelectedTicket((prev_) => prev_ ? { ...prev_, status: prev } : prev_);
      }
      addToast("Failed to update status.", "error");
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!selectedTicket) return;
    setSelectedAssignee(assigneeId);
    try {
      await updateTicketStatus(selectedTicket._id, selectedTicket.status, assigneeId || null);
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? { ...t, assignedTo: assigneeId } : t)),
      );
      setSelectedTicket((prev) => prev ? { ...prev, assignedTo: assigneeId } : prev);
    } catch {
      setSelectedAssignee(selectedTicket.assignedTo || "");
      addToast("Failed to assign ticket.", "error");
    }
  };

  const handleSaveInternalNote = async () => {
    if (!selectedTicket || !internalNoteDraft.trim()) return;
    setSavingNote(true);
    try {
      const data = await addSupportInternalNote(selectedTicket._id, internalNoteDraft.trim());
      if (data.success) {
        setSelectedTicket(data.data);
        setTickets((prev) => prev.map((t) => (t._id === selectedTicket._id ? data.data : t)));
        setInternalNoteDraft("");
        addToast("Internal note saved.", "success");
      }
    } catch {
      addToast("Failed to save internal note.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateSavedReply = async () => {
    if (!newSavedReplyTitle.trim() || !newSavedReplyBody.trim()) return;
    setCreatingSavedReply(true);
    try {
      const data = await createSupportSavedReply({
        title: newSavedReplyTitle.trim(),
        body: newSavedReplyBody.trim(),
      });
      if (data.success) {
        setSavedReplies((prev) => [data.data, ...prev]);
        setNewSavedReplyTitle("");
        setNewSavedReplyBody("");
        addToast("Saved reply created.", "success");
      }
    } catch {
      addToast("Failed to create saved reply.", "error");
    } finally {
      setCreatingSavedReply(false);
    }
  };

  const handleInsertSavedReply = (value: string) => {
    setReply((prev) => (prev.trim() ? `${prev}\n\n${value}` : value));
  };

  const supportStaff   = staff.filter((m) => m.role === "SUPPORT_ADMIN" || m.role === "SUPER_ADMIN");
  const assignedStaff  = supportStaff.find((m) => String(m._id) === String(selectedAssignee));
  const selectedLastMsg = selectedTicket?.messages[selectedTicket.messages.length - 1];

  const slaInfo = selectedTicket?.firstAgentResponseDueAt && !selectedTicket.firstAgentResponseAt
    ? formatSlaCountdown(selectedTicket.firstAgentResponseDueAt)
    : null;

  const presenceColor: Record<Presence, string> = {
    AVAILABLE: "bg-emerald-400",
    AWAY: "bg-amber-400",
    OFFLINE: "bg-slate-300",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-160px)] rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(82,64,232,0.12),_transparent_32%),linear-gradient(180deg,#fbfbff_0%,#f4f6fb_100%)] p-4 md:p-6">

      {/* ── Toast rack ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-xl transition ${
              toast.type === "success"
                ? "bg-[#E9F8EF] text-[#16794A]"
                : toast.type === "error"
                  ? "bg-[#FFF0F0] text-[#C73737]"
                  : "bg-[#EAF1FF] text-[#355CC9]"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
            {toast.type === "error"   && <AlertCircle  className="h-4 w-4 flex-shrink-0" />}
            {toast.type === "info"    && <Zap           className="h-4 w-4 flex-shrink-0" />}
            {toast.message}
            <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}>
              <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={BAGO_BRAND.logoUrl}
              alt={BAGO_BRAND.name}
              className="h-11 w-11 rounded-2xl bg-white p-1.5 shadow-sm"
            />
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#98A2B3]">
              Bago conversation desk
            </span>
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-[#5240E8] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Intercom-style support workspace
          </div>
          <h1 className="text-3xl font-black text-[#1e2749] md:text-4xl">
            Support inbox for teammates
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#667085]">
            Keep every conversation in one operator workspace, move fast on urgent tickets, and
            make the queue feel like a real support messenger instead of a generic admin list.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Presence toggle */}
          <button
            onClick={handleTogglePresence}
            className="inline-flex items-center gap-2 rounded-full border border-[#E7EAF0] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#344054] shadow-sm transition hover:border-[#5240E8]/30 hover:bg-[#F6F4FF]"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${presenceColor[presence]}`} />
            {presence === "AVAILABLE" ? "Online — click to go away" : "Away — click to go online"}
          </button>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard icon={Inbox}        label="Open"     value={openCount}     accent="bg-[#FFF4D8] text-[#9A6200]" />
            <MetricCard icon={Clock3}       label="Active"   value={activeCount}   accent="bg-[#EAF1FF] text-[#355CC9]" />
            <MetricCard icon={CheckCircle2} label="Resolved" value={resolvedCount} accent="bg-[#E9F8EF] text-[#16794A]" />
            <MetricCard icon={Flag}         label="Urgent"   value={urgentCount}   accent="bg-[#FFF0F0] text-[#C73737]" />
          </div>
        </div>
      </div>

      {/* ── 3-column grid ───────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_300px]">

        {/* ── Queue panel ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_18px_60px_rgba(30,39,73,0.08)] backdrop-blur">
          <div className="border-b border-[#EEF0F5] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1e2749]">Queue</h2>
                <p className="text-xs font-medium text-[#98A2B3]">
                  {filteredTickets.length} conversation{filteredTickets.length === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                  socketConnected ? "bg-[#ECFDF3] text-[#16794A]" : "bg-[#F4F5F7] text-[#667085]"
                }`}
              >
                {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {socketConnected ? "Live" : "Offline"}
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
              <input
                type="text"
                placeholder="Search people, subjects, or messages"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-[#E7EAF0] bg-[#F9FAFB] py-3 pl-11 pr-4 text-sm font-medium text-[#1e2749] outline-none transition focus:border-[#C9CCFF] focus:bg-white focus:ring-4 focus:ring-[#5240E8]/10"
              />
            </div>

            {/* Status filters */}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {queueFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                    filter === item
                      ? "bg-[#5240E8] text-white shadow-[0_6px_16px_rgba(82,64,232,0.22)]"
                      : "bg-[#F4F5F7] text-[#667085] hover:bg-[#ECEFF3]"
                  }`}
                >
                  {item.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Priority filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {priorityFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => setPriorityFilter(item)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                    priorityFilter === item
                      ? "bg-[#1e2749] text-white"
                      : "bg-[#F4F5F7] text-[#667085] hover:bg-[#ECEFF3]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#5240E8]" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#98A2B3]">Loading conversations</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="px-8 py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F4F5F7]">
                  <Inbox className="h-7 w-7 text-[#98A2B3]" />
                </div>
                <h3 className="text-base font-black text-[#1e2749]">Nothing matches that queue view</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#98A2B3]">
                  Adjust your search or change the filters to bring more conversations back into view.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const preview = ticket.messages[ticket.messages.length - 1]?.content || ticket.description;
                const isSelected = selectedTicket?._id === ticket._id;
                const isNew = newTicketIds.has(ticket._id);

                return (
                  <button
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`relative w-full border-b border-[#F2F4F7] px-5 py-4 text-left transition last:border-b-0 ${
                      isSelected ? "bg-[#F4F3FF]" : "bg-white hover:bg-[#FAFBFF]"
                    }`}
                  >
                    {isNew && (
                      <span className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F04438] text-[9px] font-black text-white">
                        ●
                      </span>
                    )}
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FF] text-sm font-black text-[#355CC9]">
                        {userInitial(ticket)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#1e2749]">{userName(ticket)}</p>
                            <p className="truncate text-xs font-medium text-[#98A2B3]">{userEmail(ticket)}</p>
                          </div>
                          <span className="whitespace-nowrap text-[11px] font-bold text-[#98A2B3]">
                            {formatRelativeTime(lastActivity(ticket))}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-sm font-bold text-[#344054]">{ticket.subject}</p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium leading-6 text-[#667085]">{preview}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${priorityTone(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="ml-auto text-[11px] font-bold text-[#98A2B3]">{ticket.category}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat panel ──────────────────────────────────────────────── */}
        {selectedTicket ? (
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
            {/* Chat header */}
            <div className="border-b border-[#EEF0F5] px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#5240E8]">
                      {selectedTicket.category}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(selectedTicket.status)}`}>
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                    {selectedTicket.assistantState === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F4EEFF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7C4DFF]">
                        <Bot className="h-3 w-3" /> Bot active
                      </span>
                    )}
                    {selectedTicket.assistantState === "HANDOFF" && (
                      <span className="rounded-full bg-[#E9F8EF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#16794A]">
                        Agent took over
                      </span>
                    )}
                  </div>
                  <h2 className="line-clamp-1 text-2xl font-black text-[#1e2749]">
                    {selectedTicket.subject}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#667085]">
                    Talking with {userName(selectedTicket)}. Last activity{" "}
                    {formatRelativeTime(lastActivity(selectedTicket))}.
                  </p>
                  {/* Live SLA countdown */}
                  {slaInfo && (
                    <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                      slaInfo.urgent
                        ? "bg-[#FFF0F0] text-[#C73737]"
                        : "bg-[#FFF4D8] text-[#9A6200]"
                    }`}>
                      <Clock3 className="h-3.5 w-3.5" />
                      {slaInfo.label}
                    </p>
                  )}
                  {selectedTicket.firstAgentResponseAt && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E9F8EF] px-3 py-1 text-xs font-black text-[#16794A]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> First response sent
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">Replying as</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${presenceColor[presence]}`} />
                      <p className="text-sm font-black text-[#1e2749]">{agentName}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">Assignee</p>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => handleAssign(e.target.value)}
                      className="mt-1 min-w-[160px] bg-transparent text-sm font-black text-[#1e2749] outline-none"
                    >
                      <option value="">Unassigned</option>
                      {supportStaff.map((m) => (
                        <option key={m._id} value={m._id}>
                          {(m.fullName || `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email).trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value as Ticket["status"])}
                    className="rounded-2xl border border-[#D7DBE4] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#344054] outline-none transition focus:border-[#5240E8] focus:ring-4 focus:ring-[#5240E8]/10"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message thread */}
            <div className="max-h-[calc(100vh-450px)] overflow-y-auto bg-[linear-gradient(180deg,#fcfcff_0%,#f6f7fb_100%)] px-6 py-6">
              {/* Original request bubble */}
              <div className="mb-5 rounded-[26px] border border-[#EBEEFA] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1FF] text-sm font-black text-[#355CC9]">
                    {userInitial(selectedTicket)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1e2749]">{userName(selectedTicket)}</p>
                    <p className="text-xs font-medium text-[#98A2B3]">Original request</p>
                  </div>
                </div>
                <p className="text-sm font-medium leading-7 text-[#475467]">{selectedTicket.description}</p>
              </div>

              <div className="space-y-5">
                {selectedTicket.messages.map((message, index) => {
                  const isAdmin     = message.sender === "ADMIN";
                  const isAssistant = message.sender === "ASSISTANT";
                  return (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={`flex gap-3 ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      {!isAdmin && (
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          isAssistant ? "bg-[#F4EEFF] text-[#5240E8]" : "bg-[#EAF1FF] text-[#355CC9]"
                        }`}>
                          {isAssistant ? <Bot className="h-4 w-4" /> : userInitial(selectedTicket)}
                        </div>
                      )}
                      <div className={`max-w-[82%] ${isAdmin ? "text-right" : "text-left"}`}>
                        <div className={`mb-2 flex items-center gap-2 text-xs font-bold ${
                          isAdmin ? "justify-end text-[#667085]" : "justify-start text-[#98A2B3]"
                        }`}>
                          <span>
                            {isAdmin
                              ? message.senderName || "Agent"
                              : isAssistant
                                ? message.senderName || "Bago Assistant"
                                : userName(selectedTicket)}
                          </span>
                          <span>·</span>
                          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className={`inline-block rounded-[26px] px-5 py-4 text-sm font-medium leading-7 shadow-sm ${
                          isAdmin
                            ? "rounded-tr-md bg-[#5240E8] text-white shadow-[#5240E8]/20"
                            : isAssistant
                              ? "rounded-tl-md border border-[#E7D8FF] bg-[#F8F4FF] text-[#4B3FB5]"
                              : "rounded-tl-md border border-[#EBEEF5] bg-white text-[#475467]"
                        }`}>
                          {message.content}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#5240E8] text-sm font-black text-white">
                          {(message.senderName || agentName)[0]?.toUpperCase() || "A"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div ref={chatBottomRef} />
            </div>

            {/* Reply input */}
            {selectedTicket.status !== "CLOSED" && (
              <div className="border-t border-[#EEF0F5] bg-white px-6 py-5">
                <div className="rounded-[28px] border border-[#E6E8F0] bg-[#FAFBFF] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition focus-within:border-[#C9CCFF] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#5240E8]/10">
                  {savedReplies.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {savedReplies.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInsertSavedReply(item.body)}
                          className="rounded-full border border-[#DDE2F2] bg-white px-3 py-1.5 text-[11px] font-black text-[#5240E8] transition hover:border-[#C6CBFF] hover:bg-[#F6F4FF]"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#5240E8]">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1e2749]">Reply as {agentName}</p>
                      <p className="text-xs font-medium text-[#98A2B3]">
                        Keep replies concise, clear, and tied to the issue.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end gap-3">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
                      }}
                      placeholder="Write a reply..."
                      rows={3}
                      className="min-h-[80px] flex-1 resize-none bg-transparent text-sm font-medium leading-6 text-[#1e2749] outline-none placeholder:text-[#98A2B3]"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !reply.trim()}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5240E8] text-white shadow-[0_14px_30px_rgba(82,64,232,0.28)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state — spans both chat + sidebar columns */
          <div className="flex min-h-[620px] items-center justify-center rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_60px_rgba(30,39,73,0.08)] xl:col-span-2">
            <div className="max-w-lg px-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] bg-[linear-gradient(135deg,#EEF2FF_0%,#F5F3FF_100%)] text-[#5240E8]">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black text-[#1e2749]">Pick a conversation to start helping</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-[#667085]">
                The workspace is built to feel like a teammate inbox: queue on the left, live thread
                in the middle, and customer context on the right.
              </p>
            </div>
          </div>
        )}

        {/* ── Right sidebar ───────────────────────────────────────────── */}
        {selectedTicket && (
          <aside className="space-y-4">
            {/* Requester card */}
            <div className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">Requester</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#EAF1FF] text-lg font-black text-[#355CC9]">
                  {userInitial(selectedTicket)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#1e2749]">{userName(selectedTicket)}</p>
                  <p className="truncate text-sm font-medium text-[#667085]">{userEmail(selectedTicket)}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <ContextRow label="Category" value={selectedTicket.category} />
                <ContextRow label="Priority"  value={selectedTicket.priority} />
                <ContextRow
                  label="Bot state"
                  value={selectedTicket.assistantState === "HANDOFF" ? "Human takeover" : selectedTicket.assistantState || "ACTIVE"}
                />
                <ContextRow
                  label="Assigned to"
                  value={
                    assignedStaff
                      ? (assignedStaff.fullName || `${assignedStaff.first_name || ""} ${assignedStaff.last_name || ""}`.trim() || assignedStaff.email).trim()
                      : "Unassigned"
                  }
                />
                <ContextRow label="Created" value={new Date(selectedTicket.createdAt).toLocaleString()} />
                <ContextRow
                  label="Latest reply"
                  value={selectedLastMsg ? new Date(selectedLastMsg.timestamp).toLocaleString() : "No replies yet"}
                />
                {slaInfo && (
                  <div className={`rounded-2xl px-4 py-3 ${slaInfo.urgent ? "bg-[#FFF0F0]" : "bg-[#FFF4D8]"}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">SLA</p>
                    <p className={`mt-1 text-sm font-bold ${slaInfo.urgent ? "text-[#C73737]" : "text-[#9A6200]"}`}>
                      {slaInfo.label}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Team tools */}
            <div className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">Team tools</p>
              <div className="mt-4 space-y-4">
                {/* Internal notes */}
                <div className="rounded-2xl border border-[#EEF0F5] bg-[#FCFCFD] p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">
                    Internal notes
                  </p>
                  {/* Note history */}
                  {(selectedTicket.internalNotes ?? []).length > 0 && (
                    <div className="mb-3 max-h-[160px] space-y-2 overflow-y-auto">
                      {(selectedTicket.internalNotes ?? []).map((note) => (
                        <div key={note.id} className="rounded-xl border border-[#E7EAF0] bg-white p-3">
                          <p className="text-xs font-medium leading-5 text-[#475467]">{note.content}</p>
                          <p className="mt-1.5 text-[10px] font-bold text-[#98A2B3]">
                            {note.authorName || "Team"} · {formatRelativeTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    placeholder="Add a note visible to the team only..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#E7EAF0] bg-white px-3 py-2.5 text-sm font-medium leading-6 text-[#1e2749] outline-none transition focus:border-[#C9CCFF] focus:ring-4 focus:ring-[#5240E8]/10"
                  />
                  <button
                    type="button"
                    onClick={handleSaveInternalNote}
                    disabled={savingNote || !internalNoteDraft.trim()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1E2749] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white transition disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {savingNote ? "Saving…" : "Save note"}
                  </button>
                </div>

                {/* Create saved reply */}
                <div className="rounded-2xl border border-[#EEF0F5] bg-[#FCFCFD] p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">
                    Create saved reply
                  </p>
                  <input
                    value={newSavedReplyTitle}
                    onChange={(e) => setNewSavedReplyTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm font-medium text-[#1e2749] outline-none"
                  />
                  <textarea
                    value={newSavedReplyBody}
                    onChange={(e) => setNewSavedReplyBody(e.target.value)}
                    placeholder="Reply text"
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm font-medium text-[#1e2749] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSavedReply}
                    disabled={creatingSavedReply || !newSavedReplyTitle.trim() || !newSavedReplyBody.trim()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#5240E8] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
                  >
                    {creatingSavedReply ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {creatingSavedReply ? "Creating…" : "Save reply"}
                  </button>
                </div>

                {/* Quick tips */}
                <GuidanceCard
                  icon={Clock3}
                  title="Acknowledge quickly"
                  description="Even a short first response helps the thread feel alive and staffed."
                />
                <GuidanceCard
                  icon={Shield}
                  title="Own the conversation"
                  description="Use status changes to show teammates whether the ticket is actively being handled."
                />
                <GuidanceCard
                  icon={UserRound}
                  title="Keep context in-thread"
                  description="Intercom-style support works best when all updates stay in the same thread."
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_40px_rgba(30,39,73,0.06)]">
      <div className={`inline-flex rounded-2xl p-2.5 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-2xl font-black text-[#1e2749]">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">{label}</p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F9FC] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#1e2749]">{value}</p>
    </div>
  );
}

function GuidanceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EEF0F5] bg-[#FCFCFD] p-4">
      <div className="mb-3 inline-flex rounded-2xl bg-[#EEF2FF] p-2 text-[#5240E8]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-black text-[#1e2749]">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">{description}</p>
    </div>
  );
}
