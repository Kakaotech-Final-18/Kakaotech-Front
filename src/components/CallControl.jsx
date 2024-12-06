import React from 'react';
import { useLocation } from 'react-router-dom';
import EndCallIcon from '../assets/decline-button.svg';
import './CallControl.css';

const CallControl = ({ nickname, profileImage, onEndCall }) => {
  const displayName = nickname;
  const location = useLocation();
  const showEndCallButton = location.pathname !== '/call/end';

  return (
    <div
      className={`call-control ${!showEndCallButton || !displayName ? 'center-align' : ''}`}
    >
      {displayName ? (
        <>
          {/* 왼쪽: 프로필 + 닉네임 */}
          <div className="call-control-left">
            <img
              src={profileImage}
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
        </>
      ) : (
        // 사람이 아직 들어오지 않은 경우
        <div className="call-control-waiting">대기중...</div>
      )}
    </div>
  );
};

export default CallControl;
