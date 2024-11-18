// Socket.IO 관련 로직
import { io } from 'socket.io-client';

let socket;

/**
 * Socket 초기화 함수
 */
export const initializeSocket = () => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    // 소켓 초기화
    socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // 연결 확인
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      console.log('Connected to Socket.IO server:', serverUrl);
    });

    // 연결 끊김 확인
    socket.on('disconnect', reason => {
      console.warn('Socket disconnected:', reason);
    });
  }
  return socket;
};

/**
 * 기존 소켓 반환
 * @returns {Socket} 기존 Socket.IO 인스턴스
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket is not initialized. Call initializeSocket first.');
  }
  return socket;
};
