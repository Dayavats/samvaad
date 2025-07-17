import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatSocketContext = createContext();

export function ChatSocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      const apiBaseUrl = import.meta.env.VITE_API_URL;
      const s = io(apiBaseUrl, {
        auth: { token },
        autoConnect: true,
        transports: ['websocket'],
      });

      s.on('connect', () => {
        console.log('Socket connected:', s.id);
      });
      s.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      s.on('connect_error', (err) => {
        console.error('Socket connect_error:', err);
      });

      setSocket(s);

      return () => {
        s.disconnect();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    // eslint-disable-next-line
  }, [token]);

  return (
    <ChatSocketContext.Provider value={socket}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  return useContext(ChatSocketContext);
}