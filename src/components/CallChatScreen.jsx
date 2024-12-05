import React from 'react';
import CallControl from './CallControl';
import ChatBox from './ChatBox';
import './CallChatScreen.css';

const CallChatScreen = ({
  nickname,
  profileImage,
  onEndCall,
  messages,
  onSendMessage,
  recommendations,
  clearRecommendations,
}) => {
  return (
    <div className="call-chat-screen">
      <CallControl nickname={nickname} profileImage={profileImage} onEndCall={onEndCall} />
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
