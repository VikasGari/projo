import React, { useState, useRef, useEffect } from "react";
import { IoMdMenu, IoMdNotifications, IoMdChatbubbles, IoMdMoon, IoMdSunny, IoMdPerson, IoMdPeople, IoMdLogOut } from "react-icons/io";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import ChatPopup from "./ChatPopup";
import FriendsPopup from "./FriendsPopup";
import "./Header.css";

function Header({ isSidebarOpen, toggleSidebar, toggleTheme, theme }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriendsPopup, setShowFriendsPopup] = useState(false);
  
  const notificationRef = useRef(null);
  const chatRef = useRef(null);
  const userMenuRef = useRef(null);
  const friendsRef = useRef(null);
  
  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects') return 'Projects';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/teams') return 'Teams';
    if (path.startsWith('/teams/')) return 'Team Details';
    if (path === '/events') return 'Events';
    if (path === '/notes') return 'Notes';
    if (path === '/notes/new') return 'New Note';
    if (path.startsWith('/notes/') && path.endsWith('/edit')) return 'Edit Note';
    if (path.startsWith('/notes/')) return 'Note Details';
    if (path === '/contacts') return 'Contacts';
    if (path === '/codespace') return 'Codespace';
    
    return 'Dashboard';
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChat(false);
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }

      if (friendsRef.current && !friendsRef.current.contains(event.target)) {
        setShowFriendsPopup(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowChat(false);
    setShowUserMenu(false);
    setShowFriendsPopup(false);
  };
  
  const toggleChat = () => {
    setShowChat(!showChat);
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowFriendsPopup(false);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
    setShowChat(false);
    setShowFriendsPopup(false);
  };

  const toggleFriendsPopup = () => {
    setShowFriendsPopup(!showFriendsPopup);
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowChat(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="menu-button">
          <IoMdMenu className="menu-icon" onClick={toggleSidebar} />
        </div>
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>
      
      <div className="header-right">
        {/* Notification Icon */}
        <div className="header-icon-container" ref={notificationRef}>
          <div className="icon-button" onClick={toggleNotifications}>
            <IoMdNotifications className="header-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
          {showNotifications && <NotificationDropdown />}
        </div>
        
        {/* Chat Icon */}
        <div className="header-icon-container" ref={chatRef}>
          <div className="icon-button" onClick={toggleChat}>
            <IoMdChatbubbles className="header-icon" />
          </div>
          {showChat && <ChatPopup />}
        </div>
        
        {/* Theme Toggle */}
        <div className="icon-button theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? <IoMdMoon /> : <IoMdSunny />}
        </div>
        
        {/* User Profile */}
        <div className="user-profile-container" ref={userMenuRef}>
          <div className="user-profile" onClick={toggleUserMenu}>
            <div className="user-avatar">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
            </div>
          </div>
          
          {showUserMenu && (
            <div className="user-menu">
              <Link to="/profile" className="menu-item">
                <IoMdPerson className="menu-icon" />
                <span>Profile</span>
              </Link>
              
              <div className="menu-item" onClick={toggleFriendsPopup} ref={friendsRef}>
                <IoMdPeople className="menu-icon" />
                <span>Friends</span>
              </div>
              
              <div className="menu-divider"></div>
              
              <button onClick={handleLogout} className="menu-item logout">
                <IoMdLogOut className="menu-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {showFriendsPopup && (
            <FriendsPopup onClose={() => setShowFriendsPopup(false)} />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
