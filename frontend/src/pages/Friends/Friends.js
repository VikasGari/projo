import React, { useState } from 'react';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { 
  IoMdPersonAdd, 
  IoMdSearch,
  IoMdPerson,
  IoMdCheckmark,
  IoMdClose
} from 'react-icons/io';
import './Friends.css';

const Friends = () => {
  const { user } = useAuth();
  const { 
    friends, 
    friendRequests, 
    loading, 
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [emailToAdd, setEmailToAdd] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  const filteredFriends = friends?.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!emailToAdd.trim()) return;
    
    try {
      await sendFriendRequest(emailToAdd);
      setEmailToAdd('');
      setShowAddFriendModal(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>Friends</h1>
        <button 
          className="add-friend-btn"
          onClick={() => setShowAddFriendModal(true)}
        >
          <IoMdPersonAdd /> Add Friend
        </button>
      </div>

      <div className="search-container">
        <IoMdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {friendRequests?.length > 0 && (
        <div className="friend-requests">
          <h2>Friend Requests</h2>
          <div className="requests-list">
            {friendRequests.map(request => (
              <div key={request._id} className="request-item">
                <div className="request-info">
                  <div className="request-avatar">
                    {request.sender.profileImage ? (
                      <img src={request.sender.profileImage} alt={request.sender.name} />
                    ) : (
                      <span>{request.sender.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="request-details">
                    <h3>{request.sender.name}</h3>
                    <p>{request.sender.email}</p>
                  </div>
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => acceptFriendRequest(request._id)}
                  >
                    <IoMdCheckmark /> Accept
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => rejectFriendRequest(request._id)}
                  >
                    <IoMdClose /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="friends-list">
        <h2>Your Friends</h2>
        {loading ? (
          <div className="loading">Loading friends...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredFriends?.length === 0 ? (
          <div className="empty-state">
            <IoMdPerson className="empty-icon" />
            <p>No friends found</p>
          </div>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map(friend => (
              <div key={friend._id} className="friend-card">
                <div className="friend-avatar">
                  {friend.profileImage ? (
                    <img src={friend.profileImage} alt={friend.name} />
                  ) : (
                    <span>{friend.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{friend.name}</h3>
                  <p>{friend.email}</p>
                </div>
                <button 
                  className="remove-friend-btn"
                  onClick={() => removeFriend(friend._id)}
                >
                  Remove Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddFriendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Friend</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddFriendModal(false)}
              >
                <IoMdClose />
              </button>
            </div>
            <form onSubmit={handleAddFriend} className="modal-content">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={emailToAdd}
                  onChange={(e) => setEmailToAdd(e.target.value)}
                  placeholder="Enter friend's email"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                >
                  Cancel
                </button>
                <button type="submit">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends; 