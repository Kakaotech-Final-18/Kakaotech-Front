import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getMedia,
  makeConnection,
  closeConnection,
} from '../services/WebrtcService';
import { useSocket } from '../context/SocketContext';

const CallScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const myVideoRef = useRef(null);
  const peerVideoRef = useRef(null);

  // react의 상태 비동기성으로 인해 usestate 대신 useRef로 바꿈
  const myStream = useRef(null);
  const myPeerConnection = useRef(null);

  const { roomName } = useParams();
  const socket = useSocket();
  const [email, setEmail] = useState(
    location.state?.email || 'callee@parrotalk.com'
  ); // 기본값 세팅

  useEffect(() => {
    console.log('Extracted email:', email);
    if (socket && socket.connected) {
      registerSocketEvents();
      handleJoinRoom();
    } else {
      console.warn('Socket is not connected. Waiting for connection...');
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        registerSocketEvents();
        handleJoinRoom();
      });
    }

    return () => {};
  }, []);

  const registerSocketEvents = () => {
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

  const handleJoinRoom = async () => {
    if (!roomName || !email || !socket) {
      alert('error occured. going back to home.');
      navigate('/call/home');
      return;
    }

    try {
      console.log('Joining room:', roomName, 'with email:', email);
      const stream = await getMedia();
      console.log('Media stream obtained:', stream);
      myStream.current = stream;

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      console.log('Initializing WebRTC connection...');
      console.log('Socket passed to makeConnection:', socket.id);
      const connection = makeConnection(socket, roomName, handleAddStream);
      if (!connection) {
        console.error(
          'makeConnection returned null. WebRTC initialization failed.'
        );
        return;
      }
      myPeerConnection.current = connection;
      console.log('Connection returned from makeConnection:', connection);
      setTimeout(() => {
        console.log('myPeerConnection after state update:', connection);
      }, 0);

      socket.emit('join_room', roomName, email, 'voice');
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleRoomNotFound = () => {
    alert('Room not found!');
  };

  const handleWelcomeSelf = async () => {
    console.log('Myself joined the room:', roomName);
    if (
      !myPeerConnection.current ||
      !(myPeerConnection.current instanceof RTCPeerConnection)
    ) {
      console.error(
        'Invalid myPeerConnection in handleWelcomeSelf:',
        myPeerConnection.current
      );
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
    if (myPeerConnection) {
      const myDataChannel = myPeerConnection.createDataChannel('chat');
      console.log('DataChannel created:', myDataChannel);
      myDataChannel.onmessage = event =>
        console.log('Received message:', event.data);
    }
  };

  const handleNotificationHi = peerEmail => {
    console.log(`${peerEmail} has joined the room.`);
    alert(`${peerEmail} has joined the room.`);
  };

  const handleOffer = async offer => {
    console.log('Offer received:', offer);
    if (myPeerConnection) {
      await myPeerConnection.setRemoteDescription(offer);
      const answer = await myPeerConnection.createAnswer();
      await myPeerConnection.setLocalDescription(answer);
      console.log('Answer created and sent:', answer);
      socket.emit('answer', answer, roomName);
    }
  };

  const handleAnswer = async answer => {
    console.log('Answer received:', answer);
    if (myPeerConnection) {
      await myPeerConnection.setRemoteDescription(answer);
    }
  };

  const handleIce = async ice => {
    console.log('ICE candidate received:', ice);
    if (myPeerConnection) {
      await myPeerConnection.addIceCandidate(ice);
    }
  };

  const handleAddStream = stream => {
    console.log('Stream added:', stream);
    if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = stream;
    }
  };

  const handleLeaveRoom = () => {
    console.log(`${email} leaves room : ${roomName}`);

    // 소켓에서 방 떠나는 이벤트 전송
    if (socket) {
      console.log('Sending leave_room event to server.');
      socket.emit('leave_room', roomName);
    } else {
      console.warn('Socket is not initialized.');
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

    // CallHome으로 이동
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
      <video ref={myVideoRef} autoPlay playsInline width="0" height="0" muted />
      <video ref={peerVideoRef} autoPlay playsInline width="0" height="0" />
      <button onClick={handleLeaveRoom}>Leave Room</button>
    </div>
  );
};

export default CallScreen;
