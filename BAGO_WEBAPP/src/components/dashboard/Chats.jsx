import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Send, AlertTriangle, User, Paperclip, MessageCircle, RefreshCw, Package, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BANNED_KEYWORDS = ['phone', 'whatsapp', 'number', 'call', 'telegram', 'instagram', 'facebook', 'email', '+', 'gmail', 'yahoo', 'dm', 'contact me', 'text me'];

export default function Chats({ user, selectedConv, setSelectedConv, onTabChange }) {
    const { t } = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
        }
    }, [selectedConv]);

    // Poll for new messages every 8 seconds when a conversation is open
    useEffect(() => {
        if (!selectedConv) return;
        const interval = setInterval(() => fetchMessages(selectedConv._id), 8000);
        return () => clearInterval(interval);
    }, [selectedConv?._id]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/api/bago/conversations');
            const rawConversations = res.data?.data?.conversations || [];

            const processed = rawConversations.map(conv => {
                const currentUserId = user?._id || user?.id;
                const isSender = conv.sender?._id?.toString() === currentUserId?.toString();
                const otherUser = isSender ? conv.traveler : conv.sender;
                
                // Add role to the request object if it and current user exist
                if (conv.request && typeof conv.request === 'object') {
                    conv.request.role = isSender ? 'sender' : 'traveler';
                }

                return {
                    ...conv,
                    otherUser: otherUser || { firstName: 'User' },
                    lastMessage: conv.last_message || 'Click to chat'
                };
            });

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
            setMessages(res.data?.data?.messages || []);
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

    const containsBannedKeywords = (text) => {
        const lowerText = text.toLowerCase();
        return BANNED_KEYWORDS.some(kw => lowerText.includes(kw));
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

        if (containsBannedKeywords(newMessage)) {
            setShowWarning(true);
            return;
        }

        try {
            const res = await api.post(`/api/bago/conversations/${selectedConv._id}/send`, {
                text: newMessage
            });
            if (res.data?.success) {
                setMessages([...messages, res.data.data]);
                setNewMessage('');
                scrollToBottom();
            }
        } catch (err) {
        }
    };

    return (
        <div className="flex h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm font-sans text-[#012126]">
            {/* Sidebar List */}
            <div className={`w-full md:w-[320px] border-r border-gray-100 flex flex-col bg-white ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-[#012126] text-[10px] uppercase tracking-widest">{t('messages') || 'Messages'}</h3>
                    <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center">
                        <MessageCircle size={10} className="text-[#5845D8]" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('emptyInbox')}</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv._id}
                                onClick={() => setSelectedConv(conv)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-all border-b border-gray-50 group ${selectedConv?._id === conv._id ? 'bg-[#5845D8]/5 border-r-[3px] border-r-[#5845D8]' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-black text-xs border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                                    {conv.otherUser?.firstName?.charAt(0) || <User size={14} />}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="font-black text-[#012126] text-[11px] truncate uppercase tracking-tight">
                                            {conv.otherUser?.firstName} {conv.otherUser?.lastName || ''}
                                        </p>
                                        <p className="text-[8px] text-gray-300 font-black whitespace-nowrap ml-2">
                                            {formatTime(conv.updated_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[9px] text-gray-400 truncate font-bold uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                                            {conv.lastMessage || t('openChat')}
                                        </p>
                                        {conv.request?.status && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest shrink-0 ${
                                                conv.request.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-[#5845D8]/10 text-[#5845D8]'
                                            }`}>
                                                {conv.request.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col bg-white relative ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10 shadow-sm shadow-gray-50/20">
                            <div className="flex items-center gap-2 md:gap-3">
                                <button 
                                    onClick={() => setSelectedConv(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-[#5845D8] transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5845D8]/20 border-2 border-white">
                                    {selectedConv.otherUser?.firstName?.charAt(0)}
                                </div>
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <p className="font-black text-[#012126] text-[11px] tracking-tight uppercase">
                                             {selectedConv.otherUser?.firstName || 'User'} {selectedConv.otherUser?.lastName || ''}
                                         </p>
                                         {selectedConv.request?.status && (
                                             <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                                 selectedConv.request.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                 selectedConv.request.status === 'intransit' ? 'bg-blue-50 text-blue-600' :
                                                 selectedConv.request.status === 'accepted' ? 'bg-purple-50 text-purple-600' :
                                                 'bg-amber-50 text-amber-600'
                                             }`}>
                                                 {selectedConv.request.status}
                                             </span>
                                         )}
                                     </div>
                                     <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                        <p className="text-[7px] text-green-600 font-black uppercase tracking-widest">{t('activeNow')}</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-2">
                                     {selectedConv.request?.status === 'completed' && (
                                         <button 
                                             onClick={() => handleDeleteConversation(selectedConv)}
                                             className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                             title="Delete Conversation"
                                         >
                                             <Trash2 size={18} />
                                         </button>
                                     )}
                                     <button 
                                         onClick={() => setShowDisputeModal(true)}
                                         className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-50 text-red-500 hover:bg-red-50 transition-all font-black text-[8px] uppercase tracking-widest"
                                         title="Report an issue with this shipment"
                                     >
                                         <AlertTriangle size={12} />
                                         <span>{t('reportIssue') || 'Report Issue'}</span>
                                     </button>
                                 </div>
                             </div>
                         </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-100/20 scroll-smooth">
                            {selectedConv.request && typeof selectedConv.request === 'object' && (
                                <>
                                    <div className="mb-8 animate-in slide-in-from-top duration-500">
                                        <div 
                                            onClick={() => onTabChange(selectedConv.request.role === 'sender' ? 'shipments' : 'deliveries')}
                                            className="bg-white rounded-[24px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden group cursor-pointer hover:border-[#5845D8]/30 transition-all"
                                        >
                                            <div className="p-1 bg-[#5845D8]/5">
                                                <div className="flex items-center gap-4 p-4">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-50 shrink-0 shadow-inner">
                                                        {(selectedConv.request.image || selectedConv.request.package?.image) ? (
                                                            <img src={selectedConv.request.image || selectedConv.request.package?.image} className="w-full h-full object-cover" alt="Item" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#5845D8]/20"><Package size={24} /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-black text-[#012126] text-xs uppercase tracking-tight truncate">
                                                                {selectedConv.request.package?.description || t('shipmentDetails')}
                                                            </h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                                                selectedConv.request.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-[#5845D8]/10 text-[#5845D8]'
                                                            }`}>
                                                                {selectedConv.request.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                            <div className="flex items-center gap-1.5 opacity-60">
                                                                <Clock size={10} className="text-[#5845D8]" />
                                                                <span className="text-[9px] font-black text-[#012126] tracking-widest uppercase truncate">
                                                                    #{selectedConv.request.trackingNumber || 'PENDING'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 opacity-60">
                                                                <Package size={10} className="text-[#5845D8]" />
                                                                <span className="text-[9px] font-black text-[#012126] tracking-widest uppercase truncate">
                                                                    {selectedConv.request.package?.packageWeight || 0} KG
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pl-4 border-l border-gray-100 hidden md:block">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('amountPaid') || 'Paid'}</p>
                                                        <p className="text-sm font-black text-[#012126] truncate">{selectedConv.request.currency} {selectedConv.request.amount}</p>
                                                    </div>
                                                </div>
                                                <div className="px-4 pb-4 pt-1 flex gap-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTabChange(selectedConv.request.role === 'sender' ? 'shipments' : 'deliveries');
                                                        }}
                                                        className="flex-1 bg-[#012126] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
                                                    >
                                                        {t('viewFullShipment') || 'View Shipment Details'}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadPDF(selectedConv.request._id, selectedConv.request.trackingNumber);
                                                        }}
                                                        disabled={downloading === selectedConv.request._id}
                                                        className="px-6 py-2.5 bg-white text-[#5845D8] border-2 border-[#5845D8] rounded-xl hover:bg-[#5845D8] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.1em] min-w-[120px]"
                                                    >
                                                        {downloading === selectedConv.request._id ? <RefreshCw size={14} className="animate-spin" /> : null}
                                                        <span>{downloading === selectedConv.request._id ? 'DOWNLOADING' : 'DOWNLOAD'}</span>
                                                    </button>
                                                </div>
                                         </div>
                                     </div>
                                        <div className="flex justify-center mt-4 italic">
                                            <div className="h-px w-8 bg-gray-100 self-center"></div>
                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[4px] px-3">{t('conversationHistory') || 'Conversation Logs'}</span>
                                            <div className="h-px w-8 bg-gray-100 self-center"></div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-center mb-6">
                                <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[7px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">{t('encryptionActive')}</span>
                            </div>
                            {messages.map((msg, i) => {
                                const senderId = typeof msg.sender === 'object' ? (msg.sender?._id || msg.sender?.id) : msg.sender;
                                const currentUserId = user?._id || user?.id;
                                const isMe = senderId === currentUserId;
                                
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 px-2`}>
                                        <div className={`relative max-w-[80%] px-4 py-3 rounded-2xl text-[11px] font-bold shadow-sm ${
                                            isMe 
                                            ? 'bg-[#5845D8] text-white rounded-tr-none' 
                                            : 'bg-[#F8F6F3] text-[#012126] border border-gray-100 rounded-tl-none'
                                        }`}>
                                            {/* Bubble Tail */}
                                            <div className={`absolute top-0 w-3 h-3 ${
                                                isMe 
                                                ? 'right-[-6px] bg-[#5845D8] [clip-path:polygon(0_0,0_100%,100%_0)]' 
                                                : 'left-[-6px] bg-[#F8F6F3] [clip-path:polygon(0_0,100%_0,100%_100%)] border-l border-gray-100'
                                            }`}></div>
                                            
                                            <p className="leading-relaxed">{msg.text}</p>
                                            
                                            <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                                <p className={`text-[7px] font-black uppercase tracking-widest ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                                {isMe && <div className="flex -space-x-1"><div className="w-2 h-2 text-white/80 text-[10px]">✓</div><div className="w-2 h-2 text-white/80 text-[10px]">✓</div></div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Warning Bar */}
                        {showWarning && (
                            <div className="mx-6 mb-4 p-4 bg-amber-50/80 backdrop-blur-md border border-amber-200/50 rounded-2xl flex items-center gap-3 text-amber-900 animate-in slide-in-from-bottom-4 duration-500 shadow-xl shadow-amber-900/5">
                                <AlertTriangle size={16} className="flex-shrink-0 text-amber-500" />
                                <p className="text-[9px] font-black leading-relaxed uppercase tracking-wider opacity-80">
                                    {t('securityAlert')}
                                </p>
                                <button onClick={() => setShowWarning(false)} className="ml-auto text-amber-600 hover:text-amber-800 font-black text-[9px] uppercase tracking-widest transition-colors">{t('dismiss')}</button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="px-6 pb-6 bg-white">
                            <form onSubmit={handleSendMessage} className="p-2.5 bg-gray-50/50 rounded-[20px] border border-gray-100 flex items-center gap-2 focus-within:bg-white focus-within:border-[#5845D8]/20 focus-within:shadow-lg transition-all shadow-sm">
                                <button type="button" className="p-2 text-gray-400 hover:text-[#5845D8] transition-colors"><Paperclip size={18} /></button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        if (showWarning) setShowWarning(false);
                                    }}
                                    placeholder={t('typeMessage')}
                                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-[#012126] placeholder:text-gray-300 placeholder:uppercase placeholder:tracking-widest placeholder:text-[9px]"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#5845D8] text-white p-2.5 rounded-xl hover:bg-[#4838B5] hover:scale-105 transition-all shadow-md shadow-[#5845D8]/20 active:scale-95 disabled:opacity-50"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-200/40 relative">
                            <div className="absolute inset-0 bg-[#5845D8]/5 rounded-full animate-ping duration-[3000ms]"></div>
                            <MessageCircle size={32} className="text-[#5845D8] opacity-20 relative z-10" />
                        </div>
                        <h3 className="text-xs font-black text-[#012126] mb-2 uppercase tracking-[0.2em]">{t('selectConversation')}</h3>
                        <p className="text-gray-400 text-[10px] font-bold max-w-xs mx-auto uppercase tracking-widest leading-loose opacity-60">{t('selectConversationDesc')}</p>
                    </div>
                )}
            </div>

            {/* In-Chat Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/20">
                            <div className="w-14 h-14 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">Report Order Issue</h3>
                                <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">Mediation Request</p>
                            </div>
                        </div>

                        <form onSubmit={handleRaiseDispute} className="p-6 md:p-8 space-y-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed text-center px-4">
                                Is there something wrong with the shipment or the other user? Reporting an issue will pause the escrow and notify Bago admins.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Issue Details</label>
                                <textarea
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                    placeholder="Please describe the problem in detail..."
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:border-red-500/20 focus:bg-white transition-all text-[#012126] placeholder:text-gray-300"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDisputeModal(false)}
                                    className="flex-1 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all font-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDispute}
                                    className="flex-[2] bg-[#012126] text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmittingDispute ? <RefreshCw className="animate-spin" size={16} /> : 'Raise Dispute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
