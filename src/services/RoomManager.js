import { resolve } from 'path';
import { PassThrough } from 'stream';

class RoomManager {
  constructor() {
    this.roomAudioStreams = {}; // 방별 오디오 스트림 저장
    this.abortControllers = {}; // 방별 AbortController 저장
    this.activeSessions = {}; // 방별 활성 세션 상태 저장
    this.transcribeStopping = {}; // 중복 호출 방지 플래그
  }

  isStopping(roomName) {
    return this.transcribeStopping[roomName] === true;
  }

  setStopping(roomName) {
    this.transcribeStopping[roomName] = true;
  }

  clearStopping(roomName) {
    delete this.transcribeStopping[roomName];
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

  async removeRoom(roomName) {
    if (this.roomAudioStreams[roomName]) {
      const audioStream = this.roomAudioStreams[roomName];

      if (!audioStream.destroyed) {
        await new Promise(resolve => {
          audioStream.end(() => {
            console.log(`[RoomManager] Stream ended for room: ${roomName}`);
            resolve();
          });
        });
        audioStream.destroy();
      } else {
        console.warn(
          `[RoomManager] Stream already destroyed for room: ${roomName}`
        );
      }

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
