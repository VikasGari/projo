import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { IoMdPerson, IoMdPersonAdd, IoMdMail, IoMdClose } from 'react-icons/io';
import { toast } from 'react-hot-toast';
import './FriendsPopup.css';

const FriendsPopup = ({ onClose }) => {
  const { user } = useAuth();
  const { 
    friends = [], 
    friendRequests = [], 
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    fetchFriendRequests,
    fetchFriends,
    loading
  } = useFriends();
  const [activeTab, setActiveTab] = useState('friends');
  const [email, setEmail] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSendingRequest(true);
      await sendFriendRequest(email);
      setEmail('');
      toast.success('Friend request sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="friends-popup">
      <div className="friends-popup-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <IoMdPerson /> Friends ({friends.length})
          </button>
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <IoMdPersonAdd /> Requests ({friendRequests.length})
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>
          <IoMdClose />
        </button>
      </div>

      <div className="friends-popup-content">
        {loading ? (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        ) : activeTab === 'friends' ? (
          <div className="friends-list">
            {friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend._id} className="friend-item">
                  <div className="friend-avatar">
                    {friend.profile_image ? (
                      <img src={friend.profile_image} alt={friend.name} />
                    ) : (
                      <span>{friend.name?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="friend-info">
                    <h3>{friend.name || 'Unknown'}</h3>
                    <p>{friend.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <IoMdPerson />
                <p>No friends yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="requests-list">
            {friendRequests.length > 0 ? (
              friendRequests.map(request => {
                const sender = request.from;
                console.log('Rendering friend request:', {
                  fullRequest: request,
                  sender,
                  senderFields: sender ? Object.keys(sender) : [],
                  requestId: request._id
                });
                return (
                  <div key={request._id} className="request-item">
                    <div className="request-avatar">
                      {sender?.profile_image ? (
                        <img src={sender.profile_image} alt={sender.name} />
                      ) : (
                        <span>{sender?.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="request-info">
                      <h3>{sender?.name || 'Unknown'}</h3>
                      <p>{sender?.email}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => acceptFriendRequest(sender?._id)}
                        disabled={sendingRequest}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => rejectFriendRequest(sender?._id)}
                        disabled={sendingRequest}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <IoMdPersonAdd />
                <p>No pending friend requests</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSendRequest} className="send-request-form">
          <div className="input-group">
            <IoMdMail className="input-icon" />
            <input
              type="email"
              placeholder="Enter email to send friend request"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sendingRequest}
              required
            />
          </div>
          <button type="submit" disabled={sendingRequest}>
            {sendingRequest ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FriendsPopup; 