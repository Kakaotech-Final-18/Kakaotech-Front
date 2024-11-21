import { PassThrough } from 'stream';

class RoomManager {
  constructor() {
    this.roomAudioStreams = {}; // 방별 오디오 스트림 저장
    this.abortControllers = {}; // 방별 AbortController 저장
    this.activeSessions = {}; // 방별 활성 세션 상태 저장
  }

  addRoom(roomName) {
    if (!this.roomAudioStreams[roomName]) {
      this.roomAudioStreams[roomName] = new PassThrough();
      this.abortControllers[roomName] = new AbortController();
      this.activeSessions[roomName] = true;
      console.log(`[RoomManager] Room ${roomName} added.`);
    }
  }

  addAudioStream(roomName) {
    if (!this.roomAudioStreams[roomName]) {
      this.roomAudioStreams[roomName] = new PassThrough();
    } else {
      console.log(
        `[RoomManager] Audio stream already exists for room: ${roomName}`
      );
    }
    return this.roomAudioStreams[roomName];
  }

  removeRoom(roomName) {
    if (this.roomAudioStreams[roomName]) {
      this.roomAudioStreams[roomName].end();
      this.roomAudioStreams[roomName].destroy();
      delete this.roomAudioStreams[roomName];
    }

    if (this.abortControllers[roomName]) {
      this.abortControllers[roomName].abort();
      delete this.abortControllers[roomName];
    }

    delete this.activeSessions[roomName];
    console.log(`[RoomManager] Room ${roomName} removed.`);
  }

  getAudioStream(roomName) {
    return this.roomAudioStreams[roomName];
  }

  getAbortController(roomName) {
    return this.abortControllers[roomName];
  }

  isActive(roomName) {
    return !!this.activeSessions[roomName];
  }

  deactivateSession(roomName) {
    this.activeSessions[roomName] = false;
    console.log(`[RoomManager] Room ${roomName} deactivated.`);
  }
}

export default RoomManager;
