import { MicVAD } from '@ricky0123/vad-web';

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.rmsThreshold = 0.02; // RMS 임계값
    this.vad = null;
    this.isVadReady = false;

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
      this.vad = await MicVAD.new({
        onSpeechEnd: () => console.log('[AudioProcessor] Speech Ended'),
      });
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
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  async applyVadDetection(buffer) {
    if (!this.isVadReady || !this.vad) return false;

    // VAD는 PCM Int16 데이터를 사용하므로 변환 필요
    const int16Buffer = this.convertFloat32ToInt16(buffer);
    const isSpeech = await this.vad.processAudio(int16Buffer);
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
    const input = inputs[0];
    const channelData = input ? input[0] : null; // mono channel

    if (channelData) {
      // 1. RMS 기반 필터링
      const rms = this.calculateRMS(channelData);
      if (rms > this.rmsThreshold) {
        // 2. VAD로 음성 감지
        const isSpeech = await this.applyVadDetection(channelData);

        if (isSpeech) {
          console.log('[AudioProcessor] Speech detected');
          // 3. Int16 변환 후 메인 스레드로 전송
          const int16Data = this.convertFloat32ToInt16(channelData);
          const audioChunk = new Uint8Array(int16Data.buffer);
          this.port.postMessage(audioChunk);
        } else {
          console.log('[AudioProcessor] No speech detected (filtered)');
        }
      } else {
        console.log('[AudioProcessor] Ignored low RMS data (likely noise)');
      }
    }

    return true; // 계속 처리
  }
}

registerProcessor('audio-processor', AudioProcessor);
