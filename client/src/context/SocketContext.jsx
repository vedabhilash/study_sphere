import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const getBackendUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) return apiUrl;
      
      const { protocol, hostname } = window.location;
      if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.')
      ) {
        return `${protocol}//${hostname}:5000`;
      }
      return 'http://localhost:5000';
    };

    // Connect to backend socket server
    const backendUrl = getBackendUrl();
    const newSocket = io(backendUrl, {
      autoConnect: true,
      reconnection: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Notify server that this user is online
      newSocket.emit('userOnline', user._id);
    });

    if (newSocket.connected) {
      console.log('Socket already connected:', newSocket.id);
      newSocket.emit('userOnline', user._id);
    }

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
