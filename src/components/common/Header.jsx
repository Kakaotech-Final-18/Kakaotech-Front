import React from 'react';
import './Header.css';

const Header = ({ showMyPageButton = false }) => {
  return (
    <header className="header">
      <div className="header-spacer"></div>
      <div className="header-logo">LOGO</div>
      {showMyPageButton && (
        <button
          className="header-button"
          onClick={() => alert('Go to My Page')}
        >
          My Page
        </button>
      )}
    </header>
  );
};

export default Header;
