import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CallHome from './components/CallHome';
import CallScreen from './components/CallScreen';
import { SocketProvider } from './context/SocketContext';

const App = () => {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/call/home" element={<CallHome />} />
          <Route path="/call/:roomName" element={<CallScreen />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
