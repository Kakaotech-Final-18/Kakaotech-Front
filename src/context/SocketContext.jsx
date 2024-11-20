import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeSocket } from '../services/SocketService';

// Context 생성
const SocketContext = createContext(null);

// Context Provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const newSocket = await initializeSocket();
      setSocket(newSocket);
    };

    initialize();

    return () => {};
  }, []);

  if (!socket) {
    return null; // 초기화되지 않은 상태에서 아무것도 렌더링하지 않음
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
