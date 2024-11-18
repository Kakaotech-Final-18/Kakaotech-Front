import React, { useEffect, useRef, useState } from 'react';
import { getSocket, initializeSocket } from '../services/SocketService';
import {
  getMedia,
  makeConnection,
  closeConnection,
} from '../services/WebrtcService';

const CallScreen = ({ roomName, email }) => {
  const myVideoRef = useRef(null);
  const peerVideoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [myPeerConnection, setMyPeerConnection] = useState(null);

  useEffect(() => {
    // Socket 초기화 및 이벤트 핸들러 등록
    const socket = initializeSocket('http://localhost:3000');
    setSocket(socket);

    socket.on('welcome_self', handleWelcomeSelf);
    socket.on('welcome', handleWelcome);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice', handleIce);
    socket.on('leave_room', handleLeaveRoom);
    socket.on('room_full', handleRoomFull);

    handleJoinRoom();

    return () => {
      socket.disconnect();
      if (myPeerConnection) closeConnection();
      if (myStream) myStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleJoinRoom = async () => {
    try {
      const stream = await getMedia();
      setMyStream(stream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      const connection = makeConnection(roomName, socket, handleAddStream);
      setMyPeerConnection(connection);

      socket.emit('join_room', roomName, email, 'voice');
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleWelcomeSelf = async () => {
    console.log('Joined room successfully!');
    if (myPeerConnection) {
      // Create offer and send to peer
      const offer = await myPeerConnection.createOffer();
      await myPeerConnection.setLocalDescription(offer);
      socket.emit('offer', offer, roomName);
    }
  };

  const handleWelcome = () => {
    console.log('Peer joined the room!');
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
    console.log('Peer left the room');
    if (myPeerConnection) closeConnection();
  };

  const handleRoomFull = () => {
    alert('Room is already full!');
  };

  const handleNotificationWelcome = message => {
    alert(message);
  };

  const handleNotificationBye = message => {
    alert(message);
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
