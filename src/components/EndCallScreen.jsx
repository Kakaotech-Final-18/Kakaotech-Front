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
  const { talkId, chatMessages } = location.state || {}; 

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true);

      try {
        if (chatMessages && chatMessages.length > 0) {
          // chatMessages가 비어있지 않은 경우 AI 요약 요청
          const combinedContent = chatMessages.map(msg => msg.content).join(' ');
          const response = await axios.post(import.meta.env.VITE_AI_SUMMARY, {
            room_number: roomName,
            sentence: combinedContent,
          });
          const { todo } = response.data;
          setTodos(todo);
          setCheckedTodos(new Array(todo.length).fill(false)); // 체크 초기화
          socket.emit('ai_summary', roomName, todo);
        } else {
          // chatMessages가 비어있는 경우 서버에서 todo 요청
          socket.emit('fetch_todo', roomName, (response) => {
            if (response.success) {
              setTodos(response.todo);
              setCheckedTodos(new Array(response.todo.length).fill(false));
            } else {
              console.error('Todo 데이터 없음:', response.message);
            }
          });
        }
      } catch (error) {
        console.error('Todo 데이터 로드 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, [roomName, chatMessages, socket]);

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
