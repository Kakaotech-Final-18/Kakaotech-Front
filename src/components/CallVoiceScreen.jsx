import React, { useState, useEffect, useRef } from 'react';
import './CallVoiceScreen.css';

const CallVoiceScreen = ({ onEndCall }) => {
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="call-voice-screen">
      <div className="profile-section">
        <img
          src="/path/to/default-profile.png" // 기본 프로필 이미지
          alt="Profile"
          className="profile-image"
        />
        <p className="nickname">닉네임</p>
      </div>
      <div className="call-duration">
        <p>{formatDuration(callDuration)}</p>
      </div>
      <button className="end-call-button" onClick={onEndCall}>
        통화 종료
      </button>
    </div>
  );
};

export default CallVoiceScreen;
