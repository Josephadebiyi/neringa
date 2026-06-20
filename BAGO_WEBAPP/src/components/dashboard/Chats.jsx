import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
    Send, AlertTriangle, User, Paperclip, MessageCircle, RefreshCw,
    Package, ArrowLeft, Trash2, FileText, ShieldAlert, WifiOff,
    Plus, Weight, ChevronLeft, ChevronRight, MapPin, CheckCircle,
} from 'lucide-react';
import { io } from 'socket.io-client';

// ── Content filters ───────────────────────────────────────────────────────────
const OFF_PLATFORM_KEYWORDS = [
    'whatsapp','telegram','instagram','facebook','snapchat','tiktok',
    'wechat','signal','viber','line app','twitter','x.com',
    'gmail','yahoo','hotmail','outlook','icloud',
    'phone number','my number','call me','text me','dm me',
    'contact me','reach me','hit me up','message me',
    'outside bago','off platform','off app','off this app',
];
const OFF_PLATFORM_REGEX = [
    /\+?\d[\d\s\-().]{8,}\d/,
    /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}\b/,
    /@[a-z0-9_.]{2,}/i,
    /wa\.me\//i,
    /t\.me\//i,
    /bit\.ly|tinyurl|shorturl/i,
    /https?:\/\//i,
    /www\.[a-z]/i,
];
const ABUSE_KEYWORDS = [
    'idiot','stupid','moron','imbecile','dumb','fool',
    'bastard','asshole','bitch','cunt','dick','prick',
    'scammer','fraud','cheat','liar','thief',
    'kill you','hurt you','find you','beat you',
    'i will sue','report you','destroy you',
    'nigger','nigga','kike','spic','cracker','chink',
];

const classifyMessage = (text) => {
    const lower = text.toLowerCase();
    if (ABUSE_KEYWORDS.some(kw => lower.includes(kw))) return 'abuse';
    if (OFF_PLATFORM_KEYWORDS.some(kw => lower.includes(kw))) return 'offplatform';
    if (OFF_PLATFORM_REGEX.some(rx => rx.test(text))) return 'offplatform';
    return null;
};

// ── Status helpers ────────────────────────────────────────────────────────────
const CHAT_STATUS_LABEL = {
    draft:       'Payment not completed',
    pending:     'Awaiting Acceptance',
    accepted:    'Active',
    intransit:   'In Transit',
    'in-transit':'In Transit',
    delivering:  'Delivered',
    completed:   'Completed',
    rejected:    'Rejected',
    cancelled:   'Cancelled',
    canceled:    'Cancelled',
    disputed:    'Disputed',
};
const chatStatusLabel = (s) => CHAT_STATUS_LABEL[(s || '').toLowerCase()] || 'Processing';

const chatStatusColor = (s) => {
    switch ((s || '').toLowerCase()) {
        case 'completed':  return 'bg-green-500/20 text-green-700';
        case 'intransit':
        case 'in-transit': return 'bg-blue-500/20 text-blue-700';
        case 'accepted':   return 'bg-[#5845D8]/20 text-[#5845D8]';
        case 'delivering': return 'bg-amber-500/20 text-amber-700';
        case 'rejected':
        case 'cancelled':  return 'bg-red-500/20 text-red-700';
        default:           return 'bg-gray-200/60 text-gray-500';
    }
};

const asArray = (v) => Array.isArray(v) ? v : [];

