import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
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

  useEffect(() => {
    const fetchTokenOnce = async () => {
      const localStorageAccess = localStorage.getItem('accessToken');
      const currentPath = window.location.pathname;

      if (localStorageAccess) {
        if (currentPath === '/') {
          navigate('/call/home');
        }
        setLoading(false); // 이미 토큰이 있으면 fetchToken 실행하지 않음
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/access`,
          {},
          { withCredentials: true }
        );
        const accessToken = response.headers['authorization']?.replace(
          'Bearer ',
          ''
        );

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          console.log('Access Token 저장 완료:', accessToken);
          if (currentPath === '/') {
            navigate('/call/home');
          }
        }
      } catch (error) {
        console.error('토큰 요청 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenOnce();
  }, []);

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
              <Route path="*" element={<Navigate to="/" replace />} />
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
