import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import AwsTranscribeService from './src/services/AwsTranscribeService.js';
import RoomManager from './src/services/RoomManager.js';
import dotenv from 'dotenv';

dotenv.config();
const roomManager = new RoomManager();

const transcribeService = new AwsTranscribeService(
  process.env.AWS_REGION,
  process.env.AWS_ACCESS_ID,
  process.env.AWS_SECRET_ID,
  roomManager
);

const app = express();

// 경로 설정 (현재 디렉토리 기준으로 dist 폴더 사용)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, 'dist');

// React 정적 파일 제공
app.use(express.static(buildPath));

// React 라우터를 위한 기본 라우트 설정
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: process.env.VITE_SOCKET_URL || 'http://localhost:3000', // Vite 개발 서버 주소
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const rooms = {}; // 방 정보를 저장

wsServer.on('connection', socket => {
  console.log('New user connected:', socket.id);

  // 방 생성 이벤트 처리
  socket.on('create_room', callback => {
    const roomName = uuidv4().slice(0, 16); // 16자리 UUID 생성
    rooms[roomName] = []; // 방 생성
    console.log(`Room created: ${roomName}`);
    callback(roomName); // 생성된 방 이름을 클라이언트로 전달
  });

  // 방 참여 로직
  socket.on('join_room', (roomName, email, screenType) => {
    console.log(`roomname : ${roomName}`);
    console.log(`${email} joined room: ${roomName}`);
    const room = wsServer.sockets.adapter.rooms.get(roomName);
    const userCount = room ? room.size : 0;

    if (userCount >= 2) {
      socket.emit('room_full');
    } else {
      socket.join(roomName);
      console.log(`${email} joined room: ${roomName} as ${screenType}`);

      // rooms 객체에 email과 socket.id 저장
      if (!rooms[roomName]) rooms[roomName] = [];
      rooms[roomName].push({ id: socket.id, email });

      // RoomManager에 방 추가 및 Transcribe 관련 설정
      if (!roomManager.isActive(roomName)) {
        roomManager.addRoom(roomName); // Audio Stream 및 AbortController 초기화
      }

      // 자기 자신에게만 welcome_self 이벤트
      socket.emit('welcome_self');
      // 상대방에게 welcome 이벤트
      socket.to(roomName).emit('welcome');
      socket.to(roomName).emit('notification_hi', email);

      // With Chat 모드일 경우 Transcribe 시작
      if (screenType === 'chat') {
        const audioStream = roomManager.addAudioStream(roomName);
        if (audioStream) {
          transcribeService.startTranscribe(roomName, wsServer);
        } else {
          console.error(
            `[Error] Failed to add audio stream for room: ${roomName}`
          );
        }
      }
    }
  });

  // 리스너를 변수로 할당해, 동일 참조를 사용해 제거할 수 있도록 수정
  const handleAudioChunk = (chunk, roomName) => {
    const audioStream = roomManager.getAudioStream(roomName);
    if (audioStream) {
      audioStream.write(chunk);
    }
  };

  // Audio chunk 이벤트 등록
  socket.on('audio_chunk', handleAudioChunk);

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
    console.log(`User ${socket.id} is leaving room: ${roomName}`);

    socket.off('audio_chunk', handleAudioChunk);
    console.log(`[Audio] audio_chunk listener removed for room: ${roomName}`);

    const userIndex = rooms[roomName]?.findIndex(user => user.id === socket.id);
    if (userIndex !== -1) {
      const userEmail = rooms[roomName][userIndex].email;
      rooms[roomName].splice(userIndex, 1);
      socket.to(roomName).emit('peer_left', userEmail);
      console.log(`${userEmail} has left the room: ${roomName}`);
    }

    socket.leave(roomName);

    const userCount = wsServer.sockets.adapter.rooms.get(roomName)?.size || 0;
    if (userCount === 0) {
      console.log(`[Room] Last user left. Cleaning up room: ${roomName}`);
      transcribeService.stopTranscribe(roomName); // AWS Transcribe 및 스트림 종료
      roomManager.removeRoom(roomName);
      delete rooms[roomName];
    }
  });

  socket.on('stop_transcribe', roomName => {
    const audioStream = roomManager.getAudioStream(roomName);
    if (audioStream) {
      console.log(`[Transcribe] Manual stop request for room: ${roomName}`);
      transcribeService.stopTranscribe(roomName); // Transcribe 세션 종료
    } else {
      console.error(
        `[Transcribe] No active stream found for room: ${roomName}`
      );
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
