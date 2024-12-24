import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import AwsTranscribeService from './src/services/AwsTranscribeService.js';
import RoomManager from './src/services/RoomManager.js';
import dotenv from 'dotenv';
import axios from 'axios';

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
const buildPath = process.env.BUILD_PATH || path.join(__dirname, 'dist');

// React 정적 파일 제공
app.use(express.static(buildPath));

// React 라우터를 위한 기본 라우트 설정
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    //origin: process.env.VITE_SOCKET_URL || 'http://localhost:3000', // Vite 개발 서버 주소
    //origin: process.env.VITE_SOCKET_URL || 'https://ptks.link',
    origin: '*',
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
  socket.on(
    'join_room',
    (roomName, email, nickname, profileImage, screenType) => {
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
        rooms[roomName].push({
          id: socket.id,
          email,
          nickname,
          profileImage,
          screenType,
        });

        // RoomManager에 방 추가 및 Transcribe 관련 설정
        if (!roomManager.isActive(roomName)) {
          roomManager.addRoom(roomName); // Audio Stream 및 AbortController 초기화
        }

        // 자기 자신에게만 welcome_self 이벤트
        socket.emit('welcome_self');
        // 상대방에게 welcome 이벤트
        socket.to(roomName).emit('welcome');
        socket.to(roomName).emit('notification_hi', email);

        // 상대방에게 다른 사람의 정보 전달
        const otherUsers = rooms[roomName].filter(
          user => user.id !== socket.id
        );
        if (otherUsers.length > 0) {
          socket.emit(
            'another_user',
            otherUsers.map(user => ({
              nickname: user.nickname, // 닉네임 예시
              profileImage: user.profileImage,
            }))
          );
        }

        // With Chat 모드인 참여자가 있는지 확인
        const chatUser = rooms[roomName].find(
          user => user.screenType === 'chat'
        );
        const voiceUser = rooms[roomName].find(
          user => user.screenType === 'voice'
        );

        // 채팅 유저와 음성 유저가 모두 있을 때 Transcribe 시작
        if (chatUser && voiceUser) {
          const audioStream = roomManager.addAudioStream(roomName);
          if (audioStream) {
            console.log(
              `[Transcribe] Starting Transcribe for room: ${roomName}`
            );
            transcribeService.startTranscribe(roomName, wsServer);
          } else {
            console.error(
              `[Error] Failed to add audio stream for room: ${roomName}`
            );
          }
        }
      }
    }
  );

  const handleAudioChunk = (chunk, roomName) => {
    const audioStream = roomManager.getAudioStream(roomName);

    if (!audioStream || audioStream.destroyed || audioStream.writableEnded) {
      console.warn(
        `[Audio] Attempted to write to a closed stream for room: ${roomName}`
      );
      return;
    }

    try {
      audioStream.write(chunk);
    } catch {
      console.error('[Server] No active stream for room:', roomName);
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

  // 클라이언트로부터 AI 요약 요청 수신
  socket.on('request_ai_summary', async ({ roomName, combinedContent }) => {
    console.log(`[AI Summary] 요청 수신: Room - ${roomName}`);

    // 타이머 설정 (예: 5초)
    const TIMEOUT_MS = 5000;

    // 타이머를 생성하는 함수
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: false, todo: [] }); // 타이머 완료 시 빈 배열 반환
      }, TIMEOUT_MS);
    });

    try {
      // AI 서버 요청 및 타이머 경쟁
      const response = await Promise.race([
        axios.post(process.env.AI_SUMMARY, {
          room_number: roomName,
          sentence: combinedContent,
        }),
        timeoutPromise,
      ]);

      // 응답 처리
      if (response.success === false) {
        console.warn(`[AI Summary] 타임아웃 발생: Room - ${roomName}`);
        rooms[`${roomName}_todo`] = [];
        socket.emit('ai_summary_response', { success: true, todo: [] });
      } else {
        const { todo } = response.data;
        rooms[`${roomName}_todo`] = todo; // 요약 결과 저장
        console.log(`[AI Summary] 요약 결과 저장 완료: Room - ${roomName}`);
        socket.emit('ai_summary_response', { success: true, todo });
      }
    } catch (error) {
      console.error('[AI Summary] 요청 실패:', error.message);

      // 에러 발생 시 빈 배열 저장
      rooms[`${roomName}_todo`] = [];
      socket.emit('ai_summary_response', {
        success: false,
        message: error.message,
      });
    }
  });

  // Todo 데이터 요청 처리
  socket.on('fetch_todo', (roomName, callback) => {
    const todo = rooms[`${roomName}_todo`];
    console.log('[fetch_todo] ', todo);
    if (todo) {
      callback({ success: true, todo });
    } else {
      callback({ success: false, message: 'No todo found for this room.' });
    }
  });

  // 방 퇴장 로직
  socket.on('leave_room', async data => {
    const { roomName } = data;

    socket.off('audio_chunk', handleAudioChunk);
    console.log(`[Audio] audio_chunk listener removed for room: ${roomName}`);

    const userIndex = rooms[roomName]?.findIndex(user => user.id === socket.id);
    if (userIndex !== -1) {
      const userEmail = rooms[roomName][userIndex]?.email;
      rooms[roomName].splice(userIndex, 1);
      socket.to(roomName).emit('peer_left', userEmail); // 다른 사용자가 나감을 알림
      console.log(`${userEmail} has left the room: ${roomName}`);
    }

    socket.leave(roomName);

    const userCount = wsServer.sockets.adapter.rooms.get(roomName)?.size || 0;
    if (userCount === 0) {
      console.log(`[Room] Last user left. Cleaning up room: ${roomName}`);
      // setImmediate를 사용해서 방 삭제와 관련된 작업을 이벤트 루프의 다음 사이클로 지연
      setImmediate(async () => {
        // 중복 처리를 방지하기 위해 RoomManager에서 플래그 확인 및 설정
        if (roomManager.isStopping(roomName)) {
          console.log(
            `[Transcribe] Stop already in progress for room: ${roomName}`
          );
          return; // 중복 요청 방지
        }

        roomManager.setStopping(roomName); // 플래그 설정

        try {
          await transcribeService.stopTranscribe(roomName); // Transcribe 종료
          console.log(
            `[Transcribe] Stopped successfully for room: ${roomName}`
          );
        } catch (error) {
          console.error(`[Transcribe] Error during stop: ${error}`);
        } finally {
          // 플래그 해제
          roomManager.clearStopping(roomName);
        }

        // 방 정보 정리
        roomManager.removeRoom(roomName);
        delete rooms[roomName];
        console.log(`[Room] Room ${roomName} has been cleaned up.`);
      });
    }
  });

  socket.on('stop_transcribe', async roomName => {
    // 방이 활성 상탱인지 검증
    if (!roomManager.isActive(roomName)) {
      console.warn(
        `[Transcribe] Room ${roomName} is not active. Ignoring stop request.`
      );
      return;
    }

    // isStopping 플래그로 Transcribe 세션 종료가 진행 중이면 중복 처리 방지
    if (roomManager.isStopping(roomName)) {
      console.warn(
        `[Transcribe] Stop already in progress for room: ${roomName}`
      );
      return;
    }

    const audioStream = roomManager.getAudioStream(roomName);
    if (!audioStream) {
      console.error(
        `[Transcribe] No active audio stream found for room: ${roomName}`
      );
      return;
    }

    console.log(`[Transcribe] Manual stop request for room: ${roomName}`);

    try {
      await transcribeService.stopTranscribe(roomName); // Transcribe 세션 종료
      console.log(`[Transcribe] Audio stream ended for room: ${roomName}`);
    } catch (error) {
      console.error(`[Transcribe] Error during manual stop: ${error}`);
    }
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // socket.id로 사용자가 속한 방 찾기
    const userRoomName = Object.keys(rooms).find(roomName =>
      rooms[roomName].some(user => user.id === socket.id)
    );

    if (userRoomName) {
      console.log(`User was in room: ${userRoomName}`);
      const userIndex = rooms[userRoomName]?.findIndex(
        user => user.id === socket.id
      );

      if (userIndex !== -1) {
        const userEmail = rooms[userRoomName][userIndex].email;
        rooms[userRoomName].splice(userIndex, 1); // 유저 정보 제거

        // 방 정리
        const userCount =
          wsServer.sockets.adapter.rooms.get(userRoomName)?.size || 0;
        if (userCount === 0) {
          console.log(
            `[Room] Last user left. Cleaning up room: ${userRoomName}`
          );
          roomManager.removeRoom(userRoomName); // RoomManager 정리 호출
          delete rooms[userRoomName]; // 방 제거
        } else {
          // 상대방에게 알림
          socket.to(userRoomName).emit('peer_left', userEmail);
        }
      }
    }
  });

  socket.on('request_tts', async (text, roomName) => {
    try {
      // 요청 데이터 설정
      const requestData = {
        text: text,
        room_number: roomName,
        voice_type: 'female2',
      };

      // TTS 서버로 POST 요청 전송
      const response = await axios.post(process.env.AI_TTS, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 요청한 클라이언트에게 응답 데이터 전달
      socket.emit('tts_response', {
        success: true,
        data: response.data['audio_base64'],
      });
    } catch (error) {
      // 에러 처리
      console.error('TTS 요청 실패:', error.message);

      // 요청한 클라이언트에게 에러 전달
      socket.emit('tts_response', { success: false, error: error.message });
    }
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
