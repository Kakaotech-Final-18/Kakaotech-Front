import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 리버스 프록시
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: process.env.VITE_SOCKET_URL || 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
