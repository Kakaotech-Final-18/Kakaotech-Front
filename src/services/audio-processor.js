class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input[0]; // mono channel

    if (channelData) {
      const int16Data = this.convertFloat32ToInt16(channelData);
      const audioChunk = new Uint8Array(int16Data.buffer);
      this.port.postMessage(audioChunk); // 메인 스레드로 전송
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
