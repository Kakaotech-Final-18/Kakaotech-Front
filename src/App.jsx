import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import OnboardingScreen from './components/OnboardingScreen';
import CallHomeScreen from './components/CallHomeScreen';
import CallScreen from './components/CallScreen';
import EndCallScreen from './components/EndCallScreen';
import { SocketProvider } from './context/SocketContext';
import { UserInfoProvider } from './context/UserInfoContext';
import { PeerProvider } from './context/PeerContext';
import MyPage from './components/MyPage';
import axios from 'axios';

const App = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  const fetchToken = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/access`,
        {},
        { withCredentials: true }
      );
      const accessToken = response.headers['authorization']?.replace('Bearer ', '');
      const currentPath = window.location.pathname;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        console.log('Access Token 저장 완료:', accessToken);
        if(currentPath === '/')
          navigate('/call/home'); // Access Token이 있으면 CallHomeScreen으로 이동
      } 
      // else {
      //   navigate('/'); // Access Token이 없으면 로그인 화면으로 이동
      // }
    } catch (error) {
      console.error('토큰 요청 실패:', error);
      // navigate('/'); // 에러 발생 시 로그인 화면으로 이동
    } finally {
      setLoading(false); // 로딩 완료
    }
  };

  useEffect(() => {
    const localStorageAccess = localStorage.getItem('accessToken');
    const currentPath = window.location.pathname;

    if (currentPath === '/' && localStorageAccess) {
      navigate('/call/home'); // 기존 Access Token이 있으면 바로 CallHomeScreen으로 이동
      setLoading(false);
    } else {
      fetchToken(); // Access Token이 없으면 새로 요청
    }
  }, [navigate]);

  if (loading) {
    return <div>로딩 중...</div>; // 로딩 상태 표시
  }

  return (
    <PeerProvider>
      <UserInfoProvider>
        <SocketProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<OnboardingScreen />} />
              <Route path="/call/home" element={<CallHomeScreen />} />
              <Route path="/call/:roomName" element={<CallScreen />} />
              <Route path="/call/end" element={<EndCallScreen />} />
              <Route path="/mypage" element={<MyPage />} />
            </Routes>
          </MainLayout>
        </SocketProvider>
      </UserInfoProvider>
    </PeerProvider>
  );
};

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;