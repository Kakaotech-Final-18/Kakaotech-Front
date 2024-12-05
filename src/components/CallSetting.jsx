import React, { useState } from 'react';
import CallButton from '../assets/call-button.svg';
import './CallSetting.css';

const CallSetting = ({ onConfirm }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = option => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption);
    }
  };

  return (
    <div className="call-setting-outer-container">
      <div className="call-setting-wrapper">
        <h2>통화 모드를 선택하세요</h2>
        <div className="call-setting-container">
          <button
            className={`call-option ${selectedOption === 'chat' ? 'active' : ''}`}
            onClick={() => handleOptionClick('chat')}
          >
            <img src={CallButton} alt="Chat Icon" className="option-icon" />
            <span className="option-text">채팅 통화</span>
          </button>
          <button
            className={`call-option ${selectedOption === 'voice' ? 'active' : ''}`}
            onClick={() => handleOptionClick('voice')}
          >
            <img src={CallButton} alt="Voice Icon" className="option-icon" />
            <span className="option-text">음성 통화</span>
          </button>
        </div>
        <div className="confirm-container">
          {selectedOption ? (
            <button className="confirm-button" onClick={handleConfirm}>
              통화 시작
            </button>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallSetting;
