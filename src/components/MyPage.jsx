import React, { useEffect, useState } from 'react';
import './MyPage.css';
import { useUserInfo } from '../context/UserInfoContext';
import axios from 'axios';
import DefaultProfile from '../assets/default-profile.svg';


const MyPage = () => {
    const { userInfo, setUserInfo } = useUserInfo();
    const [profileImage, setProfileImage] = useState(DefaultProfile);
    const [roomDetails, setRoomDetails] = useState([]);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/details`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                        Accept: 'application/json',
                    },
                });
                console.log(response.data);
                setRoomDetails(response.data);
            } catch (error) {
                console.error("Error fetching room details:", error);
            }
        };

        fetchRoomDetails();
    }, []);

    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const parsedUserInfo = JSON.parse(storedUserInfo);
            setUserInfo(parsedUserInfo);
            setProfileImage(parsedUserInfo.profileImage || DefaultProfile);
        }
    }, [setUserInfo]);

    useEffect(() => {
        if (userInfo) {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            setProfileImage(userInfo.profileImage || DefaultProfile);
        }
    }, [userInfo]);

    return (
        <div className="mypage-container">
            <header className="profile-header">
                <img src={profileImage} alt="Profile" className="my-profile-image" />
                <div className="profile-info">
                    <p className="nickname">{userInfo?.nickname || '익명'}</p>
                    <button className="logout-button">로그아웃</button>
                </div>
            </header>

            <section className="content">
                {roomDetails.map((detail, index) => (
                    <div className="chat-card" key={`${detail.talkId}-${index}`}>
                        <div className="chat-header">
                            <div className="chat-profile">
                                <img src={DefaultProfile} alt="Profile" className="profile-icon" />
                                <p className="chat-title">{`${detail.receiverName}님과의 통화`}</p>
                            </div>
                            <span className="chat-date">
                                {new Date(detail.talkCreatedAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}
                            </span>
                            <button className="close-button">X</button>
                        </div>
                        <div className="task-list">
                            <div className="task-item">
                                <input type="checkbox" id={`todo-${detail.todoTitle}`} />
                                <label htmlFor={`todo-${detail.todoTitle}`}>{detail.todoTitle}</label>
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default MyPage;
