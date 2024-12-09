import React from 'react';
import CallControl from './CallControl';
import ChatBox from './ChatBox';
import CallWaitingIndicator from './CallWaitingIndicator';
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
  const isWaiting = !nickname;

  return (
    <div className="call-chat-screen">
      {!isWaiting && (
        <CallControl
          nickname={nickname}
          profileImage={profileImage}
          onEndCall={onEndCall}
        />
      )}
      {isWaiting ? (
        <CallWaitingIndicator message="상대방을 기다리는 중" animation={true} />
      ) : (
        <ChatBox
          messages={messages}
          onSendMessage={onSendMessage}
          recommendations={recommendations}
          clearRecommendations={clearRecommendations}
        />
      )}
    </div>
  );
};

export default CallChatScreen;
