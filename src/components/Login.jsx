import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import GoogleIcon from '/google-icon.svg';
import KakaoIcon from '/kakao-icon.svg';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenOnce = async () => {
      const localStorageAccess = localStorage.getItem('accessToken');
      if (localStorageAccess) {
        navigate('/call/home'); // 이미 토큰이 있으면 바로 리다이렉트
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/access`,
          {},
          { withCredentials: true }
        );
        const accessToken = response.headers['authorization']?.replace('Bearer ', '');
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          console.log('Access Token 저장 완료:', accessToken);
          navigate('/call/home'); // 토큰 발급 후 리다이렉트
        }
      } catch (error) {
        console.error('토큰 요청 실패:', error);
      }
    };

    fetchTokenOnce();
  }, []);

  const handleSocialLogin = provider => {
    const loginUrl = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/${provider}`;
    window.location.href = loginUrl; // 소셜 로그인 URL로 리다이렉트
  };

  return (
    <div className="login-container">
      {/* 구글 로그인 버튼 */}
      <button
        className="login-button google-login"
        onClick={() => handleSocialLogin('google')}
      >
        <img src={GoogleIcon} alt="Google Logo" id="google-logo" />
        구글로 시작하기
      </button>

      {/* 카카오 로그인 버튼 */}
      <button
        className="login-button kakao-login"
        onClick={() => handleSocialLogin('kakao')}
      >
        <img src={KakaoIcon} alt="Kakao Logo" id="kakao-logo" />
        카카오로 시작하기
      </button>
    </div>
  );
};

export default Login;
