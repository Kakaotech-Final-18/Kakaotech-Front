import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeSocket } from '../services/SocketService';

const CallHome = () => {
  const [roomLink, setRoomLink] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const socket = initializeSocket();

  const handleCreateRoom = () => {
    socket.emit('create_room', roomName => {
      const link = `${window.location.origin}/call/${roomName}`;
      setRoomLink(link);
    });
  };

  const handleJoinRoom = () => {
    if (!email.trim()) {
      alert('Please enter your email.');
      return;
    }
    if (roomLink) {
      const roomName = roomLink.split('/').pop(); // Extract roomName from URL
      navigate(`/call/${roomName}?email=${encodeURIComponent(email)}`); // 이메일 전달
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
