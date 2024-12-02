import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import OnboardingScreen from './components/OnboardingScreen';
import CallHomeScreen from './components/CallHomeScreen';
import CallScreen from './components/CallScreen';
import { SocketProvider } from './context/SocketContext';
import { UserInfoProvider } from './context/UserInfoContext';


const App = () => {
  return (
    <UserInfoProvider>
    <SocketProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<OnboardingScreen />} />
            <Route path="/call/home" element={<CallHomeScreen />} />
            <Route path="/call/:roomName" element={<CallScreen />} />
          </Routes>
        </MainLayout>
      </Router>
    </SocketProvider>
    </UserInfoProvider>
  );
};

export default App;
