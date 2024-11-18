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
  myPeerConnection = new RTCPeerConnection({
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
  myPeerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      socket.emit('ice', event.candidate, roomName);
    }
  });

  myPeerConnection.addEventListener('addstream', event => {
    if (onAddStream) onAddStream(event.stream);
  });

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
