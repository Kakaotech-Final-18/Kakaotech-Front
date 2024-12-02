import axios from 'axios';
import { response } from 'express';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// 요청 인터셉터: Access Token 자동 추가
api.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('Authorization');
    if (accessToken) config.headers.Authorization = accessToken;
    return config;
  },
  error => Promise.reject(error)
);

// 응답 인터셉터: Access Token 만료시 처리
api.interceptors.response.use(
  response => response,
  async error => {
    // access token 만료
    if (error.response?.status === 401) {
      try {
        const refreshResponse = await axios.post(
          '/api/v1/auth/refresh',
          {},
          {
            withCredentials: true,
          }
        );
        const newAccessToken = refreshResponse.headers.authorization;

        if (newAccessToken) {
          localStorage.setItem('Authorization', newAccessToken);
          error.config.headers.Authorization = newAccessToken;
          // 요청 재실행
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('Refresh Token 실패:', refreshError);
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('Authorization');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
