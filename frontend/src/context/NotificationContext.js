import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user, token, getAuthHeader } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [error, setError] = useState(null);

  // Debug function to log state changes
  const logStateChange = (action, data) => {
    console.log(`[NotificationContext] ${action}:`, {
      notificationsCount: notifications.length,
      unreadCount,
      data
    });
  };

  // Update UI when notifications change
  useEffect(() => {
    console.log('[NotificationContext] Notifications updated:', {
      count: notifications.length,
      unreadCount
    });
  }, [notifications, unreadCount]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) {
      console.log('[Socket] No user or token, skipping socket initialization');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('[Socket] Already connected, skipping initialization');
      return;
    }

    console.log('[Socket] Initializing connection with token:', token.substring(0, 10) + '...');
    const socketInstance = io(API_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected successfully, socket ID:', socketInstance.id);
      setError(null);
      
      // Join user's room
      socketInstance.emit('joinRoom', { roomId: user.id });
      console.log('[Socket] Joined room:', user.id);
      
      // Test socket connection
      socketInstance.emit('test', { message: 'Testing socket connection' });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setError('Failed to connect to notification server');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Listen for test response
    socketInstance.on('testResponse', (data) => {
      console.log('[Socket] Test response received:', data);
    });

    // Listen for new notifications
    socketInstance.on('newNotification', (notification) => {
      console.log('[Socket] New notification received:', notification);
      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        logStateChange('New notification added', { notification, newCount: newNotifications.length });
        return newNotifications;
      });
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('[Socket] Unread count updated:', { old: prev, new: newCount });
        return newCount;
      });
    });

    // Listen for notification count updates
    socketInstance.on('notificationCountUpdated', ({ unreadCount }) => {
      console.log('[Socket] Count update received:', unreadCount);
      setUnreadCount(unreadCount);
    });

    socketRef.current = socketInstance;

    return () => {
      if (socketRef.current) {
        console.log('[Socket] Cleaning up connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, token]); // Only reinitialize if user ID or token changes

  // Separate effect for cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('[Socket] Component unmounting, cleaning up connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('[API] Fetching notifications...');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: getAuthHeader()
      });
      console.log('[API] Notifications fetched:', {
        count: response.data.notifications?.length,
        unreadCount: response.data.unreadCount
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setError(null);
      logStateChange('Initial fetch complete', response.data);
    } catch (error) {
      console.error('[API] Error fetching notifications:', error);
      setError(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on initial load
  useEffect(() => {
    fetchNotifications();
  }, [user, getAuthHeader]);

  // Mark notifications as read
  const markAsRead = async (all = false, notificationIds = []) => {
    try {
      console.log('[API] Marking notifications as read:', { all, notificationIds });
      await axios.patch(`${API_URL}/notifications/read`, {
        all,
        notificationIds
      }, {
        headers: getAuthHeader()
      });

      if (all) {
        setNotifications(prev => {
          const updated = prev.map(notification => ({
            ...notification,
            read: true
          }));
          logStateChange('All notifications marked as read', { newCount: updated.length });
          return updated;
        });
        setUnreadCount(0);
      } else if (notificationIds.length > 0) {
        setNotifications(prev => {
          const updated = prev.map(notification => 
            notificationIds.includes(notification._id)
              ? { ...notification, read: true }
              : notification
          );
          logStateChange('Specific notifications marked as read', { 
            ids: notificationIds,
            newCount: updated.length 
          });
          return updated;
        });
        setUnreadCount(prev => {
          const newCount = prev - notificationIds.length;
          console.log('[State] Unread count updated:', { old: prev, new: newCount });
          return newCount;
        });
      }
    } catch (error) {
      console.error('[API] Error marking notifications as read:', error);
      throw error;
    }
  };

  // Delete notifications
  const deleteNotifications = async (all = false, notificationIds = []) => {
    try {
      if (all) {
        console.log('[API] Deleting all notifications');
        await axios.delete(`${API_URL}/notifications`, {
          headers: getAuthHeader(),
          data: { all: true }
        });
        setNotifications([]);
        setUnreadCount(0);
        logStateChange('All notifications deleted', { newCount: 0 });
      } else if (notificationIds.length > 0) {
        console.log('[API] Deleting specific notifications:', notificationIds);
        await axios.delete(`${API_URL}/notifications`, {
          headers: getAuthHeader(),
          data: { all: false, notificationIds }
        });
        setNotifications(prev => {
          const updated = prev.filter(notification => !notificationIds.includes(notification._id));
          logStateChange('Notifications deleted', { ids: notificationIds, newCount: updated.length });
          return updated;
        });
        setUnreadCount(prev => {
          const deletedUnread = prev.filter(notification => 
            notificationIds.includes(notification._id) && !notification.read
          ).length;
          const newCount = prev - deletedUnread;
          console.log('[State] Unread count updated:', { old: prev, new: newCount });
          return newCount;
        });
      }
    } catch (error) {
      console.error('[API] Error deleting notifications:', error);
      throw error;
    }
  };

  // Fetch more notifications (pagination)
  const fetchMoreNotifications = async (page) => {
    try {
      setLoading(true);
      console.log('[API] Fetching more notifications, page:', page);
      const response = await axios.get(`${API_URL}/notifications?page=${page}`, {
        headers: getAuthHeader()
      });
      
      if (page === 1) {
        setNotifications(response.data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(response.data.notifications || [])]);
      }
      
      setUnreadCount(response.data.unreadCount || 0);
      logStateChange('More notifications fetched', { 
        page,
        newCount: response.data.notifications?.length,
        unreadCount: response.data.unreadCount
      });
      return response.data;
    } catch (error) {
      console.error('[API] Error fetching more notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Provide the socket instance for other components to use
  const getSocket = () => socketRef.current;

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotifications,
    fetchMoreNotifications,
    getSocket
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;