import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const TeamChatContext = createContext();

export const useTeamChat = () => useContext(TeamChatContext);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const TeamChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeader } = useAuth();

  const fetchMessages = useCallback(async (teamId) => {
    if (!teamId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/team-chat/${teamId}`, {
        headers: getAuthHeader()
      });
      
      if (!response.data._id) {
        setMessages([]);
        return [];
      }
      
      const messages = response.data.messages || [];
      setMessages(messages);
      return messages;
    } catch (err) {
      console.error('Error fetching messages:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load messages';
      setError(errorMessage);
      
      if (err.response?.status === 403) {
        toast.error('You do not have access to this team chat');
      } else if (err.response?.status === 404) {
        toast.error('Team not found');
      } else {
        toast.error(errorMessage);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  const sendMessage = useCallback(async (teamId, content) => {
    if (!teamId || !content.trim()) return;
    
    setSendingMessage(true);
    try {
      const response = await axios.post(
        `${API_URL}/team-chat/message`,
        { 
          teamId,
          content: content.trim()
        },
        { 
          headers: getAuthHeader()
        }
      );
      
      if (response.data.chat) {
        setMessages(response.data.chat.messages || []);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [getAuthHeader]);

  const markMessagesAsRead = useCallback(async (teamId) => {
    if (!teamId) return;
    
    try {
      await axios.patch(
        `${API_URL}/team-chat/read`,
        { teamId },
        { headers: getAuthHeader() }
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [getAuthHeader]);

  const value = {
    messages,
    loading,
    sendingMessage,
    error,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    setMessages
  };

  return (
    <TeamChatContext.Provider value={value}>
      {children}
    </TeamChatContext.Provider>
  );
}; 