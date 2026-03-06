import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Send, AlertTriangle, User, Paperclip, MessageCircle } from 'lucide-react';

const BANNED_KEYWORDS = ['phone', 'whatsapp', 'number', 'call', 'telegram', 'instagram', 'facebook', 'email', '+', 'gmail', 'yahoo', 'dm', 'contact me', 'text me'];

export default function Chats({ user }) {
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
            console.error("Failed to fetch conversations", err);
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
            console.error("Failed to fetch messages", err);
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
            console.error("Failed to send message", err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="font-bold text-[#054752]">Active Chats</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-sm">No active conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv._id}
                                onClick={() => setSelectedConv(conv)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-all border-b border-gray-50 ${selectedConv?._id === conv._id ? 'bg-[#5845D8]/5 border-r-2 border-r-[#5845D8]' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                    {conv.otherUser?.firstName?.charAt(0) || <User size={20} />}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-[#054752] text-sm">{conv.otherUser?.firstName || 'User'}</p>
                                    <p className="text-xs text-gray-400 truncate font-medium">{conv.lastMessage || 'Click to chat'}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold">
                                    {selectedConv.otherUser?.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-[#054752] text-sm">{selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}</p>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/20">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender === (user?._id || user?.id);
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium ${isMe ? 'bg-[#5845D8] text-white' : 'bg-white border border-gray-100 text-[#054752] shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Warning Bar */}
                        {showWarning && (
                            <div className="px-6 py-3 bg-amber-50 border-y border-amber-100 flex items-center gap-3 text-amber-800 animate-in slide-in-from-bottom duration-300">
                                <AlertTriangle size={18} className="flex-shrink-0" />
                                <p className="text-xs font-bold leading-relaxed">
                                    Warning: To protect your payments and security, please keep all communication within the Bago app. Exchange of contact details is restricted and can lead to account suspension.
                                </p>
                                <button onClick={() => setShowWarning(false)} className="ml-auto text-amber-500 hover:text-amber-700 font-black">Dismiss</button>
                            </div>
                        )}

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex gap-4">
                            <button type="button" className="p-2 text-gray-400 hover:text-[#5845D8] transition-colors"><Paperclip size={20} /></button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    if (showWarning) setShowWarning(false);
                                }}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 outline-none focus:border-[#5845D8] focus:bg-white transition-all text-sm font-medium"
                            />
                            <button
                                type="submit"
                                className="bg-[#5845D8] text-white p-2 rounded-xl hover:bg-[#4838B5] transition-all shadow-md active:scale-95"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#054752] mb-2">Select a conversation</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">Click on a chat to start messaging with travelers or senders.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
