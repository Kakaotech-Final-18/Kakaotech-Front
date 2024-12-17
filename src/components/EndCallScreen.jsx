import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EndCallScreen.css';
import CallControl from './CallControl';
import { useSocket } from '../context/SocketContext';
import { usePeer } from '../context/PeerContext';
import axios from 'axios';
import Modal from './common/Modal';

const EndCallScreen = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [todos, setTodos] = useState([]);
  const [checkedTodos, setCheckedTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();
  const { peerNickname, peerProfileImage } = usePeer();
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const searchParams = new URLSearchParams(location.search);
  const roomName = searchParams.get('roomName');
  const { talkId, chatMessages } = location.state || {}; 

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true);
      try {
        if (chatMessages && chatMessages.length > 0) {
          const combinedContent = chatMessages.map(msg => msg.content).join(' ');
          const response = await axios.post(import.meta.env.VITE_AI_SUMMARY, {
            room_number: roomName,
            sentence: combinedContent,
          });
          const { todo } = response.data;
          setTodos(todo);
          setCheckedTodos(new Array(todo.length).fill(false));
          socket.emit('ai_summary', roomName, todo);
        } else {
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

  const handleCheckboxChange = (index) => {
    const newCheckedTodos = [...checkedTodos];
    newCheckedTodos[index] = !newCheckedTodos[index];
    setCheckedTodos(newCheckedTodos);
  };

  const handleConfirm = async () => {
    const selectedTodos = todos.filter((_, index) => checkedTodos[index]);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsModalOpen(true); // 모달 열기
      return;
    }

    if (selectedTodos.length === 0) {
      navigate('/call/home');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/todo/create`,
        {
          todos: selectedTodos,
          talk: { talkId: talkId },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); navigate('/call/home'); }} 
        message={
          <>
            로그인이 되어 있지 않아<br />
            요약 기능을 사용할 수 없습니다.
          </>
        }
      />
    </div>
  );
};

export default EndCallScreen;
