import React from 'react';
import { useLocation } from 'react-router-dom';
import DefaultProfile from '../assets/default-profile.svg';
import EndCallIcon from '../assets/decline-button.svg';
import './CallControl.css';

const CallControl = ({ nickname, onEndCall }) => {
  const displayName = nickname || '닉네임';
  const location = useLocation();
  const showEndCallButton = location.pathname !== '/call/end';

  return (
    <div
      className={`call-control ${!showEndCallButton ? 'center-align' : ''}`}
    >
      {/* 왼쪽: 프로필 + 닉네임 */}
      <div className="call-control-left">
        <img
          src={DefaultProfile}
          alt="Profile"
          className="call-control-profile"
        />
        <span className="call-control-nickname">
          {displayName} {!showEndCallButton ? '님과의 통화 종료' : ''}
        </span>
      </div>

      {/* 오른쪽: 종료 버튼 */}
      {showEndCallButton && (
        <button className="call-control-end-button" onClick={onEndCall}>
          <img src={EndCallIcon} alt="End Call" />
        </button>
      )}
    </div>
  );
};

export default CallControl;
