import React from 'react';
import './Logo.css';
import ParrotIcon from '/parrot-icon.svg';

const Logo = () => {
  return (
    <div className="logo-container">
      <img src={ParrotIcon} alt="앵무말 로고" className="logo-icon" />
      <span className="logo-text">앵무말</span>
    </div>
  );
};

export default Logo;
