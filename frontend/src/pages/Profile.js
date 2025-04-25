import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfilePopup from '../components/ProfilePopup';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return <ProfilePopup userId={userId} onClose={handleClose} />;
};

export default Profile; 