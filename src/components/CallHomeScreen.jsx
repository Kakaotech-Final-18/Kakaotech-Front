import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import { useSocket } from '../context/SocketContext';

const CallHomeScreen = () => {
  const [roomLink, setRoomLink] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const socket = useSocket();

  const handleCreateRoom = () => {
    socket.emit('create_room', roomName => {
      const link = `${window.location.origin}/call/${roomName}`;
      setRoomLink(link);
      console.log('Room created with link:', link);
    });
  };

  // TODO : 나중에 로그인 추가되면 이메일 관련 고치기
  const handleJoinRoom = () => {
    if (!email.trim()) {
      alert('Please enter your email.');
      return;
    }
    if (roomLink) {
      const roomName = roomLink.split('/').pop();
      console.log(`browser: email -> ${email}, socket -> ${socket}`);
      navigate(`/call/${roomName}`, {
        state: { email },
      });
    }
  };

  return (
    <div>
      <h1>앵무말 통화 시작하기</h1>
      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="button" onClick={handleCreateRoom}>
          통화 방 생성
        </button>
        {roomLink && (
          <div>
            <p>카카오톡 친구에게 통화방을 공유해 보세요!</p>
            <p>{roomLink}</p>
            <ShareButton roomLink={roomLink} />
            <button type="button" onClick={handleJoinRoom}>
              방 입장하기
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CallHomeScreen;
