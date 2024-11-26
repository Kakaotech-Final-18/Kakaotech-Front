import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CallHomeScreen from './components/CallHomeScreen';
import CallScreen from './components/CallScreen';
import { SocketProvider } from './context/SocketContext';

const App = () => {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/call/home" element={<CallHomeScreen />} />
          <Route path="/call/:roomName" element={<CallScreen />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
