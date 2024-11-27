import React from 'react';
import Header from '../components/common/Header';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      {/* 공통 Header */}
      <Header showMyPageButton={true} />
      {/* 페이지별 컨텐츠 */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default MainLayout;
