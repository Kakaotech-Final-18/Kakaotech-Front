import React from 'react';
import { useLocation } from 'react-router-dom';
import EndCallIcon from '../assets/decline-button.svg';
import './CallControl.css';

const CallControl = ({ nickname, profileImage, onEndCall }) => {
  const displayName = nickname;
  const location = useLocation();
  const showEndCallButton = location.pathname !== '/call/end';

  return (
    <div className="call-control">
      <div className="call-control-left">
        <img
          src={profileImage}
          alt="Profile"
          className="call-control-profile"
        />
        
        <span className="call-control-nickname">
          {showEndCallButton
            ? nickname
            : `${nickname}님과의 통화가 종료되었습니다`}
        </span>
      </div>
      {showEndCallButton && (
        <button className="call-control-end-button" onClick={onEndCall}>
          <img src={EndCallIcon} alt="End Call" />
        </button>
      )}
    </div>
  );
};

export default CallControl;
