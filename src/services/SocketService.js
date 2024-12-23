import { io } from 'socket.io-client';

let socket;

/**
 * Socket 초기화 함수
 */
export const initializeSocket = () => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'https://ptks.link';
    socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // 폴링과 WebSocket 모두 사용 가능
      reconnection: true, // 연결 끊김 시 재시도 활성화
      reconnectionAttempts: 5, // 재시도 횟수 제한
      reconnectionDelay: 1000, // 재시도 간격(ms)
    });

    // 연결 끊김 확인
    socket.on('disconnect', reason => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // 서버에서 명시적으로 연결을 끊었을 때, 재연결 시도
        socket.connect();
      }
    });

    // 연결 확인
    return new Promise(resolve => {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        console.log('Connected to Socket.IO server:', serverUrl);
        resolve(socket);
      });

      // 연결 실패 이벤트
      socket.on('connect_error', error => {
        console.error('Socket connection error:', error);
      });

      // WebSocket 업그레이드 확인
      socket.on('upgrade', transport => {
        console.log(`Transport upgraded to: ${transport}`);
      });
    });
  }
  return Promise.resolve(socket);
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
