import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import Logo from './Logo';
import { useUserInfo } from '../../context/UserInfoContext';
import DefaultProfile from '../../assets/default-profile.svg';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useUserInfo(); // UserInfoContext에서 userInfo 가져오기

  const showUserProfile = location.pathname !== '/';

  const handleButtonClick = () => {
    const accessToken = localStorage.getItem('accessToken'); // 로컬 스토리지에서 accessToken 가져오기
    if (accessToken) {
      navigate('/mypage'); // accessToken이 있으면 마이페이지로 이동
    } else {
      navigate('/'); // 없으면 로그인 페이지로 이동
    }
  };

  const handleLogoClick = () => {
    navigate('/call/home'); // 로고 클릭 시 /call/home으로 이동
  };

  return (
    <header className="header">
      {/* Logo 컴포넌트에 클릭 이벤트 핸들러 추가 */}
      <div onClick={handleLogoClick} className="logo-container">
        <Logo />
      </div>
      {showUserProfile && (
        <button className="header-button" onClick={handleButtonClick}>
          {localStorage.getItem('accessToken') ? (
            <img
              src={userInfo.profileImage || DefaultProfile} // profileImage 사용, 기본 이미지 경로 추가
              alt="Profile"
              className="profile-image"
            />
          ) : (
            '로그인' // 로그인 텍스트
          )}
        </button>
      )}
    </header>
  );
};

export default Header;
