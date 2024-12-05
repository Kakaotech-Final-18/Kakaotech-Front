class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.model = null; // AI 모델
    this.isModelReady = false; // 모델 준비 상태

    // AI 모델 로드
    this.loadModel();

    this.port.onmessage = event => {
      if (event.data.type === 'stop') {
        this.cleanup();
      }
    };
  }

  async loadModel() {
    try {
      // TensorFlow.js 글로벌 객체 사용
      const tf = globalThis.tf;
      this.model = await tf.loadGraphModel('/path/to/model.json');
      // console.log('[AudioProcessor] AI Model loaded');
      this.isModelReady = true;
    } catch (error) {
      // console.error('[AudioProcessor] Error loading AI model:', error);
    }
  }

  cleanup() {
    // 리소스 정리
    if (this.model) {
      this.model = null;
      console.log('[AudioProcessor] AI Model cleaned up');
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input ? input[0] : null; // mono channel

    if (channelData && this.isModelReady) {
      // Float32 -> Int16 변환
      const int16Data = this.convertFloat32ToInt16(channelData);

      let filteredData;
      if (this.isModelReady) {
        // AI 모델 적용
        filteredData = this.applyAIModel(int16Data);
      } else {
        // AI 모델 없이 원본 데이터 사용
        console.warn(
          '[AudioProcessor] AI Model not ready, using raw audio data'
        );
        filteredData = int16Data; // 원본 데이터를 그대로 사용
      }

      // 필터링된 데이터를 메인 스레드로 전송
      const audioChunk = new Uint8Array(filteredData.buffer);
      if (audioChunk.byteLength > 0) {
        this.port.postMessage(audioChunk);
      } else {
        console.warn('[AudioProcessor] Generated audio chunk is empty');
      }
    } else {
      console.warn(
        '[AudioProcessor] No valid channelData received or model not ready'
      );
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

  applyAIModel(int16Buffer) {
    // Tensor로 변환
    const tensorInput = tf.tensor(
      int16Buffer,
      [1, int16Buffer.length],
      'int16'
    );

    // AI 모델에 데이터 전달 (Sync 호출)
    let outputTensor;
    try {
      outputTensor = this.model.predict(tensorInput); // 모델 예측
    } catch (error) {
      console.error('[AudioProcessor] Error in AI model prediction:', error);
      return int16Buffer; // 예측 실패 시 원본 반환
    }

    // Tensor -> Int16 변환
    const outputArray = outputTensor.dataSync();
    const filteredBuffer = new Int16Array(outputArray.length);
    for (let i = 0; i < outputArray.length; i++) {
      filteredBuffer[i] = Math.max(-1, Math.min(1, outputArray[i])) * 0x7fff;
    }

    return filteredBuffer;
  }
}

registerProcessor('audio-processor', AudioProcessor);
