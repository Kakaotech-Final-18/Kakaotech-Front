import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { initializeSocket } from '../services/SocketService';
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
  const [myStream, setMyStream] = useState(null);
  const [myPeerConnection, setMyPeerConnection] = useState(null);

  const { roomName } = useParams();
  const socket = useSocket();
  const [email, setEmail] = useState(
    location.state?.email || 'callee@parrotalk.com'
  ); // 기본값 세팅

  useEffect(() => {
    console.log('Extracted email:', email);

    socket.on('welcome_self', handleWelcomeSelf);
    socket.on('welcome', handleWelcome);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice', handleIce);
    socket.on('room_not_found', handleRoomNotFound);
    socket.on('peer_left', handlePeerLeft);
    socket.on('room_full', handleRoomFull);

    handleJoinRoom();

    return () => {
      if (myPeerConnection) closeConnection();
      if (myStream) myStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleJoinRoom = async () => {
    if (!socket) {
      alert('Socket is not initialized');
      navigate('/call/home');
      return;
    }
    if (!roomName) {
      alert('roomname required');
      navigate('/call/home');
      return;
    }
    if (!email) {
      setEmail('callee@parrotalk.com');
      alert('email required');
      navigate('/call/home');
      return;
    }

    try {
      const stream = await getMedia();
      setMyStream(stream);

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      const connection = makeConnection(
        stream,
        roomName,
        socket,
        handleAddStream
      );
      setMyPeerConnection(connection);

      socket.emit('join_room', roomName, email);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleRoomNotFound = () => {
    alert('Room not found!');
  };

  const handleWelcomeSelf = async () => {
    if (myPeerConnection) {
      const offer = await myPeerConnection.createOffer();
      await myPeerConnection.setLocalDescription(offer);
      socket.emit('offer', offer, roomName);
    }
  };

  const handleWelcome = peerEmail => {
    console.log(`${peerEmail} has joined the room.`);
    alert(`${peerEmail} has joined the room.`);
  };

  const handleOffer = async offer => {
    if (myPeerConnection) {
      await myPeerConnection.setRemoteDescription(offer);

      const answer = await myPeerConnection.createAnswer();
      await myPeerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, roomName);
    }
  };

  const handleAnswer = async answer => {
    if (myPeerConnection) {
      await myPeerConnection.setRemoteDescription(answer);
    }
  };

  const handleIce = async ice => {
    if (myPeerConnection) {
      await myPeerConnection.addIceCandidate(ice);
    }
  };

  const handleAddStream = stream => {
    if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = stream;
    }
  };

  const handleLeaveRoom = () => {
    // WebRTC 연결 종료
    if (myPeerConnection) {
      closeConnection();
      setMyPeerConnection(null);
    }

    // 스트림 정리
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }

    // 소켓에서 방 떠나는 이벤트 전송
    socket.emit('leave_room', roomName);

    // CallHome으로 이동
    navigate('/call/home');
  };

  const handleRoomFull = () => {
    alert('Room is already full!');
  };

  const handlePeerLeft = peerEmail => {
    alert(`${peerEmail} has left the room.`);
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
