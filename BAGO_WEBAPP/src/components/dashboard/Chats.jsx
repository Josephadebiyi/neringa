import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Send, AlertTriangle, User, Paperclip, MessageCircle, RefreshCw, Package, ArrowLeft, Trash2, FileText, ShieldAlert, WifiOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { io } from 'socket.io-client';

// ── Off-platform / contact-sharing detection ──────────────────────────────────
const OFF_PLATFORM_KEYWORDS = [
    'whatsapp', 'telegram', 'instagram', 'facebook', 'snapchat', 'tiktok',
    'wechat', 'signal', 'viber', 'line app', 'twitter', 'x.com',
    'gmail', 'yahoo', 'hotmail', 'outlook', 'icloud',
    'phone number', 'my number', 'call me', 'text me', 'dm me',
    'contact me', 'reach me', 'hit me up', 'message me',
    'outside bago', 'off platform', 'off app', 'off this app',
];
const OFF_PLATFORM_REGEX = [
    /\+?\d[\d\s\-().]{8,}\d/,                   // phone number pattern
    /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}\b/,      // US-style phone
    /@[a-z0-9_.]{2,}/i,                          // @handle
    /wa\.me\//i,                                  // WhatsApp link
    /t\.me\//i,                                   // Telegram link
    /bit\.ly|tinyurl|shorturl/i,                  // URL shorteners
    /https?:\/\//i,                               // any URL
    /www\.[a-z]/i,                                // www. link
];

// ── Abusive content detection ─────────────────────────────────────────────────
const ABUSE_KEYWORDS = [
    'idiot', 'stupid', 'moron', 'imbecile', 'dumb', 'fool',
    'bastard', 'asshole', 'bitch', 'cunt', 'dick', 'prick',
    'scammer', 'fraud', 'cheat', 'liar', 'thief',
    'kill you', 'hurt you', 'find you', 'beat you',
    'i will sue', 'report you', 'destroy you',
    'nigger', 'nigga', 'kike', 'spic', 'cracker', 'chink',
];

const classifyMessage = (text) => {
    const lower = text.toLowerCase();
    if (ABUSE_KEYWORDS.some(kw => lower.includes(kw))) return 'abuse';
    if (OFF_PLATFORM_KEYWORDS.some(kw => lower.includes(kw))) return 'offplatform';
    if (OFF_PLATFORM_REGEX.some(rx => rx.test(text))) return 'offplatform';
    return null;
};

