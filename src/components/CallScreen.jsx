import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMedia, makeConnection } from '../services/WebrtcService';
import { useSocket } from '../context/SocketContext';
import ChatBox from './ChatBox';

const CallScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const myVideoRef = useRef(null);
  const peerVideoRef = useRef(null);

  const myStream = useRef(null);
  const myPeerConnection = useRef(null);
  const myDataChannel = useRef(null);

  const { roomName } = useParams();
  const socket = useSocket();

  const [email, setEmail] = useState(
    location.state?.email || 'callee@parrotalk.com'
  );
  const [screenType, setScreenType] = useState(null);
  const [isSelectionLocked, setSelectionLocked] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    console.log('Extracted email:', email);

    const initialize = async () => {
      if (socket && socket.connected) {
        registerSocketEvents();
      } else {
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          registerSocketEvents();
        });
      }
    };

    initialize();

    return () => {};
  }, []);

  const cleanupSocketEvents = () => {
    socket.off('welcome_self');
    socket.off('welcome');
    socket.off('notification_hi');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice');
    socket.off('room_not_found');
    socket.off('peer_left');
    socket.off('room_full');
  };

  const registerSocketEvents = () => {
    cleanupSocketEvents();
    socket.on('welcome_self', handleWelcomeSelf);
    socket.on('welcome', handleWelcome);
    socket.on('notification_hi', handleNotificationHi);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice', handleIce);
    socket.on('room_not_found', handleRoomNotFound);
    socket.on('peer_left', handlePeerLeft);
    socket.on('room_full', handleRoomFull);
    console.log('Socket events registered.');
  };

  const handleStartCall = async () => {
    if (!roomName || !email || !socket) {
      alert('error occured. going back to home.');
      navigate('/call/home');
      return;
    }

    setSelectionLocked(true);

    try {
      console.log('Joining room:', roomName, 'with email:', email);
      const stream = await getMedia();
      console.log('Media stream obtained:', stream);
      myStream.current = stream;

      if (myVideoRef.current) {
        console.log('myStream added.');
        myVideoRef.current.srcObject = stream;
      }

      console.log('Initializing WebRTC connection...');
      if (!myPeerConnection.current) {
        myPeerConnection.current = makeConnection(
          socket,
          roomName,
          handleAddStream
        );
      }
      console.log('PeerConnection initialized:', myPeerConnection.current);

      if (screenType === 'chat') {
        // With Chat 모드에서 DataChannel 생성
        myDataChannel.current =
          myPeerConnection.current.createDataChannel('chat');
        myDataChannel.current.onmessage = handleReceiveMessage;
        console.log('DataChannel created for chat');
      }

      socket.emit('join_room', roomName, email, screenType);
    } catch (error) {
      console.error('Error during call setup:', error);
    }
  };

  const handleRoomNotFound = () => {
    alert('Room not found!');
    navigate('/call/home');
  };

  const handleWelcomeSelf = async () => {
    console.log('Myself joined the room:', roomName);
    if (!myPeerConnection.current) {
      console.error('PeerConnection is not initialized in handleWelcomeSelf.');
      return;
    }

    try {
      const offer = await myPeerConnection.current.createOffer();
      console.log('Offer created:', offer);

      await myPeerConnection.current.setLocalDescription(offer);
      console.log(
        'LocalDescription set:',
        myPeerConnection.current.localDescription
      );

      socket.emit('offer', offer, roomName);
      console.log('Offer sent to room:', roomName);
    } catch (error) {
      console.error('Error during offer creation or sending:', error);
    }
  };

  const handleWelcome = () => {
    console.log('Peer joined the room:', roomName);
    myPeerConnection.current.ondatachannel = event => {
      myDataChannel.current = event.channel;
      myDataChannel.current.onmessage = handleReceiveMessage;
      console.log('DataChannel received from peer');
    };
  };

  const handleReceiveMessage = event => {
    console.log('Message received:', event.data);
    setChatMessages(prev => [
      ...prev,
      { type: 'peer_message', content: event.data },
    ]);
  };

  const handleSendMessage = message => {
    if (myDataChannel.current && myDataChannel.current.readyState === 'open') {
      myDataChannel.current.send(message);
      setChatMessages(prev => [
        ...prev,
        { type: 'my_message', content: message },
      ]);
    } else {
      console.warn('DataChannel is not open');
    }
  };

  const handleNotificationHi = peerEmail => {
    console.log(`${peerEmail} has joined the room.`);
    alert(`${peerEmail} has joined the room.`);
  };

  const handleOffer = async offer => {
    console.log('Offer received:', offer);

    if (!myPeerConnection.current) {
      myPeerConnection.current = makeConnection(
        socket,
        roomName,
        handleAddStream
      );
    }

    try {
      await myPeerConnection.current.setRemoteDescription(offer);
      const answer = await myPeerConnection.current.createAnswer();
      await myPeerConnection.current.setLocalDescription(answer);
      console.log('Answer created and set as local description:', answer);
      socket.emit('answer', answer, roomName);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async answer => {
    console.log('Answer received:', answer);
    if (!myPeerConnection.current) {
      console.error('PeerConnection is not initialized in handleAnswer.');
      return;
    }
    try {
      await myPeerConnection.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleIce = async ice => {
    console.log('ICE candidate received:', ice);
    if (!myPeerConnection.current) {
      console.error('PeerConnection is not initialized in handleIce.');
      return;
    }

    try {
      await myPeerConnection.current.addIceCandidate(ice);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleAddStream = async stream => {
    console.log('Stream added:', stream);

    if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = stream;
    }

    const audioContext = new AudioContext();

    await audioContext.audioWorklet.addModule('/audio-processor.js');
    console.log('Audio Worklet Module loaded');

    const source = audioContext.createMediaStreamSource(stream);
    const processor = new AudioWorkletNode(audioContext, 'audio-processor');

    processor.port.onmessage = event => {
      const audioChunk = event.data;
      console.log('Audio chunk received:', audioChunk);

      if (screenType === 'chat') {
        socket.emit('audio_chunk', audioChunk, roomName);
      }
    };

    source.connect(processor);
    console.log('AudioProcessor connected to MediaStreamSource');
  };

  const handleLeaveRoom = () => {
    console.log(`${email} leaves room : ${roomName}`);

    // WebRTC 연결 종료
    if (myPeerConnection.current) {
      console.log('Closing peer connection...');
      try {
        myPeerConnection.current.close();
        myPeerConnection.current = null;
        console.log('PeerConnection closed and cleared.');
      } catch (error) {
        console.error('Error closing PeerConnection:', error);
      }
    } else {
      console.warn('myPeerConnection.current is already null or undefined.');
    }

    // 스트림 정리
    if (myStream.current && myStream.current instanceof MediaStream) {
      console.log('Stopping media stream tracks...');
      try {
        myStream.current.getTracks().forEach(track => track.stop());
        console.log('Media stream tracks stopped.');
      } catch (error) {
        console.error('Error stopping media stream tracks:', error);
      }
      myStream.current = null;
      console.log('Media stream stopped and cleared.');
    } else {
      console.warn(
        'myStream.current is not a valid MediaStream or already cleared:',
        myStream.current
      );
    }

    // 소켓에서 방 떠나는 이벤트 전송
    if (socket) {
      console.log('Sending leave_room event to server.');
      socket.emit('leave_room', roomName);

      // Transcribe 종료
      if (screenType === 'chat') {
        console.log('Ending Transcribe session for room:', roomName);
        socket.emit('stop_transcribe', roomName); // 서버에서 Transcribe 종료
      }
    } else {
      console.warn('Socket is not initialized.');
    }

    navigate('/call/home');
  };

  const handleRoomFull = () => {
    alert('Room is already full!');
  };

  const handlePeerLeft = peerEmail => {
    alert(`${peerEmail} has left the room.`);
    alert('press ok to end call.');
    handleLeaveRoom();
  };

  return (
    <div id="call">
      {!isSelectionLocked ? (
        <div id="selection">
          <h2>Select Call Mode</h2>
          <label>
            <input
              type="radio"
              name="screenType"
              value="voice"
              onChange={() => setScreenType('voice')}
            />
            Voice Only
          </label>
          <label>
            <input
              type="radio"
              name="screenType"
              value="chat"
              onChange={() => setScreenType('chat')}
            />
            With Chat
          </label>
          <button disabled={!screenType} onClick={handleStartCall}>
            Confirm
          </button>
        </div>
      ) : (
        <>
          {screenType === 'chat' && (
            <div id="chatBox">
              <ChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            width="0"
            height="0"
            muted
          />
          <video ref={peerVideoRef} autoPlay playsInline width="0" height="0" />
          <button onClick={handleLeaveRoom}>Leave Room</button>
        </>
      )}
    </div>
  );
};

export default CallScreen;
