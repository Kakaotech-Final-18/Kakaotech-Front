import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeSocket } from '../services/SocketService';
import { useSocket } from '../context/SocketContext';

const CallHome = () => {
  const [roomLink, setRoomLink] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const socket = useSocket();

  const handleCreateRoom = () => {
    socket.emit('create_room', roomName => {
      const link = `${window.location.origin}/call/${roomName}`;
      setRoomLink(link);
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
      <h1>Create or Join a Room</h1>
      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="button" onClick={handleCreateRoom}>
          Create Room
        </button>
        {roomLink && (
          <div>
            <p>Share this link to invite others:</p>
            <p>
              <a href={roomLink} target="_blank" rel="noopener noreferrer">
                {roomLink}
              </a>
            </p>
            <button type="button" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CallHome;
