import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import Logo from './Logo';

const Header = () => {
  const location = useLocation();
  const showMyPageButton = location.pathname !== '/';

  return (
    <header className="header">
      <Logo />
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
