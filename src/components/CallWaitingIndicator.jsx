import React, { useState, useEffect } from 'react';
import './CallWaitingIndicator.css';

const CallWaitingIndicator = ({ message = '대기중', animation = true }) => {
  const [animatedMessage, setAnimatedMessage] = useState(message);

  useEffect(() => {
    if (!animation) return;

    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      setAnimatedMessage(`${message}${'.'.repeat(dots)}`);
    }, 500);

    return () => clearInterval(interval);
  }, [message, animation]);

  return <div className="waiting-indicator">{animatedMessage}</div>;
};

export default CallWaitingIndicator;
