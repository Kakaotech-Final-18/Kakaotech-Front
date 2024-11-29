import React, { useEffect, useRef } from 'react';
import './ChatBox.css';

const ChatBox = ({
  messages,
  onSendMessage,
  recommendations,
  clearRecommendations,
}) => {
  const chatInputRef = React.useRef();
  const messagesEndRef = useRef(null);

  const sendMessage = message => {
    if (message.trim()) {
      onSendMessage(message);
    }
  };

  const handleSendButtonClick = () => {
    const message = chatInputRef.current.value.trim();
    if (message) {
      sendMessage(message);
      chatInputRef.current.value = '';
    }
  };

  const handleRecommendationClick = rec => {
    sendMessage(rec);
    clearRecommendations();
  };

  // 새 메시지가 추가될 때마다 스크롤을 아래로 유지
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-box">
      {/* 채팅 메시지 로그 */}
      <ul className="chat-messages">
        {messages.map((msg, idx) => (
          <li key={idx} className={`chat-message ${msg.type}`}>
            <span className="message-bubble">{msg.content}</span>
          </li>
        ))}
        {/* 스크롤을 아래로 유지하기 위한 더미 요소 */}
        <div ref={messagesEndRef}></div>
      </ul>

      {/* 추천 문장 버튼 영역 */}
      <div className="chat-recommendations">
        {recommendations.map((rec, idx) => (
          <button
            key={idx}
            type="button"
            className="recommendation-button"
            onClick={() => handleRecommendationClick(rec)}
          >
            {rec}
          </button>
        ))}
      </div>

      {/* 채팅 입력 폼 */}
      <form
        className="chat-input-form"
        onSubmit={e => {
          e.preventDefault();
          handleSendButtonClick();
        }}
      >
        <input
          className="chat-input"
          type="text"
          placeholder="메시지를 입력하세요..."
          ref={chatInputRef}
        />
        <button type="submit" className="send-button">
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
