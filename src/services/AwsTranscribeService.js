import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import { PassThrough } from 'stream';
import axios from 'axios';

export const MediaSampleRateHertz = 48000;
export const targetChunkSize = 4096; // 4KB
export const chunkInterval = 125; // 0.125초
export const emptyChunkInterval = 14000; // 빈 청크 전송 주기 (14초)

class AwsTranscribeService {
  constructor(region, accessKeyId, secretAccessKey) {
    this.client = new TranscribeStreamingClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.roomAudioStreams = {}; // 방별 오디오 스트림 저장
    this.abortControllers = {}; // 방별 AbortController 저장
  }

  async *convertToAsyncIterable(stream) {
    const reader = stream[Symbol.asyncIterator]
      ? stream[Symbol.asyncIterator]()
      : stream.on('data', chunk => chunk);

    for await (const chunk of reader) {
      yield chunk;
    }
  }

  startTranscribe(roomName, wsServer) {
    if (typeof roomName !== 'string') {
      console.log(
        '[Transcribe] Room name type is incorrect in startTranscribe'
      );
      return;
    }

    console.log(`[Transcribe] Starting session for room: ${roomName}`);

    this.abortControllers[roomName] = new AbortController(); // AbortController 생성
    const audioStream = this.roomAudioStreams[roomName];

    const params = {
      LanguageCode: 'ko-KR',
      MediaEncoding: 'pcm',
      MediaSampleRateHertz,
      AudioStream: async function* () {
        let buffer = Buffer.alloc(0);
        let lastAudioChunkTime = Date.now();

        for await (const chunk of this.convertToAsyncIterable(audioStream)) {
          buffer = Buffer.concat([buffer, chunk]);
          lastAudioChunkTime = Date.now(); // 마지막 청크 전송 시간 갱신

          while (buffer.length >= targetChunkSize) {
            const chunkToSend = buffer.subarray(0, targetChunkSize);
            buffer = buffer.subarray(targetChunkSize);
            yield { AudioEvent: { AudioChunk: chunkToSend } };
          }

          // 0.125초 대기
          await new Promise(resolve => setTimeout(resolve, chunkInterval));
        }

        if (Date.now() - lastAudioChunkTime >= emptyChunkInterval) {
          console.log(
            `[Transcribe] Sending empty audio chunk for room: ${roomName}`
          );
          yield { AudioEvent: { AudioChunk: Buffer.alloc(targetChunkSize) } };
          lastAudioChunkTime = Date.now();
        }
      }.bind(this),
    };

    const command = new StartStreamTranscriptionCommand(params);

    (async () => {
      try {
        const response = await this.client.send(command, {
          signal: this.abortControllers[roomName].signal,
        });

        for await (const event of response.TranscriptResultStream) {
          const transcriptEvent = event.TranscriptEvent;

          if (transcriptEvent && transcriptEvent.Transcript) {
            const results = transcriptEvent.Transcript.Results;

            results.forEach(result => {
              if (!result.IsPartial) {
                const transcript = result.Alternatives[0].Transcript;

                console.log(
                  `[Transcribe] Final Transcript for room ${roomName}: ${transcript}`
                );

                // 추천 문장 요청
                axios
                  .post('http://52.79.189.35:8000/recommendations', {
                    room_number: roomName,
                    sentence: transcript,
                  })
                  .then(response => {
                    const recommendations = response.data.recommendations;
                    wsServer
                      .to(roomName)
                      .emit('recommendations', recommendations);
                  })
                  .catch(error => {
                    console.error(
                      `[AI Server] Error fetching recommendations: ${error.message}`
                    );
                  });

                wsServer.to(roomName).emit('transcript', transcript);
              }
            });
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`[Transcribe] Session aborted for room: ${roomName}`);
        } else {
          console.error(`[Transcribe] Error for room ${roomName}:`, error);
        }
      } finally {
        console.log(`[Transcribe] Ending session for room: ${roomName}`);
        this.stopTranscribe(roomName);
      }
    })();
  }

  stopTranscribe(roomName) {
    if (this.roomAudioStreams[roomName]) {
      this.roomAudioStreams[roomName].end();
      this.roomAudioStreams[roomName].destroy();
    }

    if (this.abortControllers[roomName]) {
      this.abortControllers[roomName].abort();
      delete this.abortControllers[roomName];
    }

    delete this.roomAudioStreams[roomName];
  }

  addAudioStream(roomName) {
    if (!this.roomAudioStreams[roomName]) {
      this.roomAudioStreams[roomName] = new PassThrough();
    }
    return this.roomAudioStreams[roomName];
  }
}

export default AwsTranscribeService;
