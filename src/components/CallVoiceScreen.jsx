import React, { useState, useEffect, useRef } from 'react';
import DefaultProfile from '../assets/default-profile.svg';
import EndCallIcon from '../assets/decline-button.svg';
import './CallVoiceScreen.css';

const CallVoiceScreen = ({ onEndCall }) => {
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // 타이머 시작
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // 컴포넌트 언마운트 시 타이머 정리
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
      <div className="call-voice-content">
        {/* 프로필 섹션 */}
        <div className="call-voice-profile-section">
          <img
            src={DefaultProfile}
            alt="Profile"
            className="call-voice-profile-image"
          />
          <p className="call-voice-nickname">닉네임</p>
        </div>
        {/* 타이머 */}
        <div className="call-duration">
          <p>{formatDuration(callDuration)}</p>
        </div>
        {/* 통화 종료 버튼 */}
        <button className="end-call-button" onClick={onEndCall}>
          <img src={EndCallIcon} alt="End Call" />
        </button>
      </div>
    </div>
  );
};

export default CallVoiceScreen;
