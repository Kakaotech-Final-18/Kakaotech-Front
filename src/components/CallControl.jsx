import React from 'react';
import { useLocation } from 'react-router-dom';
import EndCallIcon from '../assets/decline-button.svg';
import DefaultProfile from '../assets/default-profile.svg';
import './CallControl.css';

const CallControl = ({ nickname, profileImage, onEndCall }) => {
  const displayName = nickname || '비정상적 종료입니다.';
  const location = useLocation();
  const showEndCallButton = location.pathname !== '/call/end';
  const resolvedProfileImage = profileImage || DefaultProfile;

  return (
    <div className="call-control">
      <div className="call-control-left">
        <img
          src={resolvedProfileImage}
          alt="Profile"
          className="call-control-profile"
          onError={e => {
            e.target.onerror = null;
            e.target.src = DefaultProfile;
          }}
        />
        <span className="call-control-nickname">{displayName}</span>
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
