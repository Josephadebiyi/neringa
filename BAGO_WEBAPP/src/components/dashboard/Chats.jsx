import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Send, AlertTriangle, User, Paperclip, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BANNED_KEYWORDS = ['phone', 'whatsapp', 'number', 'call', 'telegram', 'instagram', 'facebook', 'email', '+', 'gmail', 'yahoo', 'dm', 'contact me', 'text me'];

export default function Chats({ user }) {
    const { t } = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
        }
    }, [selectedConv]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/api/bago/conversations');
            // Backend returns { success: true, data: { conversations: [] } }
            const rawConversations = res.data?.data?.conversations || [];

            // Map to identify 'otherUser' for the UI
            const processed = rawConversations.map(conv => {
                const currentUserId = user?._id || user?.id;
                const otherUser = conv.sender?._id === currentUserId ? conv.traveler : conv.sender;
                return {
                    ...conv,
                    otherUser: otherUser || { firstName: 'User' },
                    lastMessage: conv.last_message || 'Click to chat'
                };
            });

            setConversations(processed);
        } catch (err) {
            setConversations([]);
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const containsBannedKeywords = (text) => {
        const lowerText = text.toLowerCase();
        return BANNED_KEYWORDS.some(kw => lowerText.includes(kw));
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
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm font-sans text-[#012126]">
            {/* Sidebar List */}
            <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-[#012126] text-[10px] uppercase tracking-widest">{t('activeChats')}</h3>
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
                                        <p className="font-black text-[#012126] text-[11px] truncate uppercase tracking-tight">{conv.otherUser?.firstName || 'User'}</p>
                                        <p className="text-[8px] text-gray-300 font-black">2m</p>
                                    </div>
                                    <p className="text-[9px] text-gray-400 truncate font-bold uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">{conv.lastMessage || t('openChat')}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10 shadow-sm shadow-gray-50/20">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5845D8]/20 border-2 border-white">
                                    {selectedConv.otherUser?.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-[#012126] text-[11px] tracking-tight uppercase">{selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                        <p className="text-[7px] text-green-600 font-black uppercase tracking-widest">{t('activeNow')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
                            <div className="flex justify-center mb-6">
                                <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[7px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">{t('encryptionActive')}</span>
                            </div>
                            {messages.map((msg, i) => {
                                const isMe = msg.sender === (user?._id || user?.id);
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-[11px] font-bold leading-relaxed ${isMe ? 'bg-[#5845D8] text-white shadow-lg shadow-[#5845D8]/10 rounded-tr-none' : 'bg-white border border-gray-100 text-[#012126] shadow-sm rounded-tl-none'}`}>
                                            {msg.text}
                                            <p className={`text-[7px] mt-1.5 opacity-40 font-black uppercase tracking-widest ${isMe ? 'text-white' : 'text-gray-400'}`}>09:41 AM</p>
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
        </div>
    );
}
