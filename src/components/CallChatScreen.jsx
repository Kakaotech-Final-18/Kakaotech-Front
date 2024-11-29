import React from 'react';
import ChatBox from './ChatBox';
import './CallChatScreen.css';

const CallChatScreen = ({
  onEndCall,
  messages,
  onSendMessage,
  recommendations,
  clearRecommendations,
}) => {
  return (
    <div className="call-chat-screen">
      <div className="call-control">
        <img
          src="/path/to/default-profile.png"
          alt="Profile"
          className="profile-image"
        />
        <p className="nickname">닉네임</p>
        <button className="end-call-button" onClick={onEndCall}>
          통화 종료
        </button>
      </div>
      <ChatBox
        messages={messages}
        onSendMessage={onSendMessage}
        recommendations={recommendations}
        clearRecommendations={clearRecommendations}
      />
    </div>
  );
};

export default CallChatScreen;
