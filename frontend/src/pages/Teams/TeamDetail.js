import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTeams } from '../../context/TeamsContext';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useTeamChat } from '../../context/TeamChatContext';
import { BsArrowLeft, BsThreeDots, BsPlusLg, BsX, BsCheck2, BsArrowRepeat, BsPerson, BsArrowDown, BsArrowUp, BsTrash, BsPersonPlus, BsPencil, BsChatDots, BsList, BsSend, BsXCircle, BsFolder } from 'react-icons/bs';
import { toast } from 'react-toastify';
import '../../styles/DetailPage.css';
import { formatDistanceToNow } from 'date-fns';

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    teams, 
    loading, 
    error, 
    fetchTeamById,
    updateTeam,
    fetchTeams,
    addMember,
    removeMember,
    addSubAdmin,
    removeSubAdmin,
    fetchJoinRequests,
    inviteMember,
    acceptJoinRequest,
    rejectJoinRequest,
    getTeam,
    deleteTeam
  } = useTeams();
  const { friends = [], sendFriendRequest, fetchFriends } = useFriends();
  const { 
    messages, 
    loading: chatLoading, 
    error: chatError, 
    fetchMessages, 
    sendMessage, 
    markMessagesAsRead, 
    sendingMessage,
    setMessages
  } = useTeamChat();
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [team, setTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  });
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const actionMenuRef = useRef(null);

  const loadTeamData = useCallback(async () => {
    try {
      const teamData = await fetchTeamById(teamId);
      setTeam(teamData);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    }
  }, [teamId, fetchTeamById]);

  const loadJoinRequests = async () => {
    setJoinRequestsLoading(true);
    try {
      const requests = await fetchJoinRequests();
      const teamRequests = Array.isArray(requests) 
        ? requests.filter(request => request.team?._id === teamId)
        : [];
      setJoinRequests(teamRequests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to fetch join requests');
      setJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadTeamData();
      loadJoinRequests();
    }
  }, [teamId, loadTeamData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBackToTeams = () => {
    navigate('/teams');
  };

  const handleEditTeam = () => {
    if (!team) return;
    
    if (!isAdmin) {
      toast.error('You are not authorized to edit this team');
      return;
    }
    
    setEditFormData({
      name: team.name || '',
      description: team.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!team?._id) return;
    
    try {
      const updatedTeam = await updateTeam(team._id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
      });
      
      setTeam(updatedTeam);
      setShowEditModal(false);
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error(error.response?.data?.message || 'Failed to update team');
    }
  };

  const handleInviteMember = async (email) => {
    if (!team?._id) return;
    
    try {
      await inviteMember(team._id, email);
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptJoinRequest(requestId);
      await Promise.all([loadTeamData(), loadJoinRequests()]);
      toast.success('Request accepted successfully');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept join request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectJoinRequest(requestId);
      await loadJoinRequests();
      toast.success('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject join request');
    }
  };

  const handlePromoteMember = async (teamId, memberId) => {
    try {
      const updatedTeam = await addSubAdmin(teamId, memberId);
      setTeam(updatedTeam);
      toast.success('Member promoted to sub-admin');
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error(error.message || 'Failed to promote member');
    }
  };

  const handleDemoteMember = async (teamId, memberId) => {
    try {
      const updatedTeam = await removeSubAdmin(teamId, memberId);
      setTeam(updatedTeam);
      toast.success('Sub-admin demoted to member');
    } catch (error) {
      console.error('Error demoting member:', error);
      toast.error(error.message || 'Failed to demote member');
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    try {
      await removeMember(teamId, memberId);
      setTeam(prev => ({
        ...prev,
        members: prev.members.filter(member => member._id !== memberId)
      }));
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team?._id) return;
    
    if (!isAdmin) {
      toast.error('You are not authorized to delete this team');
      return;
    }

    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(team._id);
        toast.success('Team deleted successfully');
        navigate('/teams');
      } catch (error) {
        console.error('Error deleting team:', error);
        toast.error(error.response?.data?.message || 'Failed to delete team');
      }
    }
  };

  const isAdmin = team?.admin?._id && user?._id ? team.admin._id.toString() === user._id.toString() : false;

  const MemberCard = ({ member, team, isAdmin, onPromote, onDemote, onRemove }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { friends = [], sendFriendRequest } = useFriends();
    const isFriend = Array.isArray(friends) && friends.some(friend => friend._id === member._id);
    const isCurrentUser = user?._id === member._id;
    const isAdminMember = team?.admin?._id === member._id;
    const isSubAdmin = Array.isArray(team?.subAdmins) && team.subAdmins.includes(member._id);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const actionMenuRef = useRef(null);

    // Debug logs to check subadmin status
    useEffect(() => {
      console.log('Member:', member._id);
      console.log('SubAdmins:', team?.subAdmins);
      console.log('Is SubAdmin:', isSubAdmin);
      console.log('Member ID Type:', typeof member._id);
      console.log('SubAdmin IDs Type:', team?.subAdmins?.map(id => typeof id));
    }, [member._id, team?.subAdmins, isSubAdmin]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
          setShowActionMenu(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleViewProfile = () => {
      navigate(`/profile/${member._id}`);
      setShowActionMenu(false);
    };

    const handleSendFriendRequest = async () => {
      if (loadingAction) return;
      
      setLoadingAction('friend');
      try {
        await sendFriendRequest(member._id);
        // Refresh the friends list after sending request
        await fetchFriends();
        toast.success('Friend request sent successfully');
      } catch (error) {
        console.error('Error sending friend request:', error);
        toast.error(error.response?.data?.message || 'Failed to send friend request');
      } finally {
        setLoadingAction(null);
        setShowActionMenu(false);
      }
    };

    const handlePromote = async () => {
      if (loadingAction) return;
      
      setLoadingAction('promote');
      try {
        await onPromote(team._id, member._id);
        // Refresh the team data after promotion
        const updatedTeam = await fetchTeamById(team._id);
        setTeam(updatedTeam);
      } catch (error) {
        console.error('Error promoting member:', error);
        toast.error(error.message || 'Failed to promote member');
      } finally {
        setLoadingAction(null);
        setShowActionMenu(false);
      }
    };

    const handleDemote = async () => {
      if (loadingAction) return;
      
      setLoadingAction('demote');
      try {
        await onDemote(team._id, member._id);
        // Refresh the team data after demotion
        const updatedTeam = await fetchTeamById(team._id);
        setTeam(updatedTeam);
      } catch (error) {
        console.error('Error demoting member:', error);
        toast.error(error.message || 'Failed to demote member');
      } finally {
        setLoadingAction(null);
        setShowActionMenu(false);
      }
    };

    const handleRemove = async () => {
      if (loadingAction) return;
      
      setLoadingAction('remove');
      try {
        await onRemove(team._id, member._id);
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error(error.message || 'Failed to remove member');
      } finally {
        setLoadingAction(null);
        setShowActionMenu(false);
      }
    };

    // Add null checks and default values
    const memberName = member?.name || 'Unknown User';
    const memberEmail = member?.email || 'No email';
    const profileImage = member?.profile_image;

    return (
      <div className="member-card">
        <div className="member-avatar">
          {profileImage ? (
            <img src={profileImage} alt={memberName} />
          ) : (
            <span>{memberName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="member-info">
          <div className="member-details">
            <h4>{memberName}</h4>
            <p>{memberEmail}</p>
            <div className="member-badges">
              {isCurrentUser && <p className="you-badge">You</p>}
              {isAdminMember && <p className="admin-badge">Admin</p>}
              {isSubAdmin && <p className="subadmin-badge">Sub-Admin</p>}
            </div>
          </div>
        </div>
        <div className="member-actions" ref={actionMenuRef}>
          <button 
            className="action-btn"
            onClick={() => setShowActionMenu(!showActionMenu)}
            title="Actions"
            disabled={!!loadingAction}
          >
            <BsThreeDots />
          </button>
          {showActionMenu && (
            <div className="action-menu">
              <div 
                className="action-menu-item"
                onClick={handleViewProfile}
                disabled={!!loadingAction}
              >
                <BsPerson /> View Profile
              </div>
              {!isCurrentUser && !isFriend && (
                <div 
                  className="action-menu-item"
                  onClick={handleSendFriendRequest}
                  disabled={!!loadingAction}
                >
                  {loadingAction === 'friend' ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <BsPersonPlus />
                  )} Add Friend
                </div>
              )}
              {isAdmin && !isCurrentUser && !isAdminMember && (
                <>
                  {!isSubAdmin ? (
                    <div 
                      className="action-menu-item"
                      onClick={handlePromote}
                      disabled={!!loadingAction}
                    >
                      {loadingAction === 'promote' ? (
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <BsArrowUp />
                      )} Promote to Sub-Admin
                    </div>
                  ) : (
                    <div 
                      className="action-menu-item"
                      onClick={handleDemote}
                      disabled={!!loadingAction}
                    >
                      {loadingAction === 'demote' ? (
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <BsArrowDown />
                      )} Demote from Sub-Admin
                    </div>
                  )}
                  <div 
                    className="action-menu-item danger"
                    onClick={handleRemove}
                    disabled={!!loadingAction}
                  >
                    {loadingAction === 'remove' ? (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <BsTrash />
                    )} Remove Member
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !team?._id) return;

    try {
      setIsChatLoading(true);
      const response = await sendMessage(team._id, newMessage);
      setNewMessage('');
      // Update messages directly from the response instead of refetching
      if (response?.chat?.messages) {
        setMessages(response.chat.messages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (team?._id && activeTab === 'chat') {
      fetchMessages(team._id);
    }
  }, [team?._id, activeTab, fetchMessages]);

  useEffect(() => {
    if (team?._id && activeTab === 'chat' && messages.length > 0) {
      markMessagesAsRead(team._id);
    }
  }, [team?._id, activeTab, messages.length, markMessagesAsRead]);

  const renderChat = () => {
    if (chatLoading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      );
    }

    if (chatError) {
      return (
        <div className="error-state">
          <p>{chatError}</p>
          <button className="retry-button" onClick={() => fetchMessages(team._id)}>
            <BsArrowRepeat /> Retry
          </button>
        </div>
      );
    }

    return (
      <div className="chat-container">
        <div className="chat-messages">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
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
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendingMessage}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <BsSend />
            )}
          </button>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-button" onClick={loadTeamData}>
            <BsArrowRepeat /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>Team not found</p>
          <button className="retry-button" onClick={handleBackToTeams}>
            <BsArrowLeft /> Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBackToTeams}>
            <BsArrowLeft /> Back to Teams
          </button>
          {isAdmin && (
            <div className="detail-actions">
              <button className="action-button" onClick={handleEditTeam}>
                <BsPencil /> Edit Team
              </button>
              <button className="action-button" onClick={() => setShowInviteModal(true)}>
                <BsPersonPlus /> Invite
              </button>
              <button className="action-button danger" onClick={handleDeleteTeam}>
                <BsTrash /> Delete Team
              </button>
            </div>
          )}
        </div>
        <div className="detail-info">
          <div className="detail-title">
            <h1>{team?.name}</h1>
            <div className="detail-meta">
              <span className="member-count">{team?.members?.length || 0} members</span>
            </div>
          </div>
          {team?.description && (
            <div className="detail-description">
              <p>{team.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="detail-tabs">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <BsPerson className="tab-icon" />
            <span>Members</span>
            {team?.members?.length > 0 && (
              <span className="tab-badge">{team.members.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <BsFolder className="tab-icon" />
            <span>Projects</span>
            {team?.projects?.length > 0 && (
              <span className="tab-badge">{team.projects.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <BsChatDots className="tab-icon" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'members' && (
          <div className="members-container">
            <div className="members-list">
              {team?.members?.length > 0 ? (
                team.members.map(member => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    team={team}
                    isAdmin={isAdmin}
                    onPromote={handlePromoteMember}
                    onDemote={handleDemoteMember}
                    onRemove={handleRemoveMember}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>No members in this team yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-container">
            <div className="projects-list">
              {team?.projects?.length > 0 ? (
                team.projects.map(project => (
                  <Link to={`/projects/${project._id}`} key={project._id}>
                    <div className="project-card">
                      <div className="project-header">
                        <div className="project-title-wrap">
                          <h3>{project.name}</h3>
                          <span 
                            className="project-status"
                            style={{ 
                              backgroundColor: project.status === 'future' ? 'var(--warning-light)' : 
                                            project.status === 'ongoing' ? 'var(--success-light)' : 
                                            'var(--info-light)',
                              color: project.status === 'future' ? 'var(--warning)' : 
                                    project.status === 'ongoing' ? 'var(--success)' : 
                                    'var(--info)'
                            }}
                          >
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <div className="project-times">
                        <div className="time-group">
                          <div className="time-info">
                            <span className="time-label">Start Time</span>
                            <span className="time-value">
                              {project.startTime ? new Date(project.startTime).toLocaleDateString() : 'Not set'}
                            </span>
                          </div>
                        </div>
                        <div className="time-group">
                          <div className="time-info">
                            <span className="time-label">End Time</span>
                            <span className="time-value">
                              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="project-footer">
                        <div className="project-meta">
                          <span>{project.members?.length || 0} Members</span>
                          <span className="separator">•</span>
                          <span>{project.tasks?.length || 0} Tasks</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <p>No projects in this team yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            {renderChat()}
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Invite Member</h3>
                <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                  <BsX />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  handleInviteMember(email);
                  setShowInviteModal(false);
                }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter user's email"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowInviteModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-button">
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Team</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <BsX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Team Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter team name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Enter team description"
                    rows="4"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="submit-button" onClick={handleUpdateTeam}>
                  Update Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail; 