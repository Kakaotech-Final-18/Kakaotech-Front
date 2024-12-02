import React from 'react';
import DefaultProfile from '../assets/default-profile.svg';
import EndCallIcon from '../assets/decline-button.svg';
import './CallControl.css';

const CallControl = ({ nickname, onEndCall }) => {
  const displayName = nickname || '닉네임';

  return (
    <div className="call-control">
      {/* 왼쪽: 프로필 + 닉네임 */}
      <div className="call-control-left">
        <img
          src={DefaultProfile}
          alt="Profile"
          className="call-control-profile"
        />
        <span className="call-control-nickname">{displayName}</span>
      </div>

      {/* 오른쪽: 종료 버튼 */}
      <button className="call-control-end-button" onClick={onEndCall}>
        <img src={EndCallIcon} alt="End Call" />
      </button>
    </div>
  );
};

export default CallControl;
