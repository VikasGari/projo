import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { getSocket } = useNotifications();
  const [chats, setChats] = useState({
    friend: [],
    team: [],
    project: []
  });
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [socket, setSocket] = useState(null);
  
  // Initialize socket event listeners
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const socketInstance = io(API_URL, {
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setError(null);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setError('Failed to connect to chat server');
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socketInstance.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(socketInstance);
    setLoading(false);

    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Update chat list with latest message
  const updateChatWithLatestMessage = (chatType, chatId, message) => {
    setChats(prev => {
      const chatList = [...prev[chatType]];
      const chatIndex = chatList.findIndex(c => c._id === chatId);
      
      if (chatIndex !== -1) {
        const chat = chatList[chatIndex];
        const updatedChat = {
          ...chat,
          lastMessage: message,
          unreadCount: chat._id === activeChat?.chatId ? 0 : (chat.unreadCount || 0) + 1
        };
        
        // Remove the chat from its current position
        chatList.splice(chatIndex, 1);
        // Add it to the beginning (latest activity first)
        chatList.unshift(updatedChat);
      }
      
      return {
        ...prev,
        [chatType]: chatList
      };
    });
  };
  
  // Fetch all chats
  const fetchChats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch friend chats
      const { data: friendChats } = await axios.get(`${API_URL}/api/chat/friend`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Fetch team chats
      const { data: teamChats } = await axios.get(`${API_URL}/api/chat/team`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Fetch project chats
      const { data: projectChats } = await axios.get(`${API_URL}/api/chat/project`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setChats({
        friend: friendChats || [],
        team: teamChats || [],
        project: projectChats || []
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };
  
  // Load chat messages
  const loadChatMessages = async (chatType, chatId) => {
    try {
      setLoading(true);
      
      // Set the active chat first to improve UX
      setActiveChat({ chatType, chatId });
      
      // Fetch messages based on chat type
      let endpoint = '';
      if (chatType === 'friend') {
        endpoint = `/api/chat/friend/${chatId}`;
      } else if (chatType === 'team') {
        endpoint = `/api/chat/team/${chatId}`;
      } else if (chatType === 'project') {
        endpoint = `/api/chat/project/${chatId}`;
      }
      
      const { data } = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages(data.messages || []);
      
      // Mark as read in the chat list
      setChats(prev => {
        const chatList = [...prev[chatType]];
        const chatIndex = chatList.findIndex(c => c._id === chatId);
        
        if (chatIndex !== -1) {
          chatList[chatIndex] = {
            ...chatList[chatIndex],
            unreadCount: 0
          };
        }
        
        return {
          ...prev,
          [chatType]: chatList
        };
      });
      
      return data;
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async (chatType, chatId, content) => {
    if (!socket) {
      throw new Error('Not connected to chat server');
    }

    try {
      const message = {
        chatType,
        chatId,
        content,
        sender: user._id,
        timestamp: new Date()
      };

      socket.emit('message', message);
      
      // Update the chat list with the new message
      updateChatWithLatestMessage(chatType, chatId, message);
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Send typing indicator
  const sendTypingIndicator = (isTyping = true) => {
    if (!activeChat) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    const eventName = isTyping ? 'typing' : 'stopTyping';
    
    socket.emit(eventName, {
      chatType: activeChat.chatType,
      chatId: activeChat.chatId
    });
  };
  
  // Get typing users for the active chat
  const getActiveTypingUsers = () => {
    if (!activeChat) return [];
    
    const key = `${activeChat.chatType}:${activeChat.chatId}`;
    return typingUsers[key] || [];
  };

  const value = {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading,
    error,
    fetchChats,
    loadChatMessages,
    sendMessage,
    sendTypingIndicator,
    getActiveTypingUsers
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 