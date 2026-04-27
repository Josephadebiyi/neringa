import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LifeBuoy, MessageCircle, Mail, Phone, Search, ChevronRight,
    ExternalLink, Shield, Zap, Globe, Clock, ArrowRight, X,
    Send, Ticket, ChevronDown, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://neringa.onrender.com';

// ─── Live Chat Widget ───────────────────────────────────────────────────────

function LiveChatWidget({ onClose, user }) {
    const [step, setStep] = useState('form'); // 'form' | 'chat'
    const [subject] = useState('Live Chat – Support Request');
    const [category, setCategory] = useState('OTHER');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [agentJoined, setAgentJoined] = useState(false);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

    const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollBottom(); }, [messages]);

    const connectSocket = useCallback((ticketId) => {
        const socket = io(API_BASE, { transports: ['websocket', 'polling'], withCredentials: true });
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('join_support_ticket', ticketId));
        socket.on('support_message', (data) => {
            if (data.ticketId === ticketId && data.message.sender !== 'USER') {
                setMessages(prev => [...prev, data.message]);
            }
        });
        socket.on('support_agent_joined', (data) => {
            if (data.ticketId === ticketId) setAgentJoined(true);
        });
    }, []);

    useEffect(() => {
        return () => { socketRef.current?.disconnect(); };
    }, []);

    const startChat = async () => {
        if (!description.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post('/api/bago/support/tickets', {
                subject, description, category, priority: 'HIGH'
            });
            const t = res.data.data || res.data.ticket || res.data;
            setTicket(t);
            setMessages(t.messages || []);
            connectSocket(t.id || t._id);
            setStep('chat');
        } catch (err) {
            console.error('Failed to start chat:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !ticket) return;
        const ticketId = ticket.id || ticket._id;
        const msg = {
            sender: 'USER',
            senderId: user?.id || user?._id || '',
            senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'You',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        setInput('');
        try {
            await api.post(`/api/bago/support/tickets/${ticketId}/message`, { content: msg.content });
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); step === 'chat' ? sendMessage() : startChat(); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] bg-white rounded-[28px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="bg-[#5240E8] px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">Live Support</p>
                        <p className="text-white/60 text-xs">
                            {step === 'chat' ? (agentJoined ? 'Agent joined' : 'Waiting for agent...') : 'Start a chat'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {step === 'form' ? (
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <p className="text-slate-500 text-sm">Tell us what you need help with and we'll connect you with a support agent.</p>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none"
                        >
                            <option value="SHIPMENT">Shipment Issue</option>
                            <option value="PAYMENT">Payment / Refund</option>
                            <option value="ACCOUNT">Account Help</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Describe your issue</label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="What can we help you with?"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none resize-none"
                        />
                    </div>
                    <button
                        onClick={startChat}
                        disabled={submitting || !description.trim()}
                        className="w-full bg-[#5240E8] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#4030C8] transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        {submitting ? 'Connecting...' : 'Start Live Chat'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p>Chat started. An agent will join shortly.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isUser = msg.sender === 'USER';
                            return (
                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-[#5240E8] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                                        {!isUser && msg.senderName && (
                                            <p className="text-xs font-bold text-[#5240E8] mb-1">{msg.senderName}</p>
                                        )}
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                    <div className="p-4 border-t border-slate-100 flex items-end gap-2 flex-shrink-0">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Type a message..."
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none resize-none"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            className="w-10 h-10 bg-[#5240E8] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#4030C8] transition-colors flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}

// ─── Submit Ticket Modal ────────────────────────────────────────────────────

function SubmitTicketModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ subject: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async () => {
        if (!form.subject.trim() || !form.description.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/bago/support/tickets', form);
            setDone(true);
            setTimeout(() => { onSuccess(); onClose(); }, 2000);
        } catch (err) {
            console.error('Ticket submit failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-[#5240E8] px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Ticket className="w-6 h-6 text-white" />
                        <h2 className="text-white font-black text-lg">Submit a Ticket</h2>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {done ? (
                    <div className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2">Ticket Submitted!</h3>
                        <p className="text-slate-500">We'll get back to you as soon as possible.</p>
                    </div>
                ) : (
                    <div className="p-8 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Subject *</label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                                placeholder="Brief summary of your issue"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none"
                                >
                                    <option value="SHIPMENT">Shipment</option>
                                    <option value="PAYMENT">Payment</option>
                                    <option value="ACCOUNT">Account</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description *</label>
                            <textarea
                                rows={5}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Please describe your issue in detail..."
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={submit}
                            disabled={submitting || !form.subject.trim() || !form.description.trim()}
                            className="w-full bg-[#5240E8] text-white py-4 rounded-xl font-black text-sm disabled:opacity-50 hover:bg-[#4030C8] transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {submitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ─── My Tickets Panel ───────────────────────────────────────────────────────

function MyTicketsPanel({ onClose, user }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTicket, setActiveTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        fetchTickets();
        return () => socketRef.current?.disconnect();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/support/tickets');
            setTickets(res.data.data || res.data.tickets || []);
        } catch (err) {
            console.error('Failed to load tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const openTicket = (t) => {
        socketRef.current?.disconnect();
        setActiveTicket(t);
        setMessages(t.messages || []);
        const tid = t.id || t._id;
        const socket = io(API_BASE, { transports: ['websocket', 'polling'], withCredentials: true });
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('join_support_ticket', tid));
        socket.on('support_message', (data) => {
            if (data.ticketId === tid && data.message.sender !== 'USER') {
                setMessages(prev => [...prev, data.message]);
            }
        });
    };

    const sendMessage = async () => {
        if (!input.trim() || !activeTicket) return;
        const tid = activeTicket.id || activeTicket._id;
        const msg = {
            sender: 'USER',
            senderId: user?.id || user?._id || '',
            senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'You',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        setInput('');
        setSending(true);
        try {
            await api.post(`/api/bago/support/tickets/${tid}/message`, { content: msg.content });
        } catch (err) {
            console.error('Send failed:', err);
        } finally {
            setSending(false);
        }
    };

    const statusColor = (s) => ({
        OPEN: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
        RESOLVED: 'bg-green-100 text-green-700',
        CLOSED: 'bg-slate-100 text-slate-500',
    }[s] || 'bg-slate-100 text-slate-500');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[28px] w-full max-w-2xl h-[80vh] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#5240E8] px-8 py-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {activeTicket && (
                            <button onClick={() => setActiveTicket(null)} className="text-white/70 hover:text-white mr-1">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <Ticket className="w-5 h-5 text-white" />
                        <h2 className="text-white font-black">{activeTicket ? activeTicket.subject : 'My Tickets'}</h2>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {!activeTicket ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400">
                                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
                                <p>Loading tickets...</p>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No tickets yet</p>
                                <p className="text-sm mt-1">Submit a ticket or start a live chat to get help.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((t) => (
                                    <button
                                        key={t.id || t._id}
                                        onClick={() => openTicket(t)}
                                        className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-2xl p-5 transition-colors border border-transparent hover:border-[#5240E8]/20"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 truncate">{t.subject}</p>
                                                <p className="text-slate-500 text-sm mt-0.5 truncate">{t.description}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor(t.status)}`}>
                                                {t.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs text-slate-400">{t.category}</span>
                                            <span className="text-slate-300">·</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(t.createdAt || t.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-slate-300">·</span>
                                            <span className="text-xs text-slate-400">{(t.messages || []).length} messages</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    <p>No messages yet. An agent will respond soon.</p>
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const isUser = msg.sender === 'USER';
                                return (
                                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-[#5240E8] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                                            {!isUser && msg.senderName && (
                                                <p className="text-xs font-bold text-[#5240E8] mb-1">{msg.senderName}</p>
                                            )}
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>
                        {(activeTicket.status === 'OPEN' || activeTicket.status === 'IN_PROGRESS') && (
                            <div className="p-4 border-t border-slate-100 flex items-end gap-2 flex-shrink-0">
                                <textarea
                                    rows={1}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#5240E8] focus:border-transparent outline-none resize-none"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || sending}
                                    className="w-10 h-10 bg-[#5240E8] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#4030C8] transition-colors flex-shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {(activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED') && (
                            <div className="p-4 border-t border-slate-100 text-center text-sm text-slate-400 flex-shrink-0">
                                This ticket is {activeTicket.status.toLowerCase()}. <a href="#" className="text-[#5240E8] font-bold" onClick={e => { e.preventDefault(); }}>Open a new ticket</a> for further help.
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}

// ─── Main Support Page ──────────────────────────────────────────────────────

const Support = () => {
    const { user, isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaq, setActiveFaq] = useState(null);
    const [showLiveChat, setShowLiveChat] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showMyTickets, setShowMyTickets] = useState(false);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

    const faqs = [
        { question: "How does Bago work?", answer: "Bago connects people who need to send items with trust-verified travelers who have extra luggage space. This peer-to-peer approach makes shipping faster and up to 70% cheaper than traditional couriers." },
        { question: "Is my package insured?", answer: "Yes! Bago offers optional insurance for all packages. You can select your insurance level during the request phase to protect against loss or damage." },
        { question: "How do I become a traveler?", answer: "Simply click 'Post a Trip', verify your ID through our secure KYC process, and list your travel details. Once approved, you can start accepting package requests and earning money." },
        { question: "What items are prohibited?", answer: "For safety reasons, we prohibit illegal substances, hazardous materials, weapons, and items restricted by international aviation laws. See our full restricted items list for more details." },
    ];

    const categories = [
        { title: "Getting Started", icon: <Zap className="w-6 h-6" />, count: 12 },
        { title: "Shipping & Delivery", icon: <Globe className="w-6 h-6" />, count: 24 },
        { title: "Payments & Refunds", icon: <Clock className="w-6 h-6" />, count: 8 },
        { title: "Safety & Security", icon: <Shield className="w-6 h-6" />, count: 15 },
    ];

    const handleChatClick = () => {
        if (!isAuthenticated) { alert('Please log in to start a live chat.'); return; }
        setShowLiveChat(true);
    };
    const handleTicketClick = () => {
        if (!isAuthenticated) { alert('Please log in to submit a ticket.'); return; }
        setShowTicketModal(true);
    };
    const handleMyTicketsClick = () => {
        if (!isAuthenticated) { alert('Please log in to view your tickets.'); return; }
        setShowMyTickets(true);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-[#5240E8] overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-bold mb-8">
                        <LifeBuoy className="w-4 h-4" /> 24/7 SUPPORT CENTER
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
                        How can we <br /><span className="text-white/60 italic">help you today?</span>
                    </motion.h1>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-0 bg-black/20 blur-2xl group-focus-within:bg-[#5240E8]/40 transition-all rounded-[30px]" />
                        <div className="relative flex items-center bg-white rounded-[30px] p-2 shadow-2xl border border-white/20">
                            <Search className="w-6 h-6 text-slate-400 ml-6" />
                            <input type="text" placeholder="Search for articles, guides, or questions..."
                                className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-4 text-slate-800 font-medium placeholder:text-slate-400"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            <button className="bg-[#5240E8] text-white px-8 py-4 rounded-[22px] font-bold hover:bg-[#4030C8] transition-all flex items-center gap-2">
                                Search <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main content */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: FAQ + Categories */}
                    <div className="lg:col-span-2 space-y-16">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.map((cat, i) => (
                                <motion.div key={i} whileHover={{ y: -5 }}
                                    className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#5240E8]/30 transition-all cursor-pointer group">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8] group-hover:bg-[#5240E8] group-hover:text-white transition-colors mb-6">
                                        {cat.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2">{cat.title}</h3>
                                    <p className="text-slate-400 text-sm font-medium">{cat.count} articles</p>
                                </motion.div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Popular Questions</h2>
                                <button className="text-[#5240E8] font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                    View all <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <motion.div key={i} className="bg-white rounded-[30px] border border-slate-200 overflow-hidden">
                                        <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-8 text-left hover:bg-slate-50 transition-colors">
                                            <span className="text-lg font-bold text-slate-800">{faq.question}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeFaq === i ? 'bg-[#5240E8] text-white rotate-90' : 'bg-slate-100 text-slate-400'}`}>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {activeFaq === i && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                                                    <div className="pt-4 border-t border-slate-100 text-slate-600 leading-relaxed font-medium">{faq.answer}</div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact cards */}
                    <div className="space-y-6">
                        {/* Live Chat card */}
                        <div className="bg-[#5240E8] p-10 rounded-[40px] text-white relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <MessageCircle className="w-12 h-12 mb-8 text-white/50" />
                            <h3 className="text-3xl font-black mb-4">Live Chat</h3>
                            <p className="text-white/70 font-medium mb-8 leading-relaxed">
                                Connect with our support team instantly for real-time assistance.
                            </p>
                            <button onClick={handleChatClick}
                                className="w-full bg-white text-[#5240E8] py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                                Start Live Chat
                            </button>
                        </div>

                        {/* Submit Ticket card */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                            <Ticket className="w-10 h-10 text-[#5240E8] mb-6" />
                            <h3 className="text-xl font-black text-slate-800 mb-3">Submit a Ticket</h3>
                            <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
                                Not urgent? Submit a detailed ticket and we'll respond within 24 hours.
                            </p>
                            <button onClick={handleTicketClick}
                                className="w-full bg-slate-100 text-slate-800 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#5240E8] hover:text-white transition-all">
                                Submit Ticket
                            </button>
                        </div>

                        {/* My Tickets card */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8]">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">My Tickets</h4>
                                    <p className="text-slate-400 text-xs font-medium">View & continue conversations</p>
                                </div>
                            </div>
                            <button onClick={handleMyTicketsClick}
                                className="w-full border-2 border-[#5240E8] text-[#5240E8] py-3 rounded-2xl font-black text-sm hover:bg-[#5240E8] hover:text-white transition-all">
                                View My Tickets
                            </button>
                        </div>

                        {/* Email & Phone */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8]">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Email Support</h4>
                                    <p className="text-slate-400 text-sm font-medium">support@sendwithbago.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8]">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Call Us</h4>
                                    <p className="text-slate-400 text-sm font-medium">+1 (555) 000-0000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-white border-t border-slate-100 text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-[#5240E8]">
                        <Search className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 mb-6">Didn't find what you need?</h2>
                    <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
                        Our global support team is available 24/7. Whether you're tracking a package or need help with your account, we're here.
                    </p>
                    {ticketSubmitted && (
                        <div className="mb-6 bg-green-50 text-green-700 font-bold py-3 px-6 rounded-2xl inline-flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Ticket submitted! We'll be in touch soon.
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={handleTicketClick}
                            className="bg-[#5240E8] text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#5240E8]/30">
                            Submit Ticket
                        </button>
                        <button onClick={handleMyTicketsClick}
                            className="bg-slate-100 text-slate-800 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                            My Tickets
                        </button>
                    </div>
                </div>
            </section>

            {/* Overlays */}
            <AnimatePresence>
                {showLiveChat && <LiveChatWidget onClose={() => setShowLiveChat(false)} user={user} />}
                {showTicketModal && (
                    <SubmitTicketModal
                        onClose={() => setShowTicketModal(false)}
                        onSuccess={() => setTicketSubmitted(true)}
                    />
                )}
                {showMyTickets && <MyTicketsPanel onClose={() => setShowMyTickets(false)} user={user} />}
            </AnimatePresence>
        </div>
    );
};

export default Support;
