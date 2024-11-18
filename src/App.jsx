import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CallHome from './components/CallHome';
import CallScreen from './components/CallScreen';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/call/home" element={<CallHome />} />
        <Route path="/call/:roomName" element={<CallScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
