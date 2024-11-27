import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import { useSocket } from '../context/SocketContext';
import PhoneIcon from '../assets/phone-icon.svg';
import DefaultProfile from '../assets/default-profile.svg';
import './CallHomeScreen.css';

const CallHomeScreen = () => {
  const [roomLink, setRoomLink] = useState('');
  const [email, setEmail] = useState('');
  const [createButtonText, setCreateButtonText] = useState('방 생성');
  const navigate = useNavigate();
  const socket = useSocket();

  // 로그인 추가되면 이거 지울 것
  useEffect(() => {
    // 더미 이메일 값 설정
    setEmail('caller@test.com');
  }, []);

  const handleCreateRoom = () => {
    socket.emit('create_room', roomName => {
      const link = `${window.location.origin}/call/${roomName}`;
      setRoomLink(link);
      console.log('Room created with link:', link);
      setCreateButtonText('방 생성 완료!');
    });
  };

  // TODO : 나중에 로그인 추가되면 이메일 관련 고치기
  const handleJoinRoom = () => {
    if (roomLink) {
      const roomName = roomLink.split('/').pop();
      console.log(`browser: email -> ${email}, socket -> ${socket}`);
      navigate(`/call/${roomName}`, {
        // 더미 이메일 전달 : 로그인 추가되면 여기 고치기
        state: { email },
      });
    }
  };

  return (
    <div className="call-home-container">
      {/* 프로필 섹션 */}
      <div className="profile-section">
        <img
          src={DefaultProfile}
          alt="Default Profile"
          className="profile-picture"
        />
        <div className="profile-info">
          <span className="nickname">닉네임</span>
          <button
            type="button"
            className="create-room-button"
            onClick={handleCreateRoom}
          >
            <img src={PhoneIcon} alt="Phone Icon" className="phone-icon" />
            {createButtonText}
          </button>
        </div>
      </div>

      {/* 통화 코드 컨테이너 */}
      {roomLink && (
        <div className="room-link-container">
          <p className="room-link-title">통화 코드</p>
          <div className="room-code">{roomLink.split('/').pop()}</div>
          <div className="button-group">
            <ShareButton roomLink={roomLink} className="custom-button" />
            <button
              type="button"
              className="join-room-button"
              onClick={handleJoinRoom}
            >
              통화 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHomeScreen;
