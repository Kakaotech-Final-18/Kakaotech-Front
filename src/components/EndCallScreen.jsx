import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EndCallScreen.css';
import CallControl from './CallControl';
import { useSocket } from '../context/SocketContext';

const EndCallScreen = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 관리
  const socket = useSocket();

  useEffect(() => {
    // 서버에서 'ai_summary' 이벤트 수신
    socket.on("ai_summary", (todo) => {
      console.log(todo);
      setTodos(todo);
      setIsLoading(false); // 데이터를 받으면 로딩 상태 해제
    });

    return () => {
      socket.off("ai_summary"); // 컴포넌트 언마운트 시 이벤트 제거
    };
  }, []);

  const handleConfirm = () => {
    navigate('/call/home'); // '/call/home'으로 이동
  };

  return (
    <div className="end-call-screen">
      <CallControl />
      <div className="summary-todo">
        <h3>앵픽된 Todo</h3>
        {isLoading ? ( // 로딩 상태 표시
          <p>로딩 중입니다...</p>
        ) : todos.length > 0 ? (
          <ul>
            {todos.map((todo, index) => (
              <li key={index}>
                <label>
                  <input type="checkbox" />
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
