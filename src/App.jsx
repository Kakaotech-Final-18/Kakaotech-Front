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

const App = () => {
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