import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const FriendsContext = createContext();

export const useFriends = () => useContext(FriendsContext);

export const FriendsProvider = ({ children }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Get token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    };
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/friends`, getAuthHeader());
      console.log('Friends response:', response.data);
      setFriends(response.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err.response?.data?.message || 'Error fetching friends');
      toast.error(err.response?.data?.message || 'Error fetching friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/friend-requests`, getAuthHeader());
      console.log('Friend Requests Debug:', {
        fullResponse: response,
        data: response.data,
        firstRequest: response.data[0],
        fromField: response.data[0]?.from,
        requestCount: response.data.length,
        requestFields: response.data[0] ? Object.keys(response.data[0]) : []
      });
      setFriendRequests(response.data);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setError(err.response?.data?.message || 'Error fetching friend requests');
      toast.error(err.response?.data?.message || 'Error fetching friend requests');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (email) => {
    try {
      const userResponse = await axios.get(`${API_URL}/user/email/${email}`, getAuthHeader());
      console.log('User search response:', userResponse.data);
      
      const receiverId = userResponse.data._id;
      
      await axios.post(`${API_URL}/user/friend-request`, 
        { 
          senderId: user._id,
          receiverId 
        }, 
        getAuthHeader()
      );
      
      await fetchFriendRequests(); // Refresh the requests list
      toast.success('Friend request sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending friend request');
      throw err;
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/user/accept-friend-request`,
        {
          userId: user._id,
          friendId: requestId
        },
        getAuthHeader()
      );
      await fetchFriends();
      await fetchFriendRequests();
      toast.success('Friend request accepted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error accepting friend request');
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/user/reject-friend-request`,
        {
          userId: user._id,
          friendId: requestId
        },
        getAuthHeader()
      );
      await fetchFriendRequests();
      toast.success('Friend request rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting friend request');
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await axios.post(`${API_URL}/user/remove-friend`,
        {
          userId: user._id,
          friendId
        },
        getAuthHeader()
      );
      setFriends(friends.filter(friend => friend._id !== friendId));
      toast.success('Friend removed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing friend');
    }
  };

  const value = {
    friends,
    friendRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    fetchFriends,
    fetchFriendRequests
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}; 