import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  CheckCircle,
  Search,
  Send,
  Shield,
  Loader2,
  MoreVertical,
  Flag,
  Wifi,
  WifiOff,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getTickets, updateTicketStatus, replyToTicket } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { API_ROOT } from "../config/api";

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
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  subject: string;
  description: string;
  category: "SHIPMENT" | "PAYMENT" | "ACCOUNT" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
}

function userName(t: Ticket) {
  if (t.user) return `${t.user.firstName} ${t.user.lastName}`;
  return `${t.userFirstName ?? ''} ${t.userLastName ?? ''}`.trim() || 'User';
}
function userInitial(t: Ticket) {
  if (t.user?.firstName) return t.user.firstName[0];
  return (t.userFirstName?.[0] ?? 'U');
}

export default function Support() {
  const { user } = useAuth();
  const agentName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agent' : 'Agent';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  selectedTicketRef.current = selectedTicket;

  // Socket.io connection
  useEffect(() => {
    const socketUrl = API_ROOT.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_support_agents');
    });
    socket.on('disconnect', () => setSocketConnected(false));

    // New ticket from a user
    socket.on('new_support_ticket', ({ ticket }: { ticket: Ticket; user: unknown }) => {
      setTickets(prev => {
        const exists = prev.some(t => t._id === ticket._id || t._id === ticket.id);
        if (exists) return prev;
        return [{ ...ticket, _id: ticket._id || ticket.id! }, ...prev];
      });
      setNewTicketIds(prev => new Set(prev).add(ticket._id || ticket.id!));
    });

    // Real-time message (from user or other agent)
    socket.on('support_message', ({ ticketId, message }: { ticketId: string; message: TicketMessage }) => {
      setTickets(prev => prev.map(t => {
        if (t._id !== ticketId) return t;
        const already = t.messages.some(m => m.timestamp === message.timestamp && m.content === message.content);
        return already ? t : { ...t, messages: [...t.messages, message] };
      }));

      if (selectedTicketRef.current?._id === ticketId) {
        setSelectedTicket(prev => {
          if (!prev) return prev;
          const already = prev.messages.some(m => m.timestamp === message.timestamp && m.content === message.content);
          return already ? prev : { ...prev, messages: [...prev.messages, message] };
        });
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // Join ticket room when selected
  useEffect(() => {
    if (selectedTicket) {
      socketRef.current?.emit('join_support_ticket', selectedTicket._id);
      socketRef.current?.emit('support_agent_joined', { ticketId: selectedTicket._id, agentName });
      setNewTicketIds(prev => { const s = new Set(prev); s.delete(selectedTicket._id); return s; });
    }
  }, [selectedTicket?._id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages.length]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      if (data.success) setTickets(data.data);
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    const content = reply.trim();
    setSending(true);
    setReply('');

    // Optimistic update
    const optimistic: TicketMessage = { sender: 'ADMIN', senderId: user?.id ?? '', senderName: agentName, content, timestamp: new Date().toISOString() };
    setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);

    // Emit via socket (agent sends via REST which then emits via socket)
    try {
      await replyToTicket(selectedTicket._id, content, agentName);
    } catch (e) {
      console.error('Failed to send reply:', e);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, status: Ticket['status']) => {
    try {
      await updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
      if (selectedTicket?._id === id) setSelectedTicket(prev => prev ? { ...prev, status } : null);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RESOLVED': return 'bg-green-50 text-green-600 border-green-100';
      case 'CLOSED': return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50';
      case 'LOW': return 'text-gray-500 bg-gray-50';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filter === 'ALL' || t.status === filter;
    const q = searchTerm.toLowerCase();
    const name = userName(t).toLowerCase();
    const matchesSearch = !q || t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || name.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-[450px] flex flex-col premium-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#1e2749]">Support Ops</h2>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold ${socketConnected ? 'text-green-500' : 'text-gray-400'}`}>
              {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {socketConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${filter === s ? 'border-[#5240E8] bg-[#5240E8] text-white' : 'border-white bg-white text-gray-400 hover:border-gray-100'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Query tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-[#5240E8] animate-spin" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading…</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-[#1e2749]">Queue Clear</p>
              <p className="text-xs text-gray-400 mt-1">No tickets match your filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full p-6 text-left hover:bg-gray-50 transition-all border-l-4 relative ${selectedTicket?._id === ticket._id ? 'border-l-[#5240E8] bg-gray-50/50' : 'border-l-transparent'}`}
              >
                {newTicketIds.has(ticket._id) && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-[#1e2749] text-sm mb-1 truncate">{ticket.subject}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                  {ticket.messages.length > 0
                    ? ticket.messages[ticket.messages.length - 1].content
                    : ticket.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 capitalize">
                    {userInitial(ticket)}
                  </div>
                  <span className="text-[10px] font-bold text-[#1e2749]">{userName(ticket)}</span>
                  <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black ${getPriorityColor(ticket.priority)}`}>
                    <Flag className="w-2.5 h-2.5" />
                    {ticket.priority}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col premium-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#5240E8]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1e2749] line-clamp-1">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-bold text-gray-400">from {userName(selectedTicket)}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-xs font-bold text-[#5240E8] uppercase tracking-widest">{selectedTicket.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTicket.status}
                onChange={(e) => updateStatus(selectedTicket._id, e.target.value as Ticket['status'])}
                className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider outline-none focus:border-[#5240E8] transition-all"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/10">
            {/* Initial description */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black flex-shrink-0">
                {userInitial(selectedTicket)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-[#1e2749]">{userName(selectedTicket)}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Original Message</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-600 leading-relaxed font-medium">
                  {selectedTicket.description}
                </div>
              </div>
            </div>

            {/* Messages */}
            {selectedTicket.messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.sender === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${msg.sender === 'ADMIN' ? 'bg-[#5240E8] text-white' : 'bg-blue-50 text-blue-600'}`}>
                  {msg.sender === 'ADMIN' ? (msg.senderName?.[0] ?? 'A') : userInitial(selectedTicket)}
                </div>
                <div className={`flex-1 ${msg.sender === 'ADMIN' ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-3 mb-2 ${msg.sender === 'ADMIN' ? 'justify-end' : ''}`}>
                    <span className="font-bold text-[#1e2749]">
                      {msg.sender === 'ADMIN' ? (msg.senderName ?? 'Agent') : userName(selectedTicket)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-4 rounded-[2rem] shadow-sm border text-sm leading-relaxed font-medium inline-block max-w-[80%] text-left ${msg.sender === 'ADMIN' ? 'bg-[#5240E8] text-white border-[#5240E8] rounded-tr-none' : 'bg-white text-gray-600 border-gray-100 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Reply input */}
          {selectedTicket.status !== 'CLOSED' && (
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="flex gap-4 items-end bg-gray-50 p-3 rounded-[2rem] border-2 border-transparent focus-within:border-[#5240E8]/20 focus-within:bg-white transition-all">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  placeholder={`Reply as ${agentName}…`}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-3 resize-none max-h-32"
                  rows={1}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  className="bg-[#5240E8] text-white p-3 rounded-2xl shadow-lg shadow-[#5240E8]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 premium-card flex flex-col items-center justify-center p-20 text-center">
          <div className="w-24 h-24 rounded-[3rem] bg-gray-50 flex items-center justify-center mb-8">
            <Shield className="w-12 h-12 text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-[#1e2749] mb-4">Support Terminal</h2>
          <p className="max-w-md text-gray-400 font-medium leading-relaxed">
            Select a ticket to start live chat. Messages appear in real-time on both the user's app and this dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
