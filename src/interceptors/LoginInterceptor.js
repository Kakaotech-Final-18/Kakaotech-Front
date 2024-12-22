import axios from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 응답 인터셉터: Access Token 만료 시 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Access Token 만료 에러 (401) && 재시도 여부 확인
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 여부 설정

      try {
        // Refresh Token을 사용하여 Access Token 재발급
        const response = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.headers['authorization']?.replace('Bearer ', '');

        if (newAccessToken) {
          // Access Token 갱신 및 로컬스토리지에 저장
          localStorage.setItem('accessToken', newAccessToken);
          console.log('Access Token 재발급 성공:', newAccessToken);

          // 원래 요청에 새로운 Access Token 추가
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest); // 원래 요청 재시도
        }
      } catch (refreshError) {
        console.error('Refresh Token을 사용한 재발급 실패:', refreshError);
        localStorage.removeItem('accessToken');
        window.location.href = '/'; // 로그인 페이지로 이동
      }
    }

    return Promise.reject(error); // 다른 에러는 그대로 전달
  }
);

export default api;
