import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Package, MoreVertical, Phone, Video, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

const Messages: React.FC = () => {
    const { user } = useAuth();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/conversations');
                setConversations(response.data.data.conversations);
            } catch (err) {
                console.error('Error fetching conversations:', err);
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchConversations();
    }, []);

    // Socket Setup
    useEffect(() => {
        socketRef.current = io('http://localhost:3000', {
            transports: ['websocket'],
            upgrade: false
        });

        socketRef.current.on('new_message', (message: any) => {
            if (message.conversationId === selectedChatId) {
                setMessages(prev => [...prev, {
                    _id: message.id,
                    text: message.text,
                    sender: { _id: message.sender },
                    timestamp: message.timestamp
                }]);
            }

            // Update conversation list last message
            setConversations(prev => prev.map(conv => {
                if (conv._id === message.conversationId) {
                    return { ...conv, last_message: message.text, updated_at: Date.now() };
                }
                return conv;
            }).sort((a, b) => b.updated_at - a.updated_at));
        });

        socketRef.current.on('update_conversation', (updatedConv: any) => {
            setConversations(prev => prev.map(conv =>
                conv._id === updatedConv._id ? updatedConv : conv
            ));
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [selectedChatId]);

    // Fetch messages when conversation selected
    useEffect(() => {
        if (!selectedChatId) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const response = await api.get(`/conversations/${selectedChatId}/messages`);
                setMessages(response.data.data.messages);
                socketRef.current?.emit('join_conversation', selectedChatId);
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [selectedChatId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChatId || !user) return;

        socketRef.current?.emit('send_message', {
            conversationId: selectedChatId,
            senderId: user._id,
            text: newMessage
        });

        setNewMessage('');
    };

    const getOtherParticipant = (conv: any) => {
        return conv.sender._id === user?._id ? conv.traveler : conv.sender;
    };

    const selectedChat = conversations.find(c => c._id === selectedChatId);
    const otherParticipant = selectedChat ? getOtherParticipant(selectedChat) : null;

    if (isLoadingChats) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="pt-20 md:pt-24 flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <div className={`${selectedChatId !== null ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-100 bg-white`}>
                <div className="p-6">
                    <h1 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Messages</h1>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary-500/10 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center gap-4 opacity-50">
                            <Send size={40} className="text-slate-300" />
                            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No messages yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const other = getOtherParticipant(conv);
                            const unread = conv.sender._id === user?._id ? conv.unread_count_sender : conv.unread_count_traveler;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedChatId(conv._id)}
                                    className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-slate-50 border-l-4 ${selectedChatId === conv._id ? 'bg-primary-50/30 border-primary-500' : 'border-transparent'
                                        }`}
                                >
                                    <div className="relative w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 shrink-0 capitalize">
                                        {other.firstName?.charAt(0)}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-900 truncate capitalize">{other.firstName}</span>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate ${unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                                {conv.last_message || 'No messages yet'}
                                            </p>
                                            {unread > 0 && (
                                                <span className="bg-primary-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-primary-500/20">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`${selectedChatId === null ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white relative`}>
                {selectedChatId ? (
                    <>
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 text-slate-400">
                                    <ArrowRight className="rotate-180" size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 capitalize">
                                    {otherParticipant?.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-none capitalize">
                                        {otherParticipant?.firstName}
                                    </h3>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 inline-block">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Phone size={20} /></button>
                                <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Video size={20} /></button>
                                <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/20">
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader2 className="animate-spin text-primary-500" size={32} />
                                </div>
                            ) : (
                                <>
                                    <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4 self-center max-w-sm mb-4 border border-slate-100 shadow-sm">
                                        <div className="bg-primary-100 p-2 rounded-xl text-primary-600"><Package size={20} /></div>
                                        <div className="p-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Secure Shipping</p>
                                            <p className="text-xs font-bold text-slate-900">Always keep conversations within Bago for protection.</p>
                                        </div>
                                    </div>

                                    {messages.map((msg) => (
                                        <div key={msg._id} className={`flex flex-col ${msg.sender._id === user?._id ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.sender._id === user?._id
                                                ? 'bg-primary-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 mt-2 px-1">
                                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        <div className="p-4 md:p-6 bg-white border-t border-slate-100 pb-32 md:pb-6">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-primary-500/10 transition-all">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm font-bold"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-primary-600 text-white p-3 rounded-2xl shadow-lg shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-100 mb-6 group transition-transform hover:scale-110">
                            <Send size={40} className="rotate-45 translate-x-1 -translate-y-1 text-slate-50 group-hover:text-primary-100 transition-colors" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Conversations</h2>
                        <p className="text-slate-500 font-medium max-w-xs leading-relaxed">Select a traveler or sender from the list to start shipping together.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
