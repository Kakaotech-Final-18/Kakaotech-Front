import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EndCallScreen.css';
import CallControl from './CallControl';

const EndCallScreen = () => {
  const navigate = useNavigate();

  // 통화 요약 정보를 설정
  const callSummary = {
    caller: '정은체 님',
    todos: [
      { id: 1, text: '5시 60분 장보기', completed: false },
      { id: 2, text: '꿈에서 만나기', completed: false },
      { id: 3, text: '동생 픽업하기', completed: false },
    ],
  };

  const handleConfirm = () => {
    navigate('/call/home'); // '/call/home'으로 이동
  };

  return (
    <div className="end-call-screen">
      <CallControl />
      <div className="summary-todo">
        <h3>앵픽된 Todo</h3>
        <ul>
          {callSummary.todos.map((todo) => (
            <li key={todo.id}>
              <label>
                <input type="checkbox" />
                {todo.text}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <button className="select-button" onClick={handleConfirm}>
        선택 항목 기록하기
      </button>
    </div>
  );
};

export default EndCallScreen;
