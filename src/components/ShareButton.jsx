import React from 'react';
import { useEffect } from 'react';
import './ShareButton.css';
const { Kakao } = window;

const ShareButton = ({ roomLink, className }) => {
  useEffect(() => {
    Kakao.cleanup();
    if (!Kakao.isInitialized()) {
      Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
      console.log('Kakao Initialized:', Kakao.isInitialized());
    }
  }, []);

  const handleShare = () => {
    if (Kakao) {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '앵무말 통화방 초대',
          description: '아래 링크를 클릭해 통화방에 참여하세요!',
          imageUrl: 'https://ifh.cc/g/qsQjTB.jpg',
          link: {
            mobileWebUrl: roomLink,
            webUrl: roomLink,
          },
        },
        buttons: [
          {
            title: '통화방 참여하기',
            link: {
              mobileWebUrl: roomLink,
              webUrl: roomLink,
            },
          },
        ],
      });
    } else {
      alert('공유 API가 초기화되지 않았습니다.');
    }
  };

  return (
    <button
      type="button"
      className={`share-button ${className} `}
      onClick={handleShare}
    >
      공유하기
    </button>
  );
};

export default ShareButton;