export default function Chats({ user, selectedConv, setSelectedConv, onTabChange }) {
    const { t } = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [warningType, setWarningType] = useState(null); // null | 'abuse' | 'offplatform'
    const [isConnected, setIsConnected] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const socketRef = useRef(null);
    const selectedConvRef = useRef(null);
    const userIdRef = useRef(null);

    const getMessageId = (msg) => msg?._id || msg?.id || null;
    const getUserId = (value) => {
        if (!value) return '';
        if (typeof value === 'object') {
            return (value._id || value.id || value.userId || value.profileId || value.sub || '').toString();
        }
        return value.toString();
    };
    const getSenderId = (sender) => {
        if (!sender) return '';
        if (typeof sender === 'object') return (sender._id || sender.id || '').toString();
        return sender.toString();
    };
    const decorateConversation = (conversation, currentUserId = userIdRef.current) => {
        const conversationId = conversation?._id || conversation?.id;
        const senderId = getUserId(conversation?.sender);
        const travelerId = getUserId(conversation?.traveler);
        const role = senderId === currentUserId
            ? 'sender'
            : travelerId === currentUserId
                ? 'traveler'
                : conversation?.request?.role;
        const otherUser = role === 'sender' ? conversation?.traveler : conversation?.sender;
        const request = conversation?.request && typeof conversation.request === 'object'
            ? { ...conversation.request, role }
            : conversation?.request;

        return {
            ...conversation,
            _id: conversationId,
            id: conversationId,
            request,
            otherUser: otherUser || { firstName: 'User' },
            lastMessage: conversation?.last_message || conversation?.lastMessage || 'Click to chat',
        };
    };
    const getCurrentParticipantId = (conversation) => {
        const currentUserId = userIdRef.current || getUserId(user);
        const senderId = getUserId(conversation?.sender);
        const travelerId = getUserId(conversation?.traveler);
        const role = conversation?.request?.role;
        if (role === 'sender') return senderId;
        if (role === 'traveler') return travelerId;
        if (currentUserId === senderId || currentUserId === travelerId) return currentUserId;
        return currentUserId;
    };
    const normalizeMessage = (msg) => ({
        ...msg,
        _id: msg?._id || msg?.id,
        id: msg?.id || msg?._id,
        text: msg?.text || msg?.content || '',
        content: msg?.content || msg?.text || '',
        type: msg?.type || msg?.metadata?.type || 'text',
        fileUrl: msg?.fileUrl || msg?.metadata?.fileUrl || msg?.metadata?.imageUrl || '',
        fileName: msg?.fileName || msg?.metadata?.fileName || '',
        mimeType: msg?.mimeType || msg?.metadata?.mimeType || '',
        createdAt: msg?.createdAt || msg?.timestamp,
        timestamp: msg?.timestamp || msg?.createdAt,
    });
    const appendMessage = (incoming) => {
        const normalized = normalizeMessage(incoming);
        setMessages(prev => {
            const incomingId = getMessageId(normalized);
            if (incomingId && prev.some(msg => getMessageId(msg) === incomingId)) return prev;
            return [...prev, normalized];
        });
        setTimeout(scrollToBottom, 0);
    };

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    useEffect(() => {
        userIdRef.current = getUserId(user);
    }, [user]);

    useEffect(() => {
        selectedConvRef.current = selectedConv;
    }, [selectedConv]);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
            socketRef.current?.emit('join_conversation', selectedConv._id);
        }
    }, [selectedConv?._id]);

    useEffect(() => {
        if (!user) return;
        const socket = io(api.defaults.baseURL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        const rejoin = () => {
            if (userIdRef.current) socket.emit('join_user', userIdRef.current);
            if (selectedConvRef.current?._id) socket.emit('join_conversation', selectedConvRef.current._id);
        };

        socket.on('connect', () => { setIsConnected(true); rejoin(); });
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('reconnect', () => { setIsConnected(true); rejoin(); });

        socket.on('new_message', (message) => {
            const activeConversationId = selectedConvRef.current?._id;
            if (message?.conversationId?.toString() === activeConversationId?.toString()) {
                appendMessage(message);
            }
        });

        socket.on('update_conversation', (conversation) => {
            if (!conversation?._id && !conversation?.id) return;
            const conversationId = conversation._id || conversation.id;
            setConversations(prev => {
                const processed = decorateConversation(conversation);
                const next = prev.some(conv => conv._id === conversationId)
                    ? prev.map(conv => conv._id === conversationId ? { ...conv, ...processed } : conv)
                    : [processed, ...prev];
                return [...next].sort((a, b) => new Date(b.updated_at || b.updatedAt || 0) - new Date(a.updated_at || a.updatedAt || 0));
            });
            if (selectedConvRef.current?._id === conversationId) {
                setSelectedConv(prev => prev ? decorateConversation({ ...prev, ...conversation }) : prev);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/api/bago/conversations');
            const rawConversations = res.data?.data?.conversations || [];

            const processed = rawConversations.map(conv =>
                decorateConversation(conv, getUserId(user)),
            );

            setConversations(processed);

            // Sync selectedConv with the full object from the list
            if (selectedConv?._id) {
                const full = processed.find(c => c._id === selectedConv._id);
                if (full) setSelectedConv(full);
            }
        } catch (err) {
            console.error('Fetch conversations failed:', err);
            setConversations([]);
        }
    };

    const handleDownloadPDF = async (requestId, tracking) => {
        setDownloading(requestId);
        try {
            if (!requestId || requestId === 'undefined' || requestId === 'null') {
                throw new Error('Invalid request ID');
            }

            const response = await api.get(`/api/bago/request/${requestId}/pdf`, {
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Server failed to generate PDF');
            }

            if (!response.data || response.data.size === 0) {
                throw new Error('Received empty PDF file');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BAGO_Shipment_${tracking || 'Label'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {

            let errorMessage = 'Failed to download PDF. Please try again or contact support.';

            if (err.response?.status === 404) {
                errorMessage = 'Request not found. This shipment may have been deleted or the ID is invalid.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Session expired. Please log in again.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        } finally {
            setDownloading(null);
        }
    };

    const handleDeleteConversation = async (conv) => {
        if (conv.request?.status !== 'completed' && conv.request) {
            alert('Chats can only be deleted once the shipment is completed.');
            return;
        }

        if (!window.confirm('Are you sure you want to remove this chat from your inbox?')) return;

        try {
            await api.delete(`/api/bago/conversations/${conv._id}`);
            setConversations(conversations.filter(c => c._id !== conv._id));
            if (selectedConv?._id === conv._id) setSelectedConv(null);
        } catch (err) {
            alert('Failed to delete conversation');
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await api.get(`/api/bago/conversations/${convId}/messages`);
            // Backend returns { success: true, data: { messages: [] } }
            setMessages((res.data?.data?.messages || []).map(normalizeMessage));
            scrollToBottom();
        } catch (err) {
            setMessages([]);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5;
        
        if (diffInHours < 24 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48 && (date.getDate() === now.getDate() - 1 || now.getDate() === 1)) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    const handleRaiseDispute = async (e) => {
        e.preventDefault();
        if (!disputeReason.trim() || !selectedConv?.request) return;
        
        setIsSubmittingDispute(true);
        try {
            const requestId = typeof selectedConv.request === 'object' ? selectedConv.request._id : selectedConv.request;
            await api.post(`/api/bago/request/${requestId}/raise-dispute`, {
                reason: disputeReason,
                raisedBy: selectedConv.sender?._id === (user?._id || user?.id) ? 'sender' : 'traveler'
            });
            
            alert('Issue reported successfully. The Bago team has been notified.');
            setShowDisputeModal(false);
            setDisputeReason('');
        } catch (err) {
            console.error('Failed to raise dispute:', err);
            alert('Failed to report issue. Please try again.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        const violation = classifyMessage(newMessage);
        if (violation) {
            setWarningType(violation);
            return;
        }

        setIsSending(true);
        try {
            const res = await api.post(`/api/bago/conversations/${selectedConv._id}/send`, {
                text: newMessage
            });
            if (res.data?.success) {
                appendMessage(res.data.data);
                setNewMessage('');
                fetchConversations();
            }
        } catch (err) {
        } finally {
            setIsSending(false);
        }
    };

    const handleSendAttachment = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !selectedConv) return;

        const caption = newMessage.trim();
        if (caption) {
            const violation = classifyMessage(caption);
            if (violation) { setWarningType(violation); return; }
        }

        const formData = new FormData();
        formData.append(file.type?.startsWith('image/') ? 'image' : 'file', file);
        if (caption) formData.append('text', caption);

        setIsSending(true);
        try {
            const res = await api.post(
                `/api/bago/conversations/${selectedConv._id}/send`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            if (res.data?.success) {
                appendMessage(res.data.data);
                setNewMessage('');
                fetchConversations();
            }
        } catch (err) {
            alert('Failed to send attachment. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const req = selectedConv?.request && typeof selectedConv.request === 'object'
        ? selectedConv.request
        : null;

    const statusColor = (s) => {
        switch (s) {
            case 'completed': return 'bg-green-500/20 text-green-300';
            case 'intransit': return 'bg-blue-500/20 text-blue-300';
            case 'accepted': return 'bg-[#5845D8]/30 text-[#9B8EF5]';
            default: return 'bg-amber-500/20 text-amber-300';
        }
    };

    return (
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm font-sans text-[#012126]">

            {/* ── Col 1: Worklist / Conversations ── */}
            <div className={`flex-shrink-0 w-full md:w-[280px] border-r border-gray-100 flex flex-col bg-[#FAFAFA] ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-[#5845D8]" />
                        <h3 className="font-black text-[#012126] text-[11px] uppercase tracking-widest">Worklist</h3>
                    </div>
                    {conversations.length > 0 && (
                        <span className="px-2 py-0.5 bg-[#5845D8] text-white rounded-full text-[9px] font-black">
                            {conversations.length}
                        </span>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <MessageCircle size={20} className="text-gray-300" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                                {t('emptyInbox') || 'No conversations yet'}
                            </p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const isActive = selectedConv?._id === conv._id;
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full p-4 flex items-start gap-3 transition-all border-b border-gray-100/60 group text-left ${
                                        isActive ? 'bg-[#5845D8]/5 border-l-[3px] border-l-[#5845D8]' : 'hover:bg-white'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-2 transition-all ${
                                        isActive
                                            ? 'bg-[#5845D8] text-white border-[#5845D8]/30 shadow-md shadow-[#5845D8]/20'
                                            : 'bg-gray-100 text-gray-500 border-gray-100 group-hover:border-[#5845D8]/20'
                                    }`}>
                                        {conv.otherUser?.firstName?.charAt(0) || <User size={14} />}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className={`text-[11px] font-black truncate tracking-tight ${isActive ? 'text-[#5845D8]' : 'text-[#012126]'}`}>
                                                {conv.otherUser?.firstName || 'User'}
                                            </p>
                                            <p className="text-[8px] text-gray-300 font-medium whitespace-nowrap ml-1">
                                                {formatTime(conv.updated_at)}
                                            </p>
                                        </div>
                                        <p className="text-[9px] text-gray-400 truncate font-medium opacity-80">
                                            {conv.lastMessage || t('openChat') || 'Click to chat'}
                                        </p>
                                        {conv.request?.status && (
                                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                                conv.request.status === 'completed'
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'bg-[#5845D8]/10 text-[#5845D8]'
                                            }`}>
                                                {conv.request.status}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Col 2: Chat Window ── */}
            <div className={`flex-1 flex flex-col bg-white min-w-0 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
                {selectedConv ? (
                    <>
                        {/* Chat header */}
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConv(null)}
                                    className="md:hidden p-1.5 -ml-1.5 text-gray-400 hover:text-[#5845D8] transition-colors"
                                >
                                    <ArrowLeft size={19} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5845D8]/20">
                                    {selectedConv.otherUser?.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-[#012126] text-[12px] tracking-tight">
                                        {selectedConv.otherUser?.firstName || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {isConnected
                                            ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" /><p className="text-[8px] text-green-600 font-bold uppercase tracking-widest">Live</p></>
                                            : <><WifiOff size={10} className="text-amber-400" /><p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest">Reconnecting…</p></>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedConv.request?.status === 'completed' && (
                                    <button
                                        onClick={() => handleDeleteConversation(selectedConv)}
                                        className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                                        title="Delete conversation"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDisputeModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all font-bold text-[8px] uppercase tracking-widest"
                                >
                                    <AlertTriangle size={11} />
                                    {t('reportIssue') || 'Report'}
                                </button>
                            </div>
                        </div>

                        {/* Mobile shipment bar — visible on non-xl screens */}
                        {req && (
                            <div className="xl:hidden flex items-center gap-2.5 px-4 py-2 bg-[#012126] border-b border-white/5 flex-shrink-0">
                                <Package size={12} className="text-[#5845D8] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-[9px] font-black truncate">
                                        {req.package?.description || 'Package'} · #{req.trackingNumber || 'PENDING'}
                                    </p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex-shrink-0 ${statusColor(req.status)}`}>
                                    {req.status || 'pending'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onTabChange && onTabChange(req?.role === 'sender' ? 'shipments' : 'deliveries')}
                                    className="flex-shrink-0 bg-[#5845D8] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-[#4838B5] transition-all whitespace-nowrap"
                                >
                                    View
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 px-5 py-5 overflow-y-auto space-y-3 bg-[#F6F5FC]/40">
                            <div className="flex justify-center mb-4">
                                <span className="bg-white px-3 py-1 rounded-full text-[7px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                                    {t('encryptionActive') || '🔒 End-to-end encrypted'}
                                </span>
                            </div>

                            {messages.map((msg, i) => {
                                const senderId = getSenderId(msg.sender || msg.senderId || msg.sender_id);
                                const currentParticipantId = getCurrentParticipantId(selectedConv);
                                const isMe = senderId !== '' && senderId === currentParticipantId;
                                return (
                                    <div
                                        key={getMessageId(msg) || i}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                                    >
                                        <div className={`relative max-w-[78%] px-4 py-3 rounded-2xl text-[11px] font-medium shadow-sm ${
                                            isMe
                                                ? 'bg-[#5845D8] text-white rounded-tr-sm'
                                                : 'bg-white text-[#012126] border border-gray-100 rounded-tl-sm'
                                        }`}>
                                            {msg.fileUrl && (msg.type === 'image' || msg.mimeType?.startsWith('image/')) && (
                                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl mb-2">
                                                    <img src={msg.fileUrl} alt={msg.fileName || 'attachment'} className="max-h-64 w-full object-cover" />
                                                </a>
                                            )}
                                            {msg.fileUrl && msg.type !== 'image' && !msg.mimeType?.startsWith('image/') && (
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`mb-2 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ${
                                                        isMe ? 'border-white/20 bg-white/10' : 'border-gray-100 bg-gray-50'
                                                    }`}
                                                >
                                                    <FileText size={16} className="shrink-0" />
                                                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold">
                                                        {msg.fileName || 'Attachment'}
                                                    </span>
                                                </a>
                                            )}
                                            {msg.text && msg.text !== 'Image' && (
                                                <p className="leading-relaxed">{msg.text}</p>
                                            )}
                                            <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                                                <p className={`text-[7px] font-bold ${isMe ? 'text-white' : 'text-gray-400'}`}>
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                                {isMe && <span className="text-[10px] text-white">✓✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Warning banner */}
                        {warningType && (
                            <div className={`mx-5 mb-3 p-3.5 rounded-2xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-300 ${
                                warningType === 'abuse'
                                    ? 'bg-red-50 border border-red-200 text-red-800'
                                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                            }`}>
                                {warningType === 'abuse'
                                    ? <ShieldAlert size={15} className="shrink-0 text-red-500 mt-0.5" />
                                    : <AlertTriangle size={15} className="shrink-0 text-amber-500 mt-0.5" />
                                }
                                <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                                        {warningType === 'abuse' ? '⚠️ Abusive language detected' : '🚫 Off-platform contact sharing'}
                                    </p>
                                    <p className="text-[9px] font-medium leading-relaxed">
                                        {warningType === 'abuse'
                                            ? 'Abusive messages violate Bago\'s community guidelines and may result in your account being suspended.'
                                            : 'Sharing contact details, phone numbers, or external links is not permitted on Bago. All communication must stay in-app to protect both parties.'
                                        }
                                    </p>
                                </div>
                                <button onClick={() => setWarningType(null)} className="font-black text-[11px] opacity-50 hover:opacity-100 shrink-0">×</button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="px-5 pb-5 pt-2 bg-white border-t border-gray-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-50 rounded-[18px] border border-gray-100 px-3 py-2 focus-within:border-[#5845D8]/25 focus-within:bg-white focus-within:shadow-md transition-all">
                                <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleSendAttachment} />
                                <button
                                    type="button"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    disabled={isSending}
                                    className="p-1.5 text-gray-400 hover:text-[#5845D8] transition-colors disabled:opacity-40"
                                >
                                    <Paperclip size={17} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); if (warningType) setWarningType(null); }}
                                    placeholder={t('typeMessage') || 'Enter message...'}
                                    className="flex-1 bg-transparent outline-none text-[12px] text-[#012126] placeholder:text-gray-300 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="bg-[#5845D8] text-white p-2 rounded-xl hover:bg-[#4838B5] active:scale-95 transition-all shadow-md shadow-[#5845D8]/20 disabled:opacity-40"
                                >
                                    {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#F6F5FC]/30">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-gray-200/50 border border-gray-100">
                            <MessageCircle size={30} className="text-[#5845D8]/30" />
                        </div>
                        <h3 className="text-sm font-black text-[#012126] mb-2 uppercase tracking-wider">{t('selectConversation') || 'Select a conversation'}</h3>
                        <p className="text-[10px] text-gray-400 font-medium max-w-[220px] leading-relaxed">
                            {t('selectConversationDesc') || 'Pick a conversation from the worklist to start chatting'}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Col 3: Shipment Info Panel (CRM-style) ── */}
            {selectedConv && (
                <div className="hidden xl:flex flex-col w-[280px] flex-shrink-0 border-l border-gray-100 overflow-y-auto bg-[#FAFAFA]">
                    {req ? (
                        <>
                            {/* Shipment card – dark purple */}
                            <div className="m-4 bg-[#012126] rounded-[20px] p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[8px] text-white/40 font-black uppercase tracking-[2px]">
                                            Shipment #{req.trackingNumber || 'PENDING'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${statusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    {/* Package image / icon */}
                                    <div className="w-full h-16 bg-white/5 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-white/8">
                                        {(req.image || req.package?.image) ? (
                                            <img src={req.image || req.package?.image} className="w-full h-full object-cover" alt="Package" />
                                        ) : (
                                            <Package size={28} className="text-[#5845D8]/40" />
                                        )}
                                    </div>
                                    <p className="text-white font-black text-[13px] leading-snug mb-3 truncate">
                                        {req.package?.description || 'Package'}
                                    </p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Weight</span>
                                            <span className="text-[10px] text-white font-black">{req.package?.packageWeight || 0} kg</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Amount</span>
                                            <span className="text-[10px] text-white font-black">
                                                {req.currency} {req.amount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Role</span>
                                            <span className="text-[10px] text-white font-black capitalize">{req.role || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => onTabChange && onTabChange(req?.role === 'sender' ? 'shipments' : 'deliveries')}
                                            className="w-full bg-[#5845D8] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all"
                                        >
                                            View Full Shipment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadPDF(req?._id, req?.trackingNumber)}
                                            disabled={downloading === req?._id}
                                            className="w-full bg-white/8 border border-white/10 text-white/70 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/12 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {downloading === req._id
                                                ? <><RefreshCw size={12} className="animate-spin" /> Downloading…</>
                                                : <><FileText size={12} /> Download Label</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions card – light */}
                            <div className="mx-4 mb-4 bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Actions</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowDisputeModal(true)}
                                        className="w-full flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                    >
                                        <AlertTriangle size={13} />
                                        Report an Issue
                                    </button>
                                    {req.status === 'completed' && (
                                        <button
                                            onClick={() => handleDeleteConversation(selectedConv)}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                        >
                                            <Trash2 size={13} />
                                            Delete Chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="m-4 bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm text-center">
                            <div className="w-12 h-12 bg-[#5845D8]/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Package size={20} className="text-[#5845D8]/40" />
                            </div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">No shipment linked</p>
                        </div>
                    )}
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200 font-sans">
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        <div className="p-7 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/30">
                            <div className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-[#012126] uppercase tracking-tight">Report Issue</h3>
                                <p className="text-[9px] text-red-500 font-black mt-0.5 uppercase tracking-widest">Mediation Request</p>
                            </div>
                        </div>
                        <form onSubmit={handleRaiseDispute} className="p-7 space-y-5">
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed text-center">
                                Reporting an issue will pause the escrow and notify the Bago team for mediation.
                            </p>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Issue Details</label>
                                <textarea
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                    placeholder="Describe the problem in detail..."
                                    className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-medium min-h-[110px] focus:border-red-200 focus:bg-white transition-all text-[#012126] placeholder:text-gray-300"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDisputeModal(false)}
                                    className="flex-1 py-3.5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDispute}
                                    className="flex-[2] bg-[#012126] text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmittingDispute ? <RefreshCw className="animate-spin" size={14} /> : 'Raise Dispute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
