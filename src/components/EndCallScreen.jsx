import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EndCallScreen.css';
import CallControl from './CallControl';
import { useSocket } from '../context/SocketContext';
import { usePeer } from '../context/PeerContext';
import api from '../interceptors/LoginInterceptor'; 

const EndCallScreen = () => {
  const navigate = useNavigate();
  const location = useLocation(); // URL에서 query parameter 가져오기
  const [todos, setTodos] = useState([]);
  const [checkedTodos, setCheckedTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();
  const { peerNickname, peerProfileImage } = usePeer();

  // URL에서 roomName 가져오기
  const searchParams = new URLSearchParams(location.search);
  const roomName = searchParams.get('roomName');
  const { talkId } = location.state || {};

  useEffect(() => {
    // AI 요약된 TODO 받기
    socket.on("ai_summary", (todo) => {
      console.log(todo);
      setTodos(todo);
      setCheckedTodos(new Array(todo.length).fill(false)); // 체크 초기화
      setIsLoading(false);
    });

    return () => {
      socket.off("ai_summary");
    };
  }, [socket, roomName]);

  // 체크박스 상태 업데이트
  const handleCheckboxChange = (index) => {
    const newCheckedTodos = [...checkedTodos];
    newCheckedTodos[index] = !newCheckedTodos[index];
    setCheckedTodos(newCheckedTodos);
  };

  // 선택 항목 저장
  const handleConfirm = async () => {
    const selectedTodos = todos.filter((_, index) => checkedTodos[index]);

    if (selectedTodos.length === 0) {
      navigate('/call/home');
      return;
    }

    try {
      // 서버로 요청 데이터 전송
      const response = await api.post(
        '/api/v1/todo/create',
        {
          todos: selectedTodos,
          talk: { talkId: talkId },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            Accept: 'application/json',
          },
        }
      );

      console.log('서버 응답:', response.data);
      navigate('/call/home');
    } catch (error) {
      console.error('Todo 저장 중 오류 발생:', error);
    }
  };

  return (
    <div className="end-call-screen">
      <CallControl nickname={peerNickname} profileImage={peerProfileImage} />
      <div className="summary-todo">
        <h3>앵픽된 Todo</h3>
        {isLoading ? (
          <p>로딩 중입니다...</p>
        ) : todos.length > 0 ? (
          <ul>
            {todos.map((todo, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    checked={checkedTodos[index]}
                    onChange={() => handleCheckboxChange(index)}
                  />
                  {todo}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p id="notodo">Todo가 없습니다.</p>
        )}
      </div>
      <button className="select-button" onClick={handleConfirm}>
        선택 항목 기록하기
      </button>
    </div>
  );
};

export default EndCallScreen;