export default function Chats({ user, selectedConv, setSelectedConv, onTabChange }) {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [warningType, setWarningType] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [showAddKgModal, setShowAddKgModal] = useState(false);
    const [addKgInput, setAddKgInput] = useState('');
    const [addKgLoading, setAddKgLoading] = useState(false);
    // Multi-shipment support: map conversationId → requests[]
    const [shipmentsByConvId, setShipmentsByConvId] = useState({});
    // Index of the currently viewed shipment card in the side panel
    const [activeShipmentIdx, setActiveShipmentIdx] = useState(0);

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

    const decorateConversation = (conv, currentUserId = userIdRef.current) => {
        const conversationId = conv?._id || conv?.id;
        const senderId   = getUserId(conv?.sender);
        const travelerId = getUserId(conv?.traveler);
        const role = senderId === currentUserId
            ? 'sender'
            : travelerId === currentUserId
                ? 'traveler'
                : conv?.request?.role;
        const otherUser = role === 'sender' ? conv?.traveler : conv?.sender;
        const request = conv?.request && typeof conv.request === 'object'
            ? { ...conv.request, role }
            : conv?.request;
        return {
            ...conv,
            _id: conversationId,
            id: conversationId,
            request,
            otherUser: otherUser || { firstName: 'User' },
            lastMessage: conv?.last_message || conv?.lastMessage || 'Click to chat',
        };
    };

    const getCurrentParticipantId = (conv) => {
        const currentUserId = userIdRef.current || getUserId(user);
        const senderId   = getUserId(conv?.sender);
        const travelerId = getUserId(conv?.traveler);
        const role = conv?.request?.role;
        if (role === 'sender') return senderId;
        if (role === 'traveler') return travelerId;
        if (currentUserId === senderId || currentUserId === travelerId) return currentUserId;
        return currentUserId;
    };

    const normalizeMessage = (msg) => ({
        ...msg,
        _id: msg?._id || msg?.id,
        id:  msg?.id  || msg?._id,
        text: msg?.text || msg?.content || '',
        content: msg?.content || msg?.text || '',
        type: msg?.type || msg?.metadata?.type || 'text',
        fileUrl:  msg?.fileUrl  || msg?.metadata?.fileUrl  || msg?.metadata?.imageUrl || '',
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
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    // ── Fetching ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (user) {
            userIdRef.current = getUserId(user);
            fetchConversations();
            fetchAllShipments();
        }
    }, [user]);

    useEffect(() => {
        userIdRef.current = getUserId(user);
    }, [user]);

    useEffect(() => {
        selectedConvRef.current = selectedConv;
        if (selectedConv) setActiveShipmentIdx(0);
    }, [selectedConv?._id]);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
            socketRef.current?.emit('join_conversation', selectedConv._id);
        }
    }, [selectedConv?._id]);

    const fetchConversations = async () => {
        try {
            const currentUserId = getUserId(user);

            // Fetch all three sources in parallel
            const [convRes, senderRes, travelerRes] = await Promise.all([
                api.get('/api/bago/conversations').catch(() => ({ data: {} })),
                api.get('/api/bago/recentOrder').catch(() => ({ data: {} })),
                api.get('/api/bago/incoming-requests').catch(() => ({ data: {} })),
            ]);

            // Primary: from the dedicated conversations endpoint
            const d   = convRes.data;
            const raw = d?.data?.conversations
                || (Array.isArray(d?.data) ? d.data : null)
                || d?.conversations
                || (Array.isArray(d) ? d : null)
                || [];

            const convMap = {};
            asArray(raw).forEach(c => {
                const dec = decorateConversation(c, currentUserId);
                if (dec._id) convMap[dec._id] = dec;
            });

            // Fallback: build conversations from shipment data
            // This covers cases where the dedicated endpoint returns nothing
            const senderReqs   = asArray(senderRes.data?.data || []);
            const travelerReqs = asArray(travelerRes.data?.data || travelerRes.data?.requests || []);
            const allReqs = [...senderReqs, ...travelerReqs];

            // Build shipments-by-convId map while we're iterating
            const byConvId = {};
            allReqs.forEach(req => {
                const convId = req.conversationId || req.conversation_id;
                if (!convId) return;
                if (!byConvId[convId]) byConvId[convId] = [];
                const id = req._id || req.id;
                if (!byConvId[convId].some(r => (r._id || r.id) === id)) {
                    byConvId[convId].push(req);
                }
                // If this conversation wasn't in the primary fetch, synthesize it
                if (!convMap[convId]) {
                    const isTraveler = req.role === 'traveler'
                        || String(req.travelerId || '') === currentUserId
                        || String(req.traveler_id || '') === currentUserId;
                    const otherPerson = isTraveler
                        ? (req.sender   || { _id: req.senderId,   firstName: req.senderName   || 'Sender' })
                        : (req.traveler || { _id: req.travelerId, firstName: req.travelerName || 'Traveler' });
                    convMap[convId] = {
                        _id: convId, id: convId,
                        request: { ...req, role: req.role || (isTraveler ? 'traveler' : 'sender') },
                        activeRequests: [],
                        otherUser: {
                            _id: otherPerson._id || otherPerson.id || '',
                            id:  otherPerson._id || otherPerson.id || '',
                            firstName: otherPerson.firstName || otherPerson.first_name || 'User',
                        },
                        lastMessage: 'Click to view messages',
                        last_message: 'Click to view messages',
                        updated_at: req.updatedAt || req.createdAt || req.created_at || new Date().toISOString(),
                        updatedAt:  req.updatedAt || req.createdAt || req.created_at || new Date().toISOString(),
                        sender:  isTraveler ? otherPerson : { _id: currentUserId, id: currentUserId },
                        traveler: isTraveler ? { _id: currentUserId, id: currentUserId } : otherPerson,
                    };
                }
            });

            setShipmentsByConvId(byConvId);

            const processed = Object.values(convMap).sort(
                (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0),
            );
            setConversations(processed);

            if (selectedConv?._id) {
                const full = processed.find(c => c._id === selectedConv._id);
                if (full) setSelectedConv(full);
            }
        } catch {
            setConversations([]);
        }
    };

    // fetchAllShipments is now handled inside fetchConversations
    const fetchAllShipments = async () => {};

    // ── Socket ─────────────────────────────────────────────────────────────────

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

        socket.on('connect',    () => { setIsConnected(true); rejoin(); });
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('reconnect',  () => { setIsConnected(true); rejoin(); });

        socket.on('new_message', (message) => {
            if (message?.conversationId?.toString() === selectedConvRef.current?._id?.toString()) {
                appendMessage(message);
            }
        });

        socket.on('update_conversation', (conversation) => {
            if (!conversation?._id && !conversation?.id) return;
            const conversationId = conversation._id || conversation.id;
            setConversations(prev => {
                const processed = decorateConversation(conversation);
                const next = prev.some(c => c._id === conversationId)
                    ? prev.map(c => c._id === conversationId ? { ...c, ...processed } : c)
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

    // ── Helpers ────────────────────────────────────────────────────────────────

    const fetchMessages = async (convId) => {
        try {
            const res = await api.get(`/api/bago/conversations/${convId}/messages`);
            setMessages(asArray(res.data?.data?.messages || res.data?.messages || []).map(normalizeMessage));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch {
            setMessages([]);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now  = new Date();
        const diffH = Math.abs(now - date) / 36e5;
        if (diffH < 24 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diffH < 48) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleDeleteConversation = async (conv) => {
        if (conv.request?.status !== 'completed' && conv.request) {
            alert('Chats can only be deleted once the shipment is completed.');
            return;
        }
        if (!window.confirm('Remove this chat from your inbox?')) return;
        try {
            await api.delete(`/api/bago/conversations/${conv._id}`);
            setConversations(prev => prev.filter(c => c._id !== conv._id));
            if (selectedConv?._id === conv._id) setSelectedConv(null);
        } catch {
            alert('Failed to delete conversation. Please try again.');
        }
    };

    const handleRaiseDispute = async (e) => {
        e.preventDefault();
        if (!disputeReason.trim() || !selectedConv?.request) return;
        setIsSubmittingDispute(true);
        try {
            const requestId = typeof selectedConv.request === 'object'
                ? selectedConv.request._id
                : selectedConv.request;
            await api.post(`/api/bago/request/${requestId}/raise-dispute`, {
                reason: disputeReason,
                raisedBy: selectedConv.sender?._id === (user?._id || user?.id) ? 'sender' : 'traveler',
            });
            alert('Issue reported. The Bago team will review and contact you shortly.');
            setShowDisputeModal(false);
            setDisputeReason('');
        } catch {
            alert('Failed to report issue. Please try again.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;
        const violation = classifyMessage(newMessage);
        if (violation) { setWarningType(violation); return; }
        setIsSending(true);
        try {
            const res = await api.post(`/api/bago/conversations/${selectedConv._id}/send`, { text: newMessage });
            if (res.data?.success) {
                appendMessage(res.data.data);
                setNewMessage('');
                fetchConversations();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send message. Please try again.');
        }
        finally { setIsSending(false); }
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
        } catch {
            alert('Failed to send attachment. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadPDF = async (requestId, tracking) => {
        if (!requestId || requestId === 'undefined') return;
        setDownloading(requestId);
        try {
            const response = await api.get(`/api/bago/request/${requestId}/pdf`, { responseType: 'blob' });
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                throw new Error(JSON.parse(text)?.message || 'Server failed to generate PDF');
            }
            if (!response.data || response.data.size === 0) throw new Error('Received empty PDF file');
            const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BAGO_Shipment_${tracking || 'Label'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to download PDF. Please try again.');
        } finally {
            setDownloading(null);
        }
    };

    const handleAddKg = async () => {
        const kg = parseFloat(addKgInput);
        if (!kg || kg <= 0) return;
        // Use the currently active shipment card if available
        const convShipments = getConvShipments();
        const activeReq = convShipments[activeShipmentIdx] || selectedConv?.request;
        const reqObj = activeReq && typeof activeReq === 'object' ? activeReq : null;
        const reqId = reqObj?._id || reqObj?.id;
        if (!reqId) return;
        setAddKgLoading(true);
        try {
            const res = await api.get(`/api/bago/request/${reqId}/details`);
            const details = res.data?.data;
            const amount  = Number(details?.amount || 0);
            const weight  = Number(details?.package?.packageWeight || 1);
            const currency = (details?.currency || 'USD').toUpperCase();
            const pricePerKg = weight > 0 ? amount / weight : 0;
            const estimatedAmount = parseFloat((pricePerKg * kg).toFixed(2));
            setShowAddKgModal(false);
            setAddKgInput('');
            navigate(`/checkout/payment?requestId=${reqId}&additionalKg=${kg}&amount=${estimatedAmount}&currency=${currency}`);
        } catch {
            alert('Could not load shipment details. Please try again.');
        } finally {
            setAddKgLoading(false);
        }
    };

    // ── Derived ────────────────────────────────────────────────────────────────

    const getConvShipments = () => {
        if (!selectedConv) return [];
        // Backend provides activeRequests directly on the conversation object
        const fromConv = selectedConv.activeRequests || [];
        if (fromConv.length > 0) {
            // Enrich with role from the conversation context
            const convRole = selectedConv.request?.role;
            return fromConv.map(r => ({ ...r, role: r.role || convRole }));
        }
        // Fallback: requests fetched separately
        const fromMap = shipmentsByConvId[selectedConv._id] || [];
        if (fromMap.length > 0) return fromMap;
        // Last resort: single request on the conv
        const r = selectedConv?.request;
        return r ? [r] : [];
    };

    const req = selectedConv?.request && typeof selectedConv.request === 'object'
        ? selectedConv.request
        : null;

    // Show Add KG if ANY active shipment in this conversation is sender+accepted/intransit
    const convShipments = getConvShipments();
    const CLOSED_STATUSES = ['completed', 'cancelled', 'canceled', 'rejected'];
    const isChatClosed = convShipments.length > 0
        && convShipments.every(r => CLOSED_STATUSES.includes((r?.status || '').toLowerCase()));
    const hasAddKgShipment = convShipments.some(r => {
        const role   = r?.role || (r?.senderId === (user?._id || user?.id) ? 'sender' : 'traveler');
        const status = (r?.status || '').toLowerCase();
        return role === 'sender' && ['accepted', 'intransit'].includes(status);
    });

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm font-sans text-[#111827]">

            {/* ── Col 1: Conversation list ── */}
            <div className={`flex-shrink-0 w-full md:w-[280px] border-r border-gray-100 flex flex-col bg-[#FAFAFA] ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-[#5845D8]" />
                        <h3 className="font-black text-[#111827] text-[11px] uppercase tracking-widest">Messages</h3>
                    </div>
                    {conversations.length > 0 && (
                        <span className="px-2 py-0.5 bg-[#5845D8] text-white rounded-full text-[9px] font-black">
                            {conversations.length}
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <MessageCircle size={20} className="text-gray-300" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                                No conversations yet
                            </p>
                            <p className="text-[8px] text-gray-300 font-medium leading-relaxed max-w-[160px]">
                                Chats appear here when a traveler is matched to your shipment
                            </p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const isActive = selectedConv?._id === conv._id;
                            const convPackages = shipmentsByConvId[conv._id] || (conv.request ? [conv.request] : []);
                            const fromCity = convPackages[0]?.package?.fromCity || conv.request?.package?.fromCity || '';
                            const toCity   = convPackages[0]?.package?.toCity   || conv.request?.package?.toCity   || '';
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full p-4 flex items-start gap-3 transition-all border-b border-gray-100/60 group text-left ${
                                        isActive ? 'bg-[#5845D8]/5 border-l-[3px] border-l-[#5845D8]' : 'hover:bg-white'
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-2 transition-all ${
                                        isActive
                                            ? 'bg-[#5845D8] text-white border-[#5845D8]/30 shadow-md shadow-[#5845D8]/20'
                                            : 'bg-gray-100 text-gray-500 border-gray-100 group-hover:border-[#5845D8]/20'
                                    }`}>
                                        {conv.otherUser?.firstName?.charAt(0) || <User size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className={`text-[11px] font-black truncate tracking-tight ${isActive ? 'text-[#5845D8]' : 'text-[#111827]'}`}>
                                                {conv.otherUser?.firstName || 'User'}
                                            </p>
                                            <p className="text-[8px] text-gray-300 font-medium whitespace-nowrap ml-1">
                                                {formatTime(conv.updated_at || conv.updatedAt)}
                                            </p>
                                        </div>
                                        {fromCity && toCity && (
                                            <p className="text-[8px] font-black text-[#111827]/40 uppercase tracking-wider mb-0.5">
                                                {fromCity} → {toCity}
                                            </p>
                                        )}
                                        <p className="text-[9px] text-gray-400 truncate font-medium opacity-80">
                                            {conv.lastMessage || 'Click to chat'}
                                        </p>
                                        {conv.request?.status && (
                                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${chatStatusColor(conv.request.status)}`}>
                                                {chatStatusLabel(conv.request.status)}
                                                {convPackages.length > 1 && ` · ${convPackages.length} shipments`}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Col 2: Chat window ── */}
            <div className={`flex-1 flex flex-col bg-white min-w-0 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConv(null)} className="md:hidden p-1.5 -ml-1.5 text-gray-400 hover:text-[#5845D8]">
                                    <ArrowLeft size={19} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5845D8]/20">
                                    {selectedConv.otherUser?.firstName?.charAt(0) || <User size={14} />}
                                </div>
                                <div>
                                    <p className="font-black text-[#111827] text-[12px] tracking-tight">
                                        {selectedConv.otherUser?.firstName || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {isConnected
                                            ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><p className="text-[8px] text-green-600 font-bold uppercase tracking-widest">Online</p></>
                                            : <><WifiOff size={10} className="text-amber-400" /><p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest">Reconnecting…</p></>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedConv.request?.status === 'completed' && (
                                    <button onClick={() => handleDeleteConversation(selectedConv)} className="p-2 text-gray-300 hover:text-red-400" title="Delete chat">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                {hasAddKgShipment && (
                                    <button
                                        onClick={() => setShowAddKgModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5845D8]/20 bg-[#5845D8]/5 text-[#5845D8] hover:bg-[#5845D8]/10 font-black text-[8px] uppercase tracking-widest"
                                    >
                                        <Plus size={11} /> Add KG
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDisputeModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 font-bold text-[8px] uppercase tracking-widest"
                                >
                                    <AlertTriangle size={11} /> Report Issue
                                </button>
                            </div>
                        </div>

                        {/* Mobile shipment strip */}
                        {convShipments.length > 0 && (
                            <div className="xl:hidden flex items-center gap-2.5 px-4 py-2 bg-[#5845D8] border-b border-white/5 flex-shrink-0">
                                <Package size={12} className="text-[#5845D8] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-[9px] font-black truncate">
                                        {convShipments[0]?.package?.description || 'Package'}
                                        {convShipments.length > 1 && ` · +${convShipments.length - 1} more`}
                                    </p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex-shrink-0 ${chatStatusColor(convShipments[0]?.status)}`}>
                                    {chatStatusLabel(convShipments[0]?.status)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onTabChange && onTabChange(req?.role === 'sender' ? 'shipments' : 'deliveries')}
                                    className="flex-shrink-0 bg-[#5845D8] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-[#4838B5] whitespace-nowrap"
                                >
                                    View
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 px-5 py-5 overflow-y-auto space-y-3 bg-[#F6F5FC]/40">
                            <div className="flex justify-center mb-4">
                                <span className="bg-white px-3 py-1 rounded-full text-[7px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                                    🔒 Messages are private and secure
                                </span>
                            </div>

                            {messages.map((msg, i) => {
                                const senderId = getSenderId(msg.sender || msg.senderId || msg.sender_id);
                                const participantId = getCurrentParticipantId(selectedConv);
                                const isMe = senderId !== '' && senderId === participantId;
                                return (
                                    <div key={getMessageId(msg) || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                                        <div className={`relative max-w-[78%] px-4 py-3 rounded-2xl text-[11px] font-medium shadow-sm ${
                                            isMe
                                                ? 'bg-[#5845D8] text-white rounded-tr-sm'
                                                : 'bg-white text-[#111827] border border-gray-100 rounded-tl-sm'
                                        }`}>
                                            {msg.fileUrl && (msg.type === 'image' || msg.mimeType?.startsWith('image/')) && (
                                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl mb-2">
                                                    <img src={msg.fileUrl} alt={msg.fileName || 'attachment'} className="max-h-64 w-full object-cover" />
                                                </a>
                                            )}
                                            {msg.fileUrl && msg.type !== 'image' && !msg.mimeType?.startsWith('image/') && (
                                                <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                                                    className={`mb-2 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isMe ? 'border-white/20 bg-white/10' : 'border-gray-100 bg-gray-50'}`}>
                                                    <FileText size={16} className="shrink-0" />
                                                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold">{msg.fileName || 'Attachment'}</span>
                                                </a>
                                            )}
                                            {msg.text && msg.text !== 'Image' && <p className="leading-relaxed">{msg.text}</p>}
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

                        {/* Content warning banner */}
                        {warningType && (
                            <div className={`mx-5 mb-3 p-3.5 rounded-2xl flex items-start gap-3 ${
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
                                        {warningType === 'abuse' ? 'Abusive language detected' : 'Contact sharing not permitted'}
                                    </p>
                                    <p className="text-[9px] font-medium leading-relaxed">
                                        {warningType === 'abuse'
                                            ? 'Abusive messages violate Bago\'s guidelines and may result in account suspension.'
                                            : 'Sharing phone numbers, links, or external contacts is not permitted. All communication must stay within Bago to protect both parties.'
                                        }
                                    </p>
                                </div>
                                <button onClick={() => setWarningType(null)} className="font-black text-[11px] opacity-50 hover:opacity-100 shrink-0">×</button>
                            </div>
                        )}

                        {/* Message input / closed banner */}
                        {isChatClosed ? (
                            <div className="px-5 pb-5 pt-2 bg-white border-t border-gray-50">
                                <div className="flex items-center justify-center gap-2 rounded-[18px] border border-gray-100 bg-gray-50 px-4 py-3.5 text-[10px] font-bold text-gray-400">
                                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                                    This shipment is completed — chat is now read-only
                                </div>
                            </div>
                        ) : (
                        <div className="px-5 pb-5 pt-2 bg-white border-t border-gray-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-50 rounded-[18px] border border-gray-100 px-3 py-2 focus-within:border-[#5845D8]/25 focus-within:bg-white focus-within:shadow-md transition-all">
                                <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleSendAttachment} />
                                <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={isSending} className="p-1.5 text-gray-400 hover:text-[#5845D8] disabled:opacity-40">
                                    <Paperclip size={17} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); if (warningType) setWarningType(null); }}
                                    placeholder="Type a message…"
                                    className="flex-1 bg-transparent outline-none text-[12px] text-[#111827] placeholder:text-gray-300 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="bg-[#5845D8] text-white p-2 rounded-xl hover:bg-[#4838B5] active:scale-95 shadow-md shadow-[#5845D8]/20 disabled:opacity-40"
                                >
                                    {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                                </button>
                            </form>
                        </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#F6F5FC]/30">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-gray-200/50 border border-gray-100">
                            <MessageCircle size={30} className="text-[#5845D8]/30" />
                        </div>
                        <h3 className="text-sm font-black text-[#111827] mb-2 uppercase tracking-wider">Select a conversation</h3>
                        <p className="text-[10px] text-gray-400 font-medium max-w-[220px] leading-relaxed">
                            Choose a conversation from the list on the left to start chatting
                        </p>
                    </div>
                )}
            </div>

            {/* ── Col 3: Shipments panel (CRM-style, desktop only) ── */}
            {selectedConv && (
                <div className="hidden xl:flex flex-col w-[280px] flex-shrink-0 border-l border-gray-100 overflow-y-auto bg-[#FAFAFA]">
                    {convShipments.length > 0 ? (
                        <>
                            {/* Scrollable shipment cards */}
                            <div className="m-4">
                                {/* Navigation header if multiple shipments */}
                                {convShipments.length > 1 && (
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            Shipment {activeShipmentIdx + 1} of {convShipments.length}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setActiveShipmentIdx(i => Math.max(0, i - 1))}
                                                disabled={activeShipmentIdx === 0}
                                                className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-all"
                                            >
                                                <ChevronLeft size={14} className="text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => setActiveShipmentIdx(i => Math.min(convShipments.length - 1, i + 1))}
                                                disabled={activeShipmentIdx === convShipments.length - 1}
                                                className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-all"
                                            >
                                                <ChevronRight size={14} className="text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Active shipment card */}
                                {(() => {
                                    const s = convShipments[activeShipmentIdx] || convShipments[0];
                                    const p = s?.package || s?.packageDetails || {};
                                    const fromCity = s?.originCity || p.fromCity || '—';
                                    const toCity   = s?.destinationCity || p.toCity || '—';
                                    const pickupAddr   = p.pickupAddress || s?.pickupAddress || '';
                                    const deliveryAddr = p.deliveryAddress || s?.deliveryAddress || '';
                                    return (
                                        <div className="bg-[#5845D8] rounded-[20px] p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                                            <div className="relative z-10">
                                                {/* Status */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[8px] text-white/40 font-black uppercase tracking-[2px]">
                                                        {s?.trackingNumber ? `#${s.trackingNumber}` : 'Awaiting Tracking'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${chatStatusColor(s?.status)}`}>
                                                        {chatStatusLabel(s?.status)}
                                                    </span>
                                                </div>

                                                {/* Image */}
                                                <div className="w-full h-16 bg-white/5 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-white/8">
                                                    {(s?.image || p.image) ? (
                                                        <img src={s.image || p.image} className="w-full h-full object-cover" alt="Package" />
                                                    ) : (
                                                        <Package size={28} className="text-[#5845D8]/40" />
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <p className="text-white font-black text-[13px] leading-snug mb-3 truncate">
                                                    {p.description || s?.description || 'Package'}
                                                </p>

                                                {/* Route */}
                                                <div className="flex items-center gap-1.5 mb-3 bg-white/5 rounded-xl px-3 py-2">
                                                    <span className="text-[9px] text-white/60 font-black uppercase truncate">{fromCity}</span>
                                                    <span className="text-white/20 font-black">→</span>
                                                    <span className="text-[9px] text-white/60 font-black uppercase truncate">{toCity}</span>
                                                </div>

                                                {/* Key fields */}
                                                <div className="space-y-2 mb-4">
                                                    {p.packageWeight ? (
                                                        <div className="flex justify-between">
                                                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Weight</span>
                                                            <span className="text-[10px] text-white font-black">{p.packageWeight} kg</span>
                                                        </div>
                                                    ) : null}
                                                    {s?.amount ? (
                                                        <div className="flex justify-between">
                                                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Amount</span>
                                                            <span className="text-[10px] text-white font-black">{s.currency} {s.amount}</span>
                                                        </div>
                                                    ) : null}
                                                    {pickupAddr && (
                                                        <div className="flex gap-2 pt-1">
                                                            <MapPin size={10} className="text-[#5845D8] shrink-0 mt-0.5" />
                                                            <span className="text-[8px] text-white/50 leading-relaxed">{pickupAddr}</span>
                                                        </div>
                                                    )}
                                                    {deliveryAddr && (
                                                        <div className="flex gap-2">
                                                            <MapPin size={10} className="text-green-400 shrink-0 mt-0.5" />
                                                            <span className="text-[8px] text-white/50 leading-relaxed">{deliveryAddr}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onTabChange && onTabChange(s?.role === 'sender' ? 'shipments' : 'deliveries')}
                                                        className="w-full bg-[#5845D8] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all"
                                                    >
                                                        View Full Details
                                                    </button>
                                                    {s?.trackingNumber && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadPDF(s?._id || s?.id, s?.trackingNumber)}
                                                            disabled={downloading === (s?._id || s?.id)}
                                                            className="w-full bg-white/8 border border-white/10 text-white/70 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/12 flex items-center justify-center gap-2 disabled:opacity-40"
                                                        >
                                                            {downloading === (s?._id || s?.id)
                                                                ? <><RefreshCw size={12} className="animate-spin" /> Downloading…</>
                                                                : <><FileText size={12} /> Download Label</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Dot indicators for multiple shipments */}
                                {convShipments.length > 1 && (
                                    <div className="flex justify-center gap-1.5 mt-3">
                                        {convShipments.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveShipmentIdx(i)}
                                                className={`rounded-full transition-all ${i === activeShipmentIdx ? 'w-4 h-2 bg-[#5845D8]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick actions */}
                            <div className="mx-4 mb-4 bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                                <div className="space-y-2">
                                    <button onClick={() => setShowDisputeModal(true)}
                                        className="w-full flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                                        <AlertTriangle size={13} /> Report Issue
                                    </button>
                                    {selectedConv.request?.status === 'completed' && (
                                        <button onClick={() => handleDeleteConversation(selectedConv)}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                            <Trash2 size={13} /> Delete Chat
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

            {/* ── Add KG Modal ── */}
            {showAddKgModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50">
                        <div className="p-7 border-b border-gray-50 flex flex-col gap-2 bg-[#5845D8]/5">
                            <div className="w-12 h-12 bg-white text-[#5845D8] rounded-2xl flex items-center justify-center shadow-lg border border-[#5845D8]/10">
                                <Weight size={22} />
                            </div>
                            <h3 className="text-lg font-black text-[#111827] uppercase tracking-tight">Add Extra Weight</h3>
                            <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                                This adds weight to the active shipment. The receiver's details and destination stay the same.
                            </p>
                        </div>
                        <div className="p-7 space-y-5">
                            {convShipments.length > 1 && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Select Shipment</label>
                                    <select
                                        value={activeShipmentIdx}
                                        onChange={e => setActiveShipmentIdx(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-xs font-bold text-[#111827] outline-none"
                                    >
                                        {convShipments.map((s, i) => (
                                            <option key={i} value={i}>
                                                {s.trackingNumber || `Shipment ${i + 1}`} — {s?.package?.fromCity || '?'} → {s?.package?.toCity || '?'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Additional weight</label>
                                <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 rounded-2xl border border-transparent focus-within:border-[#5845D8]/20 focus-within:bg-white transition-all">
                                    <input
                                        type="number" step="0.1" min="0.1"
                                        value={addKgInput}
                                        onChange={e => setAddKgInput(e.target.value)}
                                        placeholder="0.0"
                                        className="flex-1 bg-transparent outline-none text-base font-black text-[#111827] placeholder:text-gray-300"
                                        autoFocus
                                    />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KG</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowAddKgModal(false); setAddKgInput(''); }}
                                    className="flex-1 py-3.5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">
                                    Cancel
                                </button>
                                <button type="button" onClick={handleAddKg}
                                    disabled={!addKgInput || parseFloat(addKgInput) <= 0 || addKgLoading}
                                    className="flex-[2] bg-[#5845D8] text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-[#5845D8]/20 hover:bg-[#4838B5] flex items-center justify-center gap-2 disabled:opacity-40">
                                    {addKgLoading ? <RefreshCw className="animate-spin" size={14} /> : <><Plus size={14} /> Confirm & Pay</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Dispute Modal ── */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50">
                        <div className="p-7 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/30">
                            <div className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-[#111827] uppercase tracking-tight">Report an Issue</h3>
                                <p className="text-[9px] text-red-500 font-black mt-0.5 uppercase tracking-widest">Bago Support Mediation</p>
                            </div>
                        </div>
                        <form onSubmit={handleRaiseDispute} className="p-7 space-y-5">
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed text-center">
                                Reporting an issue will pause the escrow and notify the Bago team, who will contact both parties to resolve the matter.
                            </p>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Describe the problem</label>
                                <textarea
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                    placeholder="e.g. Traveler is not responding, package arrived damaged, contents don't match…"
                                    className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-medium min-h-[110px] focus:border-red-200 focus:bg-white transition-all placeholder:text-gray-300"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowDisputeModal(false)}
                                    className="flex-1 py-3.5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmittingDispute}
                                    className="flex-[2] bg-[#5845D8] text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSubmittingDispute ? <RefreshCw className="animate-spin" size={14} /> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
