import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();

  // Onboarding 페이지에서는 마이페이지 버튼 숨기기
  const showMyPageButton = location.pathname !== '/';

  return (
    <header className="header">
      <div className="header-logo">LOGO</div>
      {showMyPageButton && (
        <button
          className="header-button"
          onClick={() => alert('Go to My Page')}
        >
          My
        </button>
      )}
    </header>
  );
};

export default Header;
