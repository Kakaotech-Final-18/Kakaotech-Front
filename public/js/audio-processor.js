import { MicVAD } from '@ricky0123/vad-web';
import { targetChunkSize } from '../../src/utils/constants';

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.rmsThreshold = 0.02; // RMS 임계값
    this.vad = null;
    this.isVadReady = false;
    this.isProcessing = false; // 중복 호출 방지 플래그
    this.vadInterval = 100; // ms 단위로 VAD 호출 간격 조절
    this.lastVadCall = 0;

    // Silero VAD 초기화
    this.initializeVad();

    // 메시지 처리 (예: VAD 정지 명령)
    this.port.onmessage = event => {
      if (event.data.type === 'stop') {
        this.cleanup();
      }
    };
  }

  async initializeVad() {
    try {
      this.vad = await MicVAD.new({ baseUrl: '/' });
      console.log('[AudioProcessor] VAD initialized');
      this.isVadReady = true;
    } catch (error) {
      console.error('[AudioProcessor] Error initializing VAD:', error);
    }
  }

  cleanup() {
    if (this.vad) {
      this.vad.stop();
      this.vad = null;
      console.log('[AudioProcessor] VAD stopped and cleaned up');
    }
  }

  calculateRMS(buffer) {
    const step = 4; // 샘플링 간격
    let sum = 0;
    for (let i = 0; i < buffer.length; i += step) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / (buffer.length / step));
  }

  async applyVadDetection(buffer) {
    if (!this.isVadReady || !this.vad || this.isProcessing) return false;

    this.isProcessing = true; // VAD 호출 시작
    const int16Buffer = this.convertFloat32ToInt16(buffer);
    const isSpeech = await this.vad.processAudio(int16Buffer);
    this.isProcessing = false; // 호출 종료
    return isSpeech;
  }

  convertFloat32ToInt16(buffer) {
    const int16Buffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      int16Buffer[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
    }
    return int16Buffer;
  }

  async process(inputs, outputs, parameters) {
    const now = currentTime * 1000; // AudioWorklet의 currentTime을 ms로 변환
    if (now - this.lastVadCall < this.vadInterval) {
      return true; // VAD 호출 간격이 유지되면 처리하지 않음
    }
    this.lastVadCall = now;

    const input = inputs[0];
    const channelData = input ? input[0] : null; // mono channel

    if (channelData) {
      // RMS 값 계산 및 임계값 비교
      const rms = this.calculateRMS(channelData);

      if (rms > this.rmsThreshold) {
        // 음성 활동 감지
        const isSpeech = await this.applyVadDetection(channelData);
        if (isSpeech) {
          console.log('[AudioProcessor] Speech detected');
          // Int16 변환 후 메인 스레드로 전송
          const int16Data = this.convertFloat32ToInt16(channelData);
          const audioChunk = new Uint8Array(int16Data.buffer);
          this.port.postMessage(audioChunk);
        } else {
          console.log('[AudioProcessor] No speech detected (filtered)');
        }
      } else {
        console.log('[AudioProcessor] Ignored low RMS data (likely noise)');
        // RMS 값이 낮을 경우 빈 청크 전송
        const silentChunk = new Uint8Array(targetChunkSize); // 4KB 빈 청크
        this.port.postMessage(silentChunk);
      }
    } else {
      // 입력이 없을 경우에도 빈 청크 전송
      const silentChunk = new Uint8Array(targetChunkSize);
      this.port.postMessage(silentChunk);
    }

    return true; // 계속 처리
  }
}

registerProcessor('audio-processor', AudioProcessor);
