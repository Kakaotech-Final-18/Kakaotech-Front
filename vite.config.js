import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ command, mode }) => {
  // loadEnv를 사용하여 환경변수 불러오기
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "parrotalk",
        project: "javascript-react",
      }),
    ],
    build: {
      sourcemap: false, // 에러위치 잡기, 빌드시 꺼둠
    },
    server: {
      proxy: {
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'http://localhost:3000',
          ws: true,
        },
      },
    },
  };
});