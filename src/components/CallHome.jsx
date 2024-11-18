import React, { useState } from 'react';
import CallScreen from './CallScreen';

const CallHome = () => {
  const [roomName, setRoomName] = useState('');
  const [email, setEmail] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (roomName.trim() && email.trim()) {
      setIsInRoom(true);
    } else {
      alert('Please enter a valid room name and email.');
    }
  };

  if (isInRoom) {
    return <CallScreen roomName={roomName} email={email} />;
  }

  return (
    <div>
      <h1>Join a Room</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default Home;
