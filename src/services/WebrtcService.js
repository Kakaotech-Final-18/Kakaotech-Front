// WebRTC 관련 로직
let myPeerConnection;
let myStream;

export const getMedia = async () => {
  const constraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(constraints);
    return myStream;
  } catch (error) {
    console.error('Error getting media:', error);
    throw error;
  }
};

export const makeConnection = (roomName, socket, onAddStream) => {
  const myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
      // TURN 서버
      {
        urls: ['turn:turn-test.ptks.link', 'turn:turn-test.ptks.link:3478'],
        username: 'ptk',
        credential: 'pass123',
      },
    ],
  });

  // ICE Candidate 이벤트 핸들러
  myPeerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      socket.emit('ice', event.candidate, roomName);
    }
  });

  // AddStream 이벤트 핸들러
  myPeerConnection.addEventListener('addstream', event => {
    if (onAddStream) onAddStream(event.stream);
  });

  // 브라우저의 카메라 및 마이크 스트림을 PeerConnection에 추가
  myStream.getTracks().forEach(track => {
    myPeerConnection.addTrack(track, myStream);
  });

  // 오디오 트랙의 bitrate 조정 (128kbps)
  const audioSender = myPeerConnection
    .getSenders()
    .find(sender => sender.track.kind === 'audio');
  if (audioSender) {
    const parameters = audioSender.getParameters();
    if (!parameters.encodings) {
      parameters.encodings = [{}]; // Encodings가 없으면 빈 배열 초기화
    }
    parameters.encodings[0].maxBitrate = 128000; // 비트레이트 제한 설정
    audioSender.setParameters(parameters);
  }

  return myPeerConnection;
};

export const addTracksToConnection = stream => {
  if (!myPeerConnection || !stream) return;
  stream.getTracks().forEach(track => myPeerConnection.addTrack(track, stream));
};

export const closeConnection = () => {
  if (myPeerConnection) {
    myPeerConnection.close();
    myPeerConnection = null;
  }
};
