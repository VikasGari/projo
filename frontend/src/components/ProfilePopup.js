import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './ProfilePopup.css';

const ProfilePopup = ({ userId, onClose }) => {
  const { user } = useAuth();
  const { sendFriendRequest, friends = [], friendRequests = [], fetchFriends, fetchFriendRequests } = useFriends();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const isSelfProfile = user?._id === userId;

  // Fetch friends and friend requests when component mounts
  useEffect(() => {
    if (!isSelfProfile) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [isSelfProfile, fetchFriends, fetchFriendRequests]);

  useEffect(() => {
    fetchProfileData();
  }, [userId, friends, friendRequests]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Mock profile data for now
      const mockProfile = {
        _id: userId,
        name: isSelfProfile ? user.name : 'John Doe',
        email: isSelfProfile ? user.email : 'john@example.com',
        bio: 'Software developer passionate about creating amazing user experiences.',
        profilePicture: 'https://via.placeholder.com/150',
        joinedDate: new Date(2023, 0, 1).toISOString(),
        isFriend: !isSelfProfile && Array.isArray(friends) && friends.some(friend => friend._id === userId),
        hasPendingRequest: !isSelfProfile && Array.isArray(friendRequests) && friendRequests.some(req => req.receiver?._id === userId)
      };
      setProfileData(mockProfile);
      setBio(mockProfile.bio);
    } catch (error) {
      setError('Failed to load profile data');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await sendFriendRequest(userId);
      setProfileData(prev => ({ ...prev, hasPendingRequest: true }));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleUpdateProfile = () => {
    // Mock update profile
    setProfileData(prev => ({ ...prev, bio }));
    setIsEditing(false);
  };

  const renderProfileContent = () => {
    if (loading) {
      return <div className="loading">Loading profile...</div>;
    }

    if (error) {
      return <div className="error">{error}</div>;
    }

    return (
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-picture-container">
            <img 
              src={profileData.profilePicture} 
              alt={profileData.name} 
              className="profile-picture"
            />
            {isSelfProfile && (
              <button className="update-picture-btn">
                Update Picture
              </button>
            )}
          </div>
          <div className="profile-info">
            <h2>{profileData.name}</h2>
            <p className="email">{profileData.email}</p>
            <p className="joined-date">
              Joined {formatDistanceToNow(new Date(profileData.joinedDate), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="profile-bio">
          <h3>Bio</h3>
          {isEditing ? (
            <div className="bio-edit">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
              />
              <div className="bio-actions">
                <button onClick={handleUpdateProfile}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p>{profileData.bio}</p>
              {isSelfProfile && (
                <button onClick={() => setIsEditing(true)}>Edit Bio</button>
              )}
            </>
          )}
        </div>

        {!isSelfProfile && (
          <div className="profile-actions">
            {!profileData.isFriend && !profileData.hasPendingRequest ? (
              <button 
                className="send-request-btn"
                onClick={handleSendFriendRequest}
              >
                Send Friend Request
              </button>
            ) : profileData.hasPendingRequest ? (
              <button className="pending-btn" disabled>
                Friend Request Pending
              </button>
            ) : (
              <button className="friend-btn" disabled>
                Already Friends
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRequestsContent = () => {
    return (
      <div className="requests-content">
        <div className="requests-section">
          <h3>Friend Requests</h3>
          {friendRequests?.length > 0 ? (
            friendRequests.map(request => (
              <div key={request._id} className="request-item">
                <img 
                  src={request.sender.profilePicture || 'https://via.placeholder.com/40'} 
                  alt={request.sender.name} 
                />
                <div className="request-info">
                  <span>{request.sender.name}</span>
                  <small>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</small>
                </div>
                <div className="request-actions">
                  <button className="accept-btn">Accept</button>
                  <button className="reject-btn">Reject</button>
                </div>
              </div>
            ))
          ) : (
            <p>No pending friend requests</p>
          )}
        </div>

        <div className="requests-section">
          <h3>Project Join Requests</h3>
          <p>No pending project requests</p>
        </div>

        <div className="requests-section">
          <h3>Team Join Requests</h3>
          <p>No pending team requests</p>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-popup">
      <div className="popup-header">
        <h2>{isSelfProfile ? 'Your Profile' : 'User Profile'}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {isSelfProfile && (
        <div className="profile-tabs">
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
        </div>
      )}

      <div className="popup-content">
        {activeTab === 'profile' ? renderProfileContent() : renderRequestsContent()}
      </div>
    </div>
  );
};

export default ProfilePopup; 