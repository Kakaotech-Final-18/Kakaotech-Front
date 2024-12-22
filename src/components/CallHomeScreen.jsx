import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import { useSocket } from '../context/SocketContext';
import PhoneIcon from '../assets/phone-icon.svg';
import DefaultProfile from '../assets/default-profile.svg';
import './CallHomeScreen.css';
import { useUserInfo } from '../context/UserInfoContext';
import api from '../interceptors/LoginInterceptor';
import { useRoomName } from '../hooks/useRoomName';
import Modal from './common/Modal';

const CallHomeScreen = () => {
  const { encodeRoomName } = useRoomName();
  const [roomLink, setRoomLink] = useState('');
  const [createButtonText, setCreateButtonText] = useState('방 생성');
  const navigate = useNavigate();
  const socket = useSocket();
  const { userInfo, setUserInfo } = useUserInfo();
  const [roomName, setRoomName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const fetchUserInfo = accessToken => {
    try {
      api
        .get('/api/v1/user/info', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        })
        .then(response => {
          const data = response.data;
          setUserInfo({
            nickname: data.nickname,
            email: data.email,
            profileImage: data.profileImage,
          });
          localStorage.setItem('userInfo', JSON.stringify(data));
        });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      fetchUserInfo(accessToken);
    }
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  const handleCreateRoom = () => {
    if (!localStorage.getItem('accessToken')) {
      setModalMessage(
        <>
          방 생성에는 로그인이 필요합니다.
          <br />
          로그인 화면으로 이동합니다.
        </>
      );
      setIsModalOpen(true);
      return;
    }

    socket.emit('create_room', roomName => {
      const encodedRoomName = encodeRoomName(roomName);

      // DB에 방 정보를 저장
      api
        .post(
          '/api/v1/talk/create',
          { roomName: roomName },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              Accept: 'application/json',
            },
          }
        )
        .then(response => {
          const link = `${window.location.origin}/call/${encodeRoomName(
            `${roomName}?talkId=${response.data}`
          )}`;
          setRoomLink(link); // 최종적으로 공유할 링크 저장
          setRoomName(roomName);
          setCreateButtonText('방 생성 완료!');
          console.log('Room created with encoded link:', link);
        })
        .catch(error => {
          console.error('Error creating room in DB:', error);
        });
    });
  };

  const handleJoinRoom = () => {
    if (roomLink) {
      const relativePath = roomLink.replace(window.location.origin, '');
      navigate(relativePath);
    }
  };

  return (
    <div className="call-home-view">
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        message={modalMessage}
      />
      <div className="call-home-container">
        <div className="profile-section">
          <img
            src={userInfo.profileImage || DefaultProfile}
            alt="Default Profile"
            className="profile-picture"
            onError={e => {
              e.target.onerror = null;
              e.target.src = DefaultProfile;
            }}
          />
          <div className="profile-info">
            <span className="nickname">{userInfo.nickname || '익명'}</span>
            <button
              type="button"
              className="create-room-button"
              onClick={handleCreateRoom}
            >
              <img src={PhoneIcon} alt="Phone Icon" className="phone-icon" />
              <span className="phone-text">{createButtonText}</span>
            </button>
          </div>
        </div>

        {roomLink && (
          <div className="room-link-container">
            <p className="room-link-title">통화 코드</p>
            <div className="room-code">{encodeRoomName(roomName)}</div>
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
    </div>
  );
};

export default CallHomeScreen;
