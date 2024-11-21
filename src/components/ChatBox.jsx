import React from 'react';
import './ChatBox.css';

const ChatBox = ({ messages, onSendMessage }) => {
  const chatInputRef = React.useRef();

  const sendMessage = () => {
    const message = chatInputRef.current.value.trim();
    if (message) {
      onSendMessage(message);
      chatInputRef.current.value = '';
    }
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
          sendMessage();
        }}
      >
        <input
          id="chatInput"
          placeholder="Type a message"
          type="text"
          ref={chatInputRef}
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;
