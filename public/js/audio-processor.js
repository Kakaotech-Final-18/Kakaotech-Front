class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input ? input[0] : null; // mono channel

    if (channelData) {
      console.log(
        '[AudioProcessor] Valid channelData received, length:',
        channelData.length
      );
      const int16Data = this.convertFloat32ToInt16(channelData);
      const audioChunk = new Uint8Array(int16Data.buffer);
      if (audioChunk.byteLength > 0) {
        this.port.postMessage(audioChunk); // 메인 스레드로 전송
        console.log(
          '[AudioProcessor] Audio chunk sent to main thread, size:',
          audioChunk.byteLength
        );
      } else {
        console.warn('[AudioProcessor] Generated audio chunk is empty');
      }
    } else {
      console.warn('[AudioProcessor] No valid channelData received');
    }
    return true; // 계속 처리
  }

  convertFloat32ToInt16(buffer) {
    const int16Buffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      int16Buffer[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff; // 범위 제한 후 변환
    }
    return int16Buffer;
  }
}

registerProcessor('audio-processor', AudioProcessor);
