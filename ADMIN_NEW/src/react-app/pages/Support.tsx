import { useEffect, useState } from "react";
import {
  MessageSquare,
  CheckCircle,
  Search,
  Paperclip,
  Send,
  Shield,
  Loader2,
  MoreVertical,
  Flag
} from "lucide-react";
import { getTickets, getTicketById, updateTicketStatus, replyToTicket } from "../services/api";

interface TicketMessage {
  sender: 'USER' | 'ADMIN';
  senderId: string;
  content: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  subject: string;
  description: string;
  category: "SHIPMENT" | "PAYMENT" | "ACCOUNT" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: {
    fullName: string;
  };
  messages: TicketMessage[];
  createdAt: string;
}



export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const data = await replyToTicket(selectedTicket._id, reply);
      if (data.success) {
        setReply("");
        // Refresh ticket details
        const ticketData = await getTicketById(selectedTicket._id);
        if (ticketData.success) {
          setSelectedTicket(ticketData.data);
          // Update tickets list
          setTickets(prev => prev.map(t => t._id === ticketData.data._id ? ticketData.data : t));
        }
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, status: Ticket['status']) => {
    try {
      const data = await updateTicketStatus(id, status);
      if (data.success) {
        fetchTickets();
        if (selectedTicket?._id === id) {
          setSelectedTicket(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
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

  const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-[450px] flex flex-col premium-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-black text-[#1e2749] mb-4">Support Ops</h2>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${filter === s
                  ? 'border-[#5240E8] bg-[#5240E8] text-white'
                  : 'border-white bg-white text-gray-400 hover:border-gray-100'
                  }`}
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
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-[#5240E8] animate-spin" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hydrating Inbox...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-[#1e2749]">Queue Clear</p>
              <p className="text-xs text-gray-400 mt-1">No tickets match your current filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full p-6 text-left hover:bg-gray-50 transition-all border-l-4 ${selectedTicket?._id === ticket._id ? 'border-l-[#5240E8] bg-gray-50/50' : 'border-l-transparent'
                  }`}
              >
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
                  {ticket.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 capitalize">
                    {ticket.user.firstName[0]}
                  </div>
                  <span className="text-[10px] font-bold text-[#1e2749]">{ticket.user.firstName} {ticket.user.lastName}</span>
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

      {/* Detail Area */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col premium-card overflow-hidden">
          {/* Ticket Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#5240E8]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1e2749] line-clamp-1">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-bold text-gray-400">ID: {selectedTicket._id.substring(0, 10)}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                  <span className="text-xs font-bold text-[#5240E8] uppercase tracking-widest">{selectedTicket.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTicket.status}
                onChange={(e) => updateStatus(selectedTicket._id, e.target.value as any)}
                className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider outline-none focus:border-[#5240E8] transition-all"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">Resolving</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Archived</option>
              </select>
              <button className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Flow */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/10">
            {/* Initial description */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black flex-shrink-0">
                {selectedTicket.user.firstName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-[#1e2749]">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Context</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-600 leading-relaxed font-medium">
                  {selectedTicket.description}
                </div>
              </div>
            </div>

            {/* Messages */}
            {selectedTicket.messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.sender === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${msg.sender === 'ADMIN' ? 'bg-[#5240E8] text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {msg.sender === 'ADMIN' ? 'A' : selectedTicket.user.firstName[0]}
                </div>
                <div className={`flex-1 ${msg.sender === 'ADMIN' ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-3 mb-2 ${msg.sender === 'ADMIN' ? 'justify-end' : ''}`}>
                    <span className="font-bold text-[#1e2749]">
                      {msg.sender === 'ADMIN' ? 'Resolution Team' : `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}`}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-5 rounded-[2rem] shadow-sm border text-sm leading-relaxed font-medium inline-block max-w-[80%] text-left ${msg.sender === 'ADMIN'
                    ? 'bg-[#5240E8] text-white border-[#5240E8] rounded-tr-none'
                    : 'bg-white text-gray-600 border-gray-100 rounded-tl-none'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Area */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex gap-4 items-end bg-gray-50 p-3 rounded-[2rem] border-2 border-transparent focus-within:border-[#5240E8]/20 focus-within:bg-white transition-all">
              <button className="p-3 text-gray-400 hover:text-[#5240E8] transition-all bg-white rounded-2xl shadow-sm">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Compose secure response..."
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
        </div>
      ) : (
        <div className="flex-1 premium-card flex flex-col items-center justify-center p-20 text-center">
          <div className="w-24 h-24 rounded-[3rem] bg-gray-50 flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
            <Shield className="w-12 h-12 text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-[#1e2749] mb-4">Secure Terminal Ready</h2>
          <p className="max-w-md text-gray-400 font-medium leading-relaxed">
            Select a ticket from the operational queue to initiate triage or finalize resolution protocols.
          </p>
        </div>
      )}
    </div>
  );
}
