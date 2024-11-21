import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import axios from 'axios';
import {
  MediaSampleRateHertz,
  targetChunkSize,
  chunkInterval,
  emptyChunkInterval,
} from '../utils/constants.js';

class AwsTranscribeService {
  constructor(region, accessKeyId, secretAccessKey, roomManager) {
    this.client = new TranscribeStreamingClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.roomManager = roomManager; // RoomManager 의존성 주입
  }
  async startTranscribe(roomName, wsServer) {
    if (!this.roomManager.isActive(roomName)) {
      console.log(`[Transcribe] Room ${roomName} is not active.`);
      return;
    }

    console.log(`[Transcribe] Starting session for room: ${roomName}`);

    const audioStream = this.roomManager.getAudioStream(roomName);
    const abortController = this.roomManager.getAbortController(roomName);

    const params = {
      LanguageCode: 'ko-KR',
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 48000,
      AudioStream: this.createAsyncIterator(audioStream),
    };

    const command = new StartStreamTranscriptionCommand(params);

    try {
      const response = await this.client.send(command, {
        signal: abortController.signal,
      });

      for await (const event of response.TranscriptResultStream) {
        const results = event.TranscriptEvent?.Transcript?.Results || [];
        results.forEach(result => {
          if (!result.IsPartial) {
            const transcript = result.Alternatives[0]?.Transcript || '';
            console.log(
              `[Transcribe] Final Transcript for room ${roomName}: ${transcript}`
            );
            wsServer.to(roomName).emit('transcript', transcript);

            axios
              .post('http://52.79.189.35:8000/recommendations', {
                room_number: roomName,
                sentence: transcript,
              })
              .then(response => {
                const recommendations = response.data.recommendations;
                wsServer.to(roomName).emit('recommendations', recommendations);
              })
              .catch(error => {
                console.error(
                  `[AI Server] Error fetching recommendations: ${error.message}`
                );
              });
          }
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[Transcribe] Session aborted for room: ${roomName}`);
      } else {
        console.error(`[Transcribe] Error for room ${roomName}:`, error);
      }
    } finally {
      console.log(`[Transcribe] Ending session for room: ${roomName}`);
      this.roomManager.deactivateSession(roomName);
      this.roomManager.removeRoom(roomName);
    }
  }

  // PassThrough를 async iterable로 변환
  createAsyncIterator(stream) {
    const reader = stream[Symbol.asyncIterator]
      ? stream[Symbol.asyncIterator]()
      : this.convertToAsyncIterable(stream);

    return (async function* () {
      for await (const chunk of reader) {
        yield { AudioEvent: { AudioChunk: chunk } };
      }
    })();
  }

  // ReadableStream을 async iterable로 변환
  convertToAsyncIterable(stream) {
    return {
      async next() {
        return new Promise((resolve, reject) => {
          stream.once('data', chunk => resolve({ value: chunk, done: false }));
          stream.once('end', () => resolve({ done: true }));
          stream.once('error', err => reject(err));
        });
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  stopTranscribe(roomName) {
    this.roomManager.deactivateSession(roomName); // 세션 비활성화
    this.roomManager.removeRoom(roomName); // 방 제거
  }
}

export default AwsTranscribeService;
