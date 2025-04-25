import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IoMdPerson, 
  IoMdPeople,
  IoMdLogOut
} from 'react-icons/io';
import FriendsPopup from './FriendsPopup';
import './UserDropdown.css';

const UserDropdown = ({ onLogout }) => {
  const { user } = useAuth();
  const [showFriendsPopup, setShowFriendsPopup] = useState(false);

  const handleFriendsClick = (e) => {
    e.preventDefault();
    setShowFriendsPopup(true);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    // TODO: Implement profile view
  };

  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        <div className="user-avatar-large">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-email">{user?.email || 'No email'}</div>
        </div>
      </div>
      
      <div className="dropdown-menu">
        <button onClick={handleProfileClick} className="dropdown-item">
          <IoMdPerson className="dropdown-icon" />
          <span>Profile</span>
        </button>
        
        <button onClick={handleFriendsClick} className="dropdown-item">
          <IoMdPeople className="dropdown-icon" />
          <span>Friends</span>
        </button>
        
        <div className="dropdown-divider"></div>
        
        <button onClick={onLogout} className="dropdown-item logout">
          <IoMdLogOut className="dropdown-icon" />
          <span>Logout</span>
        </button>
      </div>

      {showFriendsPopup && (
        <FriendsPopup onClose={() => setShowFriendsPopup(false)} />
      )}
    </div>
  );
};

export default UserDropdown; 