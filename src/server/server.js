import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const rooms = {}; // 방 정보를 저장

io.on('connection', socket => {
  console.log('New user connected:', socket.id);

  // 방 참여 로직
  socket.on('join_room', (roomName, email, screenType) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    const userCount = room ? room.size : 0;

    if (userCount >= 2) {
      socket.emit('room_full');
    } else {
      socket.join(roomName);
      console.log(`${email} joined room: ${roomName} as ${screenType}`);

      if (!rooms[roomName]) rooms[roomName] = [];
      rooms[roomName].push({ id: socket.id, email });

      // 자기 자신에게만 welcome_self 이벤트
      socket.emit('welcome_self');
      // 상대방에게 welcome 이벤트
      socket.to(roomName).emit('welcome');
    }
  });

  // Offer 이벤트
  socket.on('offer', (offer, roomName) => {
    socket.to(roomName).emit('offer', offer);
  });

  // Answer 이벤트
  socket.on('answer', (answer, roomName) => {
    socket.to(roomName).emit('answer', answer);
  });

  // ICE Candidate 이벤트
  socket.on('ice', (ice, roomName) => {
    socket.to(roomName).emit('ice', ice);
  });

  // 방 퇴장 로직
  socket.on('leave_room', roomName => {
    socket.leave(roomName);
    socket.to(roomName).emit('leave_room');

    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter(user => user.id !== socket.id);
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      }
    }
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
