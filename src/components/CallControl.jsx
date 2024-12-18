import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import EndCallIcon from '../assets/decline-button.svg';
import DefaultProfile from '../assets/default-profile.svg';
import './CallControl.css';

const CallControl = ({ nickname, profileImage, onEndCall }) => {
  const displayName = useRef();
  if (nickname === null || !nickname) {
    displayName.current = '비정상적 종료!';
  } else if (nickname === undefined) {
    displayName.current = '익명';
  } else {
    displayName.current = nickname + '님 과의 통화 종료!';
  }
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
        <span className="call-control-nickname">{displayName.current}</span>
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
