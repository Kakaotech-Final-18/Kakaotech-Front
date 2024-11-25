import React from 'react';

import './ChatBox.css';

const ChatBox = ({ messages, onSendMessage, recommendations, clearRecommendations }) => {

  const chatInputRef = React.useRef();
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
    sendMessage(rec); // 메시지 보내기
    clearRecommendations(); // recommendations 배열 비우기
  };

  return (
    <div id="chatBox">
      <ul id="logList">
        {messages.map((msg, idx) => (
          <li key={idx} className={msg.type}>
            <span className="message-bubble">{msg.content}</span>
          </li>
        ))}
      </ul>
      <form
        id="chatForm"
        onSubmit={e => {
          e.preventDefault();
          handleSendButtonClick();
        }}
      >
        <input
          id="chatInput"
          placeholder="Type a message"
          type="text"
          ref={chatInputRef}
          required
        />

        <div id="recommendationsBox">
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
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;