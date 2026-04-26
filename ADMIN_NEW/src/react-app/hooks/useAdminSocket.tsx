import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_ROOT } from '../config/api';
import { useAuth } from './useAuth';

interface SupportMessage {
  sender: 'USER' | 'ADMIN';
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
}

interface NewTicketPayload {
  ticket: { _id: string; subject: string; status: string; category: string };
  user: { id: string; firstName?: string; lastName?: string };
}

interface SupportMessagePayload {
  ticketId: string;
  message: SupportMessage;
  senderName?: string;
}

interface AdminSocketContextValue {
  socket: Socket | null;
  connected: boolean;
  unreadSupportCount: number;
  clearSupportBadge: () => void;
  onSupportMessage: (cb: (p: SupportMessagePayload) => void) => () => void;
  onNewTicket: (cb: (p: NewTicketPayload) => void) => () => void;
}

const AdminSocketContext = createContext<AdminSocketContextValue>({
  socket: null,
  connected: false,
  unreadSupportCount: 0,
  clearSupportBadge: () => {},
  onSupportMessage: () => () => {},
  onNewTicket: () => () => {},
});

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socketUrl = API_ROOT.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_support_agents');
    });
    socket.on('disconnect', () => setConnected(false));

    // New ticket from app user — bump badge
    socket.on('new_support_ticket', () => {
      setUnreadSupportCount((n) => n + 1);
    });

    // New message from user — bump badge if not on support page
    socket.on('support_message', (data: SupportMessagePayload) => {
      if (data.message.sender === 'USER') {
        setUnreadSupportCount((n) => n + 1);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const clearSupportBadge = () => setUnreadSupportCount(0);

  const onSupportMessage = (cb: (p: SupportMessagePayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('support_message', cb);
    return () => socket.off('support_message', cb);
  };

  const onNewTicket = (cb: (p: NewTicketPayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('new_support_ticket', cb);
    return () => socket.off('new_support_ticket', cb);
  };

  return (
    <AdminSocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      unreadSupportCount,
      clearSupportBadge,
      onSupportMessage,
      onNewTicket,
    }}>
      {children}
    </AdminSocketContext.Provider>
  );
}

export function useAdminSocket() {
  return useContext(AdminSocketContext);
}
