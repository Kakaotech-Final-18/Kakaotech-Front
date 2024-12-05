import React from 'react';
import CallControl from './CallControl';
import ChatBox from './ChatBox';
import './CallChatScreen.css';

const CallChatScreen = ({
  nickname,
  onEndCall,
  messages,
  onSendMessage,
  recommendations,
  clearRecommendations,
}) => {
  return (
    <div className="call-chat-screen">
      <CallControl nickname={nickname} onEndCall={onEndCall} />
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
