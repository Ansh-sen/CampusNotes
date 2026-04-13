import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { messageService, initSocket } from '@/services/messageService';
import { Socket } from 'socket.io-client';

interface UnreadCountContextType {
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextType>({
  unreadCount: 0,
  refreshUnreadCount: () => {},
});

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, jwt } = useAuth();
  const socketRef = React.useRef<Socket | null>(null);

  const fetchUnreadCount = async () => {
    if (!jwt) return;
    try {
      const res = await messageService.getUnreadCount(jwt);
      if (res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (user && jwt) {
      fetchUnreadCount();

      // Setup notification socket
      socketRef.current = initSocket(jwt);
      if (socketRef.current) {
        socketRef.current.emit('join_user_room', user.id);
      }

      socketRef.current?.on('unread_update', (data: { increment: boolean }) => {
        setUnreadCount(prev => data.increment ? prev + 1 : Math.max(0, prev - 1));
      });

      socketRef.current?.on('unread_sync', () => {
        fetchUnreadCount();
      });

      return () => {
        socketRef.current?.off('unread_update');
        socketRef.current?.off('unread_sync');
      };
    } else {
      setUnreadCount(0);
    }
  }, [user, jwt]);

  return (
    <UnreadCountContext.Provider value={{ unreadCount, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </UnreadCountContext.Provider>
  );
}

export const useUnreadCount = () => useContext(UnreadCountContext);
