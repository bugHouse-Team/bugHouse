import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import maverick from '../assets/images/maverick.png';
import '../styles/Profile.css';

const Profile = ({ email }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(maverick);
  const fileInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // CORRECTED: Changed endpoint to match backend route
        const response = await axios.get(`${API_URL}/api/profile/user/${email}`);
        if (response.data) {
          setUserData({
            name: response.data.name,
            idNumber: response.data.idNumber.trim(),
            role: response.data.role
          });
          
          if (response.data.profileImage) {
            const imageUrl = response.data.profileImage.includes('http')
              ? response.data.profileImage
              : `${API_URL}/uploads/${response.data.profileImage.replace(/\\/g, '/')}`;
            setProfileImage(imageUrl);
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchUserData();
    }
  }, [email, API_URL]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      // CORRECTED: Changed endpoint to match backend route
      const response = await axios.post(
        `${API_URL}/api/profile/upload-profile-image/${email}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.imagePath) {
        setProfileImage(`${API_URL}/uploads/${response.data.imagePath.replace(/\\/g, '/')}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  return (
    <div className="profile-container">
      <div className="profile-avatar">
        <img 
          src={profileImage} 
          alt="Profile" 
          onError={() => setProfileImage(maverick)}
        />
        <button className="upload-button" onClick={triggerFileInput}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" fill="#F38223" />
            <path 
              d="M12 8v8M8 12h8" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          hidden
        />
      </div>
      
      <div className="profile-inner-box">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : userData ? (
          <>
            <div><strong>Name:</strong> {userData.name}</div>
            <div><strong>ID:</strong> {userData.idNumber}</div>
            <div><strong>Role:</strong> {userData.role}</div>
          </>
        ) : (
          <div>No profile data found</div>
        )}
      </div>
    </div>
  );
};

export default Profile;