import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeSocket } from '../services/SocketService';

// Context 생성
const SocketContext = createContext(null);

// Context Provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 상태

  useEffect(() => {
    const newSocket = initializeSocket();
    setSocket(newSocket);
    setIsInitialized(true); // 초기화 완료

    return () => {};
  }, []);

  if (!isInitialized) {
    // 초기화가 완료되지 않은 경우 로딩 화면 표시
    return <div>Loading...</div>;
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Context 사용을 위한 Hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
