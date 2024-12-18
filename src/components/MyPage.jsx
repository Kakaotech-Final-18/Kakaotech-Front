import React, { useEffect, useState } from 'react';
import './MyPage.css';
import { useUserInfo } from '../context/UserInfoContext';
import DefaultProfile from '../assets/default-profile.svg';
import api from '../interceptors/LoginInterceptor'; 
import Modal from './common/Modal'; 

const MyPage = () => {
  const { userInfo, setUserInfo } = useUserInfo();
  const [profileImage, setProfileImage] = useState(DefaultProfile);
  const [roomDetails, setRoomDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
      const fetchRoomDetails = async () => {
          try {
              const response = await api.get('/api/v1/details', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                      Accept: 'application/json',
                  },
              });
              setRoomDetails(response.data);
              console.log(response.data);
      } catch (error) {
        console.error('Error fetching room details:', error);
      }
    };
    fetchRoomDetails();
  }, []);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      setProfileImage(parsedUserInfo.profileImage || DefaultProfile);
    }
  }, [setUserInfo]);

  const handleDeleteRoom = async talkId => {
    try {
      // 서버로 삭제 요청
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/details/${talkId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            Accept: 'application/json',
          },
        }
      );

    const toggleTodoStatus = async (talkId, todoTitle) => {
        try {
            // roomDetails에서 talkId에 해당하는 항목 찾기
            const updatedDetails = roomDetails.map((detail) => {
                if (detail.talkId === talkId && detail.todoTitle === todoTitle) {
                    // 새로운 상태 계산
                    const newStatus = detail.todoStatus === 'PENDING' ? 'DONE' : 'PENDING';

                    // 클라이언트 상태 업데이트
                    return {
                        ...detail,
                        todoStatus: newStatus, // todoStatus만 업데이트
                    };
                }
                return detail;
            });

            setRoomDetails(updatedDetails); // 클라이언트 상태 업데이트

            // 서버에 상태 업데이트 요청
            const updatedStatus = updatedDetails.find(
                (detail) => detail.talkId === talkId && detail.todoTitle === todoTitle
            ).todoStatus;

            await api.patch(
                '/api/v1/todo/update',
                {
                    talkId: talkId,
                    todoTitle: todoTitle,
                    newTodoStatus: updatedStatus,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                        Accept: 'application/json',
                    },
                }
            );

            console.log(`Todo "${todoTitle}" updated successfully to "${updatedStatus}"`);
        } catch (error) {
            console.error("Error updating todo status:", error);
        }
    };
  
    const handleDeleteRoom = async (talkId) => {
        try {
            // 서버로 삭제 요청
            await api.delete('/api/v1/details/${talkId}', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    Accept: 'application/json',
                },
            });
      // 클라이언트 상태 업데이트: 삭제된 방 제거
      const updatedRoomDetails = roomDetails.filter(
        detail => detail.talkId !== talkId
      );
      setRoomDetails(updatedRoomDetails);
            // 모달 상태 업데이트
            setModalMessage('삭제되었습니다.');
            setIsModalOpen(true);
            console.log(`Room with talkId "${talkId}" deleted successfully.`);
        } catch (error) {
            console.error(`Error deleting room with talkId "${talkId}":`, error);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout', null, {
                withCredentials: true, // 쿠키 포함
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    Accept: 'application/json',
                },
            });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
      setUserInfo(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="mypage-container">
      <header className="profile-header">
        <img src={profileImage} alt="Profile" className="my-profile-image" />
        <div className="profile-info">
          <p className="nickname">{userInfo.nickname || '익명'}</p>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <section className="content">
        {roomDetails.length === 0 ? (
          <div className="no-content-container">
            <p className="no-content-message">
              최근 통화내역이 여기에 표시됩니다.
              <br />
              앵무말로 새로운 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          Object.values(
            roomDetails.reduce((acc, detail) => {
              if (!acc[detail.talkId]) {
                acc[detail.talkId] = {
                  talkId: detail.talkId,
                  receiverName: detail.receiverName,
                  receiverProfileImage:
                    detail.receiverProfileImage === 'default'
                      ? DefaultProfile
                      : detail.receiverProfileImage,
                  talkCreatedAt: detail.talkCreatedAt,
                  todos: [],
                };
              }
              acc[detail.talkId].todos.push({
                todoTitle: detail.todoTitle,
                todoStatus: detail.todoStatus,
              });
              return acc;
            }, {})
          ).map((talkDetail, index) => (
            <div className="chat-card" key={index}>
              <div className="chat-header">
                <div className="chat-profile">
                  <img
                    src={talkDetail.receiverProfileImage}
                    alt="Profile"
                    className="profile-icon"
                  />
                  <div className="chat-info">
                    <p className="chat-title">{`${talkDetail.receiverName}님과의 통화`}</p>
                    <span className="chat-date">
                      {(() => {
                        const date = new Date(talkDetail.talkCreatedAt);
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          '0'
                        );
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(
                          2,
                          '0'
                        );
                        return `${month}/${day} ${hours}:${minutes}`;
                      })()}
                    </span>
                  </div>
                  <button
                    className="close-button"
                    onClick={() => handleDeleteRoom(talkDetail.talkId)}
                  />
                </div>
              </div>
              <div className="task-list">
                {talkDetail.todos.map((todo, todoIndex) => (
                  <div className="task-item" key={todoIndex}>
                    <input
                      type="checkbox"
                      id={`todo-${todo.todoTitle}`}
                      checked={todo.todoStatus === 'DONE'}
                      onChange={() =>
                        toggleTodoStatus(talkDetail.talkId, todo.todoTitle)
                      }
                    />
                    <label
                      htmlFor={`todo-${todo.todoTitle}`}
                      className={todo.todoStatus === 'DONE' ? 'checked' : ''}
                    >
                      {todo.todoTitle}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default MyPage;
