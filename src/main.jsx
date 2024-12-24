import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { browserTracingIntegration } from '@sentry/react';
import App from './App.jsx';
import './index.css';

// 모니터링 툴 - 운영 서버에서만 실행
if (import.meta.env.MODE === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      browserTracingIntegration({
        tracingOrigins: ['*'],
      }),
    ],
    tracesSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
