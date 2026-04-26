import { useEffect, useRef, useState } from "react";
import {
  MessageSquare, CheckCircle, Search, Send, Shield,
  Loader2, Flag, Wifi, WifiOff, X, Clock,
} from "lucide-react";
import { getTickets, updateTicketStatus, replyToTicket } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useAdminSocket } from "../hooks/useAdminSocket";

interface TicketMessage {
  sender: 'USER' | 'ADMIN';
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  id?: string;
  // Flat (PostgreSQL) format from our new controller
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userImage?: string;
  // Nested format (legacy)
  user?: { firstName: string; lastName: string; email: string; profileImage?: string };
  subject: string;
  description: string;
  category: "SHIPMENT" | "PAYMENT" | "ACCOUNT" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

// helpers that work for both flat and nested format
const displayName = (t: Ticket) => {
  if (t.user?.firstName) return `${t.user.firstName} ${t.user.lastName}`;
  const f = t.userFirstName ?? '', l = t.userLastName ?? '';
  return `${f} ${l}`.trim() || 'User';
};
const displayInitial = (t: Ticket) =>
  (t.user?.firstName?.[0] ?? t.userFirstName?.[0] ?? 'U').toUpperCase();
const ticketId = (t: Ticket) => t._id || t.id || '';

export default function Support() {
  const { user } = useAuth();
  const { connected, onSupportMessage, onNewTicket, clearSupportBadge } = useAdminSocket();
  const agentName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agent'
    : 'Agent';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [search, setSearch] = useState('');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<Ticket | null>(null);
  selectedRef.current = selected;

  // Clear badge on mount
  useEffect(() => { clearSupportBadge(); }, []);

  // Load tickets
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getTickets();
        if (data.success) setTickets(data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Live: new ticket created
  useEffect(() => onNewTicket(({ ticket }) => {
    const id = ticketId(ticket as unknown as Ticket);
    setTickets(prev => {
      if (prev.some(t => ticketId(t) === id)) return prev;
      return [{ ...ticket as unknown as Ticket, messages: [] }, ...prev];
    });
    setNewIds(prev => new Set(prev).add(id));
  }), []);

  // Live: new message on any ticket
  useEffect(() => onSupportMessage(({ ticketId: tid, message }) => {
    const appendMsg = (t: Ticket): Ticket => {
      if (ticketId(t) !== tid) return t;
      const exists = t.messages.some(
        m => m.timestamp === message.timestamp && m.content === message.content
      );
      return exists ? t : { ...t, messages: [...t.messages, message] };
    };
    setTickets(prev => prev.map(appendMsg));
    if (ticketId(selectedRef.current ?? {} as Ticket) === tid) {
      setSelected(prev => prev ? appendMsg(prev) : prev);
    }
  }), []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages.length]);

  const openTicket = (t: Ticket) => {
    setSelected(t);
    setNewIds(prev => { const s = new Set(prev); s.delete(ticketId(t)); return s; });
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const content = reply.trim();
    setSending(true);
    setReply('');
    // Optimistic
    const optimistic: TicketMessage = {
      sender: 'ADMIN', senderId: user?.id ?? '',
      senderName: agentName, content, timestamp: new Date().toISOString(),
    };
    setSelected(p => p ? { ...p, messages: [...p.messages, optimistic] } : p);
    try {
      await replyToTicket(ticketId(selected), content, agentName);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const changeStatus = async (id: string, status: Ticket['status']) => {
    try {
      await updateTicketStatus(id, status);
      const upd = (t: Ticket) => ticketId(t) === id ? { ...t, status } : t;
      setTickets(p => p.map(upd));
      setSelected(p => p && ticketId(p) === id ? { ...p, status } : p);
    } catch (e) { console.error(e); }
  };

  const filtered = tickets.filter(t => {
    if (filter !== 'ALL' && t.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      displayName(t).toLowerCase().includes(q)
    );
  });

  const statusColor = (s: Ticket['status']) => ({
    OPEN: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
    RESOLVED: 'bg-green-50 text-green-600 border-green-200',
    CLOSED: 'bg-gray-50 text-gray-400 border-gray-200',
  }[s]);

  const priorityColor = (p: Ticket['priority']) => ({
    URGENT: 'text-red-600 bg-red-50',
    HIGH: 'text-orange-600 bg-orange-50',
    MEDIUM: 'text-blue-600 bg-blue-50',
    LOW: 'text-gray-500 bg-gray-50',
  }[p]);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-4 animate-in fade-in duration-500">

      {/* ── Ticket list sidebar ─────────────────────────────────────────── */}
      <div className="w-[380px] flex flex-col premium-card overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#1e2749]">Support Inbox</h2>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${connected ? 'text-green-500' : 'text-gray-400'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide whitespace-nowrap border transition-all ${filter === s ? 'border-[#5240E8] bg-[#5240E8] text-white' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#5240E8]/20 focus:border-[#5240E8]/40" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-[#5240E8] animate-spin" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <CheckCircle className="w-10 h-10 text-gray-200 mb-3" />
              <p className="font-bold text-sm text-[#1e2749]">All clear</p>
              <p className="text-xs text-gray-400 mt-1">No tickets match your filters</p>
            </div>
          ) : filtered.map(t => {
            const id = ticketId(t);
            const isSelected = ticketId(selected ?? {} as Ticket) === id;
            const lastMsg = t.messages[t.messages.length - 1];
            const isNew = newIds.has(id);

            return (
              <button key={id} onClick={() => openTicket(t)}
                className={`w-full p-4 text-left transition-all border-l-[3px] relative ${isSelected ? 'border-l-[#5240E8] bg-indigo-50/40' : 'border-l-transparent hover:bg-gray-50'}`}>
                {isNew && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${statusColor(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium shrink-0">
                    {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-bold text-[#1e2749] text-sm mb-1 truncate pr-4">{t.subject}</p>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                  {lastMsg ? `${lastMsg.sender === 'ADMIN' ? 'You' : displayName(t)}: ${lastMsg.content}` : t.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-600">
                    {displayInitial(t)}
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">{displayName(t)}</span>
                  <span className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black ${priorityColor(t.priority)}`}>
                    <Flag className="w-2 h-2" />{t.priority}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col premium-card overflow-hidden">
          {/* Ticket header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5240E8] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#1e2749] truncate">{selected.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-gray-400">{displayName(selected)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[10px] font-bold text-[#5240E8] uppercase tracking-wider">{selected.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${statusColor(selected.status)}`}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select value={selected.status}
                onChange={e => changeStatus(ticketId(selected), e.target.value as Ticket['status'])}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide outline-none focus:border-[#5240E8] transition-all">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {/* Original issue */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                {displayInitial(selected)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-sm text-[#1e2749]">{displayName(selected)}</span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" /> Original issue
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 text-sm text-gray-600 leading-relaxed">
                  {selected.description}
                </div>
              </div>
            </div>

            {/* Chat messages */}
            {selected.messages.map((msg, i) => {
              const isAgent = msg.sender === 'ADMIN';
              return (
                <div key={i} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isAgent ? 'bg-[#5240E8] text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {isAgent ? (msg.senderName?.[0]?.toUpperCase() ?? 'A') : displayInitial(selected)}
                  </div>
                  <div className={`max-w-[70%] ${isAgent ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1.5 ${isAgent ? 'justify-end' : ''}`}>
                      <span className="font-bold text-xs text-[#1e2749]">
                        {isAgent ? (msg.senderName ?? 'Agent') : displayName(selected)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${isAgent
                      ? 'bg-[#5240E8] text-white border-[#5240E8] rounded-tr-none'
                      : 'bg-white text-gray-700 border-gray-100 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply bar */}
          {selected.status !== 'CLOSED' ? (
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3 items-end bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-[#5240E8]/30 focus-within:bg-white transition-all p-3">
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder={`Reply as ${agentName}…`}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium resize-none max-h-28 py-1" />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-[#5240E8] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Press Enter to send · Shift+Enter for new line</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">This ticket is closed · Reopen it to reply</p>
              <button onClick={() => changeStatus(ticketId(selected), 'OPEN')}
                className="mt-2 text-xs text-[#5240E8] font-bold hover:underline">
                Reopen Ticket
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 premium-card flex flex-col items-center justify-center p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-2xl font-black text-[#1e2749] mb-3">Support Terminal</h2>
          <p className="max-w-sm text-gray-400 text-sm leading-relaxed">
            Select a ticket from the inbox to start a live chat. Messages are delivered in real-time to the user's app.
          </p>
          <div className={`mt-6 flex items-center gap-2 text-xs font-bold ${connected ? 'text-green-500' : 'text-gray-400'}`}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connected ? 'Connected — ready for live chat' : 'Connecting to live socket…'}
          </div>
        </div>
      )}
    </div>
  );
}
