import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamsContext';
import { useProjects } from '../context/ProjectsContext';
import { useTeamChat } from '../context/TeamChatContext';
import { useProjectChat } from '../context/ProjectChatContext';
import { 
  IoMdSend, 
  IoMdPerson, 
  IoMdPeople, 
  IoMdBriefcase,
  IoMdSearch,
  IoMdArrowBack
} from 'react-icons/io';
import './ChatPopup.css';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const ChatPopup = ({ onClose }) => {
  const { 
    chats: friendChats, 
    activeChat, 
    setActiveChat,
    messages: friendMessages, 
    loading: chatLoading, 
    error: chatError, 
    fetchChats, 
    loadChatMessages, 
    sendMessage: sendFriendMessage,
    sendTypingIndicator,
    getActiveTypingUsers
  } = useChat();

  const { teams, loading: teamsLoading, error: teamsError, fetchTeams } = useTeams();
  const { projects, loading: projectsLoading, error: projectsError, fetchProjects } = useProjects();
  
  const { 
    messages: teamMessages, 
    loading: teamChatLoading, 
    error: teamChatError, 
    fetchMessages: fetchTeamMessages,
    sendMessage: sendTeamMessage
  } = useTeamChat();

  const { 
    messages: projectMessages, 
    loading: projectChatLoading, 
    error: projectChatError, 
    fetchMessages: fetchProjectMessages,
    sendMessage: sendProjectMessage
  } = useProjectChat();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friend');
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [teamViews, setTeamViews] = useState([]);
  const [friendViews, setFriendViews] = useState([]);
  const [projectViews, setProjectViews] = useState([]);
  const [isLoadingTeamViews, setIsLoadingTeamViews] = useState(false);
  const [isLoadingFriendViews, setIsLoadingFriendViews] = useState(false);
  const [isLoadingProjectViews, setIsLoadingProjectViews] = useState(false);
  const [hasLoadedTeamViews, setHasLoadedTeamViews] = useState(false);
  const [hasLoadedFriendViews, setHasLoadedFriendViews] = useState(false);
  const [hasLoadedProjectViews, setHasLoadedProjectViews] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'team' && activeChat?.chatType === 'team') {
      setTeamViews(prevViews => {
        return prevViews.map(team => {
          if (team._id === activeChat.chatId) {
            const lastMessage = teamMessages && teamMessages.length > 0 
              ? teamMessages[teamMessages.length - 1] 
              : null;
            
            return {
              ...team,
              lastMessage,
              lastMessageTime: lastMessage?.createdAt || team.lastMessageTime
            };
          }
          return team;
        }).sort((a, b) => {
          const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
          const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
          return new Date(timeB) - new Date(timeA);
        });
      });
    }
  }, [teamMessages, activeChat]);

  useEffect(() => {
    const loadTeamViews = async () => {
      if (activeTab === 'team' && !hasLoadedTeamViews) {
        setIsLoadingTeamViews(true);
        try {
          await fetchTeams();
          
          if (teams && Array.isArray(teams)) {
            const teamViewsData = await Promise.all(
              teams.map(async (team) => {
                try {
                  const messages = await fetchTeamMessages(team._id);
                  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
                  return {
                    _id: team._id,
                    name: team.name,
                    lastMessage,
                    lastMessageTime: lastMessage?.createdAt || team.createdAt,
                    unreadCount: team.unreadCount || 0,
                    members: team.members || []
                  };
                } catch (error) {
                  console.error(`Error fetching messages for team ${team._id}:`, error);
                  return {
                    _id: team._id,
                    name: team.name,
                    lastMessage: null,
                    lastMessageTime: team.createdAt,
                    unreadCount: team.unreadCount || 0,
                    members: team.members || []
                  };
                }
              })
            );

            const sortedTeamViews = teamViewsData.sort((a, b) => {
              const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
              const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
              return new Date(timeB) - new Date(timeA);
            });

            setTeamViews(sortedTeamViews);
            setHasLoadedTeamViews(true);
          }
        } catch (error) {
          console.error('Error loading team views:', error);
        } finally {
          setIsLoadingTeamViews(false);
        }
      }
    };

    loadTeamViews();
  }, [activeTab, teams, hasLoadedTeamViews]);

  useEffect(() => {
    if (activeTab === 'friend' && activeChat?.chatType === 'friend') {
      setFriendViews(prevViews => {
        return prevViews.map(chat => {
          if (chat._id === activeChat.chatId) {
            const lastMessage = friendMessages && friendMessages.length > 0 
              ? friendMessages[friendMessages.length - 1] 
              : null;
            
            return {
              ...chat,
              lastMessage,
              lastMessageTime: lastMessage?.createdAt || chat.lastMessageTime
            };
          }
          return chat;
        }).sort((a, b) => {
          const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
          const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
          return new Date(timeB) - new Date(timeA);
        });
      });
    }
  }, [friendMessages, activeChat]);

  useEffect(() => {
    if (activeTab === 'project' && activeChat?.chatType === 'project') {
      setProjectViews(prevViews => {
        return prevViews.map(project => {
          if (project._id === activeChat.chatId) {
            const lastMessage = projectMessages && projectMessages.length > 0 
              ? projectMessages[projectMessages.length - 1] 
              : null;
            
            return {
              ...project,
              lastMessage,
              lastMessageTime: lastMessage?.createdAt || project.lastMessageTime
            };
          }
          return project;
        }).sort((a, b) => {
          const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
          const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
          return new Date(timeB) - new Date(timeA);
        });
      });
    }
  }, [projectMessages, activeChat]);

  useEffect(() => {
    const loadFriendViews = async () => {
      if (activeTab === 'friend' && !hasLoadedFriendViews) {
        setIsLoadingFriendViews(true);
        try {
          await fetchChats();
          
          if (friendChats && Array.isArray(friendChats)) {
            const friendViewsData = friendChats.map(chat => ({
              ...chat,
              lastMessageTime: chat.lastMessage?.createdAt || chat.createdAt
            })).sort((a, b) => {
              const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
              const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
              return new Date(timeB) - new Date(timeA);
            });

            setFriendViews(friendViewsData);
            setHasLoadedFriendViews(true);
          }
        } catch (error) {
          console.error('Error loading friend views:', error);
        } finally {
          setIsLoadingFriendViews(false);
        }
      }
    };

    loadFriendViews();
  }, [activeTab, friendChats, hasLoadedFriendViews]);

  useEffect(() => {
    const loadProjectViews = async () => {
      if (activeTab === 'project' && !hasLoadedProjectViews) {
        setIsLoadingProjectViews(true);
        try {
          await fetchProjects();
          
          if (projects && Array.isArray(projects)) {
            const projectViewsData = await Promise.all(
              projects.map(async (project) => {
                try {
                  const messages = await fetchProjectMessages(project._id);
                  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
                  return {
                    _id: project._id,
                    name: project.name,
                    lastMessage,
                    lastMessageTime: lastMessage?.createdAt || project.createdAt,
                    unreadCount: project.unreadCount || 0,
                    members: project.members || []
                  };
                } catch (error) {
                  console.error(`Error fetching messages for project ${project._id}:`, error);
                  return {
                    _id: project._id,
                    name: project.name,
                    lastMessage: null,
                    lastMessageTime: project.createdAt,
                    unreadCount: project.unreadCount || 0,
                    members: project.members || []
                  };
                }
              })
            );

            const sortedProjectViews = projectViewsData.sort((a, b) => {
              const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
              const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
              return new Date(timeB) - new Date(timeA);
            });

            setProjectViews(sortedProjectViews);
            setHasLoadedProjectViews(true);
          }
        } catch (error) {
          console.error('Error loading project views:', error);
        } finally {
          setIsLoadingProjectViews(false);
        }
      }
    };

    loadProjectViews();
  }, [activeTab, projects, hasLoadedProjectViews]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [friendMessages, teamMessages, projectMessages]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveChat(null);
    
    if (tab === 'friend' && !hasLoadedFriendViews) {
      setIsLoadingFriendViews(true);
    } else if (tab === 'team' && !hasLoadedTeamViews) {
      setIsLoadingTeamViews(true);
    } else if (tab === 'project' && !hasLoadedProjectViews) {
      setIsLoadingProjectViews(true);
    }
  };
  
  const handleChatSelect = async (chat) => {
    if (activeTab === 'friend') {
      await loadChatMessages('friend', chat._id);
    } else if (activeTab === 'team') {
      setActiveChat({ chatType: 'team', chatId: chat._id });
    } else if (activeTab === 'project') {
      setActiveChat({ chatType: 'project', chatId: chat._id });
    }
  };
  
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    
    try {
      if (activeTab === 'friend') {
        const response = await sendFriendMessage(activeChat.chatType, activeChat.chatId, messageInput);
        setFriendViews(prevViews => {
          return prevViews.map(chat => {
            if (chat._id === activeChat.chatId) {
              return {
                ...chat,
                lastMessage: {
                  content: messageInput,
                  createdAt: new Date().toISOString(),
                  sender: user
                },
                lastMessageTime: new Date().toISOString()
              };
            }
            return chat;
          }).sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
            const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
            return new Date(timeB) - new Date(timeA);
          });
        });
      } else if (activeTab === 'team') {
        const response = await sendTeamMessage(activeChat.chatId, messageInput);
        setTeamViews(prevViews => {
          return prevViews.map(team => {
            if (team._id === activeChat.chatId) {
              const lastMessage = response?.chat?.messages?.[response.chat.messages.length - 1];
              return {
                ...team,
                lastMessage,
                lastMessageTime: lastMessage?.createdAt || team.lastMessageTime
              };
            }
            return team;
          }).sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
            const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
            return new Date(timeB) - new Date(timeA);
          });
        });
      } else if (activeTab === 'project') {
        const response = await sendProjectMessage(activeChat.chatId, messageInput);
        setProjectViews(prevViews => {
          return prevViews.map(project => {
            if (project._id === activeChat.chatId) {
              const lastMessage = response?.chat?.messages?.[response.chat.messages.length - 1];
              return {
                ...project,
                lastMessage,
                lastMessageTime: lastMessage?.createdAt || project.lastMessageTime
              };
            }
            return project;
          }).sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.lastMessageTime || 0;
            const timeB = b.lastMessage?.createdAt || b.lastMessageTime || 0;
            return new Date(timeB) - new Date(timeA);
          });
        });
      }
    setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
      
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      }
      
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
        sendTypingIndicator(false);
    }, 3000);
  };
  
  const getCurrentMessages = () => {
    switch (activeTab) {
      case 'friend':
        return friendMessages;
      case 'team':
        return teamMessages;
      case 'project':
        return projectMessages;
      default:
        return [];
    }
  };
  
  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'friend':
        return chatLoading;
      case 'team':
        return teamChatLoading;
      case 'project':
        return projectChatLoading;
      default:
        return false;
    }
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  const renderChatList = () => {
    if (activeTab === 'friend') {
      if (isLoadingFriendViews) {
        return (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading friend chats...</p>
          </div>
        );
      }

      if (!friendViews || friendViews.length === 0) {
        if (chatError) {
          return <div className="error">Error loading chats: {chatError}</div>;
        }
        return <div className="no-chats">No friend chats available</div>;
      }

      return friendViews.map(chat => {
        const chatName = chat.participants?.find(p => p._id !== user._id)?.name;
        const lastMessageTime = chat.lastMessage?.createdAt 
          ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })
          : '';

  return (
          <div
            key={chat._id}
            className={`chat-item ${activeChat?.chatId === chat._id ? 'active' : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className="chat-avatar">
              <img 
                src={chat.participants?.find(p => p._id !== user._id)?.avatar} 
                alt={chatName || 'User'} 
              />
            </div>
            <div className="chat-info">
              <div className="chat-name">{chatName || 'Unknown'}</div>
              <div className="chat-preview">
                {chat.lastMessage?.content || 'No messages yet'}
                {lastMessageTime && (
                  <span className="message-time"> · {lastMessageTime}</span>
                )}
              </div>
            </div>
            {chat.unreadCount > 0 && (
              <div className="unread-count">{chat.unreadCount}</div>
            )}
          </div>
        );
      });
    }

    if (activeTab === 'project') {
      if (isLoadingProjectViews) {
        return (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading project chats...</p>
          </div>
        );
      }

      if (!projectViews || projectViews.length === 0) {
        if (projectsError) {
          return <div className="error">Error loading projects: {projectsError}</div>;
        }
        return <div className="no-chats">No projects available</div>;
      }

      return projectViews.map(project => {
        const lastMessageContent = project.lastMessage?.content || 'No messages yet';
        const lastMessageTime = project.lastMessage?.createdAt 
          ? formatDistanceToNow(new Date(project.lastMessage.createdAt), { addSuffix: true })
          : '';
        
        return (
          <div
            key={project._id}
            className={`chat-item ${activeChat?.chatId === project._id ? 'active' : ''}`}
            onClick={() => handleChatSelect(project)}
          >
            <div className="chat-avatar">
              <div className="group-avatar">
                {project.name?.charAt(0).toUpperCase() || '?'}
              </div>
                    </div>
            <div className="chat-info">
              <div className="chat-name">{project.name || 'Unknown Project'}</div>
              <div className="chat-preview">
                {lastMessageContent}
                {lastMessageTime && (
                  <span className="message-time"> · {lastMessageTime}</span>
                )}
                    </div>
                  </div>
            {project.unreadCount > 0 && (
              <div className="unread-count">{project.unreadCount}</div>
                    )}
                  </div>
        );
      });
    }

    if (activeTab === 'team') {
      if (isLoadingTeamViews) {
        return (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading team chats...</p>
          </div>
        );
      }

      if (!teamViews || teamViews.length === 0) {
        if (teamsError) {
          return <div className="error">Error loading teams: {teamsError}</div>;
        }
        return <div className="no-chats">No teams available</div>;
      }

      return teamViews.map(team => {
        const lastMessageContent = team.lastMessage?.content || 'No messages yet';
        const lastMessageTime = team.lastMessage?.createdAt 
          ? formatDistanceToNow(new Date(team.lastMessage.createdAt), { addSuffix: true })
          : '';
        
        return (
          <div
            key={team._id}
            className={`chat-item ${activeChat?.chatId === team._id ? 'active' : ''}`}
            onClick={() => handleChatSelect(team)}
          >
            <div className="chat-avatar">
              <div className="group-avatar">
                {team.name?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>
            <div className="chat-info">
              <div className="chat-name">{team.name || 'Unknown Team'}</div>
              <div className="chat-preview">
                {lastMessageContent}
                {lastMessageTime && (
                  <span className="message-time"> · {lastMessageTime}</span>
                )}
              </div>
            </div>
            {team.unreadCount > 0 && (
              <div className="unread-count">{team.unreadCount}</div>
            )}
          </div>
        );
      });
    }
  };
  
  const renderMessages = () => {
    if (!activeChat) {
      return <div className="no-chat-selected">Select a chat to start messaging</div>;
    }
    
    if (getCurrentLoading()) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      );
    }
    
    const currentMessages = getCurrentMessages();
    
    return (
      <div className="chat-container">
        <div className="chat-messages">
          {currentMessages && currentMessages.length > 0 ? (
            currentMessages.map((message) => (
              <div 
                key={message._id} 
                className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
              >
                <div className="sender-avatar">
                  {message.sender.profile_image ? (
                    <img src={message.sender.profile_image} alt={message.sender.name} />
                  ) : (
                    <span>{message.sender.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-header">
                    <span className="sender-name">{message.sender.name}</span>
                    <span className="message-time">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-placeholder">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
        <form className="chat-input" onSubmit={handleMessageSubmit}>
            <input
              type="text"
              value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            disabled={!activeChat}
            />
          <button 
            type="submit" 
            disabled={!messageInput.trim() || !activeChat}
          >
              <IoMdSend />
            </button>
          </form>
        </div>
    );
  };
  
  const renderTypingIndicator = () => {
    const typingUsers = getActiveTypingUsers();
    if (typingUsers.length === 0) return null;
    
    return (
      <div className="typing-indicator">
        {typingUsers.length === 1
          ? `${typingUsers[0]} is typing...`
          : `${typingUsers.length} people are typing...`}
      </div>
    );
  };
  
  const getChatName = () => {
    if (!activeChat) return 'Chats';
    
    switch (activeChat.chatType) {
      case 'friend':
        const friendChat = friendViews.find(chat => chat._id === activeChat.chatId);
        return friendChat?.participants?.find(p => p._id !== user._id)?.name || 'Unknown';
      case 'team':
        const teamChat = teamViews.find(team => team._id === activeChat.chatId);
        return teamChat?.name || 'Unknown Team';
      case 'project':
        const projectChat = projectViews.find(project => project._id === activeChat.chatId);
        return projectChat?.name || 'Unknown Project';
      default:
        return 'Chats';
    }
  };

  const handleBack = () => {
    if (activeChat) {
      setActiveChat(null);
    } else {
      onClose();
    }
  };
  
  return (
    <div className="chat-popup">
      <div className="chat-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h3>{getChatName()}</h3>
      </div>
      
      {!activeChat && (
        <div className="chat-tabs">
          <button 
            className={activeTab === 'friend' ? 'active' : ''}
            onClick={() => handleTabChange('friend')}
          >
            Friends
          </button>
          <button 
            className={activeTab === 'team' ? 'active' : ''}
            onClick={() => handleTabChange('team')}
          >
            Teams
          </button>
          <button 
            className={activeTab === 'project' ? 'active' : ''}
            onClick={() => handleTabChange('project')}
          >
            Projects
          </button>
        </div>
      )}
      
      <div className="chat-content">
        <div className={`chat-list ${activeChat ? 'hidden' : ''}`}>
          {renderChatList()}
        </div>
        
        <div className={`chat-messages ${!activeChat ? 'hidden' : ''}`}>
          {renderMessages()}
          {renderTypingIndicator()}
        </div>
      </div>
    </div>
  );
};

export default ChatPopup; 