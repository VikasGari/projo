import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { 
  IoMdCheckmark, 
  IoMdTrash, 
  IoMdRefresh, 
  IoMdAlert,
  IoMdCalendar,
  IoMdPerson,
  IoMdChatbubbles,
  IoMdCheckmarkCircle,
  IoMdBriefcase,
  IoMdPeople
} from 'react-icons/io';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotifications,
    fetchMoreNotifications 
  } = useNotifications();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead(true);
    }
  }, []);

  const loadMore = async () => {
    const nextPage = page + 1;
    const result = await fetchMoreNotifications(nextPage);
    
    if (result && result.notifications.length > 0) {
      setPage(nextPage);
      setHasMore(nextPage < result.totalPages);
    } else {
      setHasMore(false);
    }
  };

  const handleNotificationClick = (notification) => {
    // If not already read, mark as read
    if (!notification.read) {
      markAsRead(false, [notification._id]);
    }
    
    // Navigate to appropriate page if link is available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <IoMdBriefcase className="notification-icon task" />;
      case 'task_status_changed':
        return <IoMdCheckmarkCircle className="notification-icon status" />;
      case 'event_reminder':
        return <IoMdCalendar className="notification-icon event" />;
      case 'friend_request':
        return <IoMdPerson className="notification-icon friend" />;
      case 'team_invite':
        return <IoMdPeople className="notification-icon team" />;
      case 'project_invite':
        return <IoMdBriefcase className="notification-icon project" />;
      case 'new_message':
        return <IoMdChatbubbles className="notification-icon message" />;
      case 'task_due_soon':
        return <IoMdAlert className="notification-icon alert" />;
      default:
        return <IoMdAlert className="notification-icon default" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <button 
            onClick={() => markAsRead(true)} 
            className="action-btn" 
            title="Mark all as read"
          >
            <IoMdCheckmark />
          </button>
          <button 
            onClick={() => deleteNotifications(true)} 
            className="action-btn" 
            title="Clear all"
          >
            <IoMdTrash />
          </button>
        </div>
      </div>

      <div className="notification-list">
        {loading && <div className="notification-loading">Loading...</div>}
        
        {!loading && notifications.length === 0 && (
          <div className="notification-empty">
            <p>No notifications</p>
          </div>
        )}

        {notifications.map(notification => (
          <div 
            key={notification._id} 
            className={`notification-item ${notification.read ? '' : 'unread'}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-icon-container">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">{formatTimestamp(notification.createdAt)}</div>
            </div>
            <div className="notification-item-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotifications(false, [notification._id]);
                }} 
                className="item-action-btn"
              >
                <IoMdTrash />
              </button>
            </div>
          </div>
        ))}

        {hasMore && (
          <button className="load-more-btn" onClick={loadMore}>
            <IoMdRefresh /> Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown; 