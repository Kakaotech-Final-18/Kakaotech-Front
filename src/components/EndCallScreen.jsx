import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './EndCallScreen.css';
import CallControl from './CallControl';

const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:3000");

const EndCallScreen = ({ roomName }) => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    // 서버에서 'ai_summary' 이벤트 수신
    socket.on("ai_summary", ({ summary, todo }) => {
      setSummary(summary);
      setTodos(todo);
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
        {todos.length > 0 ? (
          <ul>
            {todos.map((todo, index) => (
              <li key={index}>
                <label>
                  <input type="checkbox" />
                  {todo.text}
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
