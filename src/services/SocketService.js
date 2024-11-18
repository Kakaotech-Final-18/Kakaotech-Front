// Socket.IO 관련 로직
import { io } from 'socket.io-client';
let socket;

export const initializeSocket = serverUrl => {
  socket = io(serverUrl);
  return socket;
};

export const getSocket = () => socket;
