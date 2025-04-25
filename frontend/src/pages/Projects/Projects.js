import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { useTeams } from '../../context/TeamsContext';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { BsGrid3X3Gap, BsList, BsPlus, BsX, BsCheck2, BsXCircle } from 'react-icons/bs';
import './Projects.css';
import { toast } from 'react-toastify';
import ProjectCard from './components/ProjectCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const InviteMembersModal = ({ onClose, onInvite, projectId }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { user } = useAuth();
  const { friends = [] } = useFriends();
  const { teams } = useTeams();
  const { projects } = useProjects();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Get all potential users from friends, team members, and project members
    const allUsers = new Set();
    
    // Add friends
    friends.forEach(friend => allUsers.add(friend._id));
    
    // Add team members
    teams.forEach(team => {
      team.members.forEach(member => allUsers.add(member._id));
    });
    
    // Add project members
    projects.forEach(project => {
      project.members.forEach(member => allUsers.add(member._id));
    });

    // Filter users based on search query
    const filteredUsers = Array.from(allUsers).filter(userId => {
      const user = friends.find(f => f._id === userId) ||
                  teams.flatMap(t => t.members).find(m => m._id === userId) ||
                  projects.flatMap(p => p.members).find(m => m._id === userId);
      return user && (
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
    });

    setSearchResults(filteredUsers);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() && selectedUsers.length === 0) return;
    
    setInviteLoading(true);
    try {
      if (inviteEmail.trim()) {
        await onInvite(projectId, inviteEmail);
        setInviteEmail('');
      }
      
      if (selectedUsers.length > 0) {
        await Promise.all(selectedUsers.map(userId => onInvite(projectId, userId)));
        setSelectedUsers([]);
      }
      
      onClose();
    } catch (error) {
      console.error('Error inviting members:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Invite Members</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Search Users</label>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(userId => {
                    const user = friends.find(f => f._id === userId) ||
                              teams.flatMap(t => t.members).find(m => m._id === userId) ||
                              projects.flatMap(p => p.members).find(m => m._id === userId);
                    return (
                      <div key={userId} className="search-result-item">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.profile_image ? (
                              <img src={user.profile_image} alt={user.name} />
                            ) : (
                              <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <h4>{user.name}</h4>
                            <p>{user.email}</p>
                          </div>
                        </div>
                        <button
                          className={`select-btn ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                          onClick={() => {
                            if (selectedUsers.includes(userId)) {
                              setSelectedUsers(selectedUsers.filter(id => id !== userId));
                            } else {
                              setSelectedUsers([...selectedUsers, userId]);
                            }
                          }}
                        >
                          {selectedUsers.includes(userId) ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Or Invite by Email</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleInvite}
              disabled={inviteLoading || (!inviteEmail.trim() && selectedUsers.length === 0)}
            >
              {inviteLoading ? 'Inviting...' : 'Invite Members'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Join Requests Modal Component
const JoinRequestsModal = ({ onClose, requests = [], onAccept, onReject, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Project Join Requests</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="loading-state">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">No pending join requests</div>
            ) : (
              <div className="requests-list">
                {requests.map(request => (
                  <div key={request._id} className="request-item">
                    <div className="request-info">
                      <div className="user-info">
                        <img 
                          src={request.user?.profile_image || '/default-avatar.png'} 
                          alt={request.user?.name} 
                          className="user-avatar"
                        />
                        <div className="user-details">
                          <h4>{request.user?.name}</h4>
                          <p>{request.user?.email}</p>
                        </div>
                      </div>
                      <div className="project-info">
                        <span>Project: {request.project?.name}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => onAccept(request.project._id)}
                      >
                        <BsCheck2 /> Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => onReject(request.project._id)}
                      >
                        <BsXCircle /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Project Modal Component
const CreateProjectModal = ({ onClose, onCreate, teams = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamId: '',
    status: 'future',
    startTime: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.teamId) {
      toast.error('Project name and team are required');
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Create New Project</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Team</label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
              >
                <option value="">Select a team</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="future">Future</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
            {formData.status === 'future' && (
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
            )}
            {formData.status === 'ongoing' && (
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams = [] } = useTeams();
  const { 
    projects = [], 
    loading, 
    error, 
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    inviteMember,
    fetchReceivedRequests,
    handleAcceptRequest: acceptRequest,
    handleRejectRequest: rejectRequest
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [receivedJoinRequests, setReceivedJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    teamId: '',
    status: 'ongoing',
    deadline: ''
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'future',
    startTime: '',
    deadline: '',
    teamId: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Only fetch projects once when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const loadJoinRequests = async () => {
    setJoinRequestsLoading(true);
    try {
      const requests = await fetchReceivedRequests();
      setReceivedJoinRequests(requests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to fetch join requests');
      setReceivedJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  const acceptJoinRequest = async (projectId) => {
    try {
      await acceptRequest(projectId);
      await Promise.all([fetchProjects(), loadJoinRequests()]);
      toast.success('Request accepted successfully');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept join request');
    }
  };

  const rejectJoinRequest = async (projectId) => {
    try {
      await rejectRequest(projectId);
      await loadJoinRequests();
      toast.success('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject join request');
    }
  };

  useEffect(() => {
    if (user) {
      loadJoinRequests();
    }
  }, [user]);

  const handleCreateProject = async (formData) => {
    try {
      await createProject(formData);
      setShowCreateModal(false);
      fetchProjects();
      toast.success('Project created successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to create project');
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await updateProject(projectId, { status: newStatus });
      toast.success('Project status updated successfully');
      fetchProjects();
    } catch (error) {
      toast.error(error.message || 'Failed to update project status');
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowCreateModal(true);
  };

  const handleUpdateProject = async () => {
    try {
      await updateProject(currentProject._id, editFormData);
      setShowEditModal(false);
      setCurrentProject(null);
      fetchProjects();
    } catch (error) {
      toast.error(error.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(project._id);
        toast.success('Project deleted successfully');
      } catch (error) {
        toast.error('Failed to delete project');
        console.error('Error deleting project:', error);
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'my' && project.admin._id === user?._id) ||
      (filterBy === 'member' && project.members?.some(m => m._id === user?._id)) ||
      (filterBy === 'active' && project.status === 'ongoing') ||
      (filterBy === 'pending' && project.status === 'future') ||
      (filterBy === 'completed' && project.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'members':
        return b.members.length - a.members.length;
      case 'tasks':
        return b.tasks.length - a.tasks.length;
      case 'deadline':
        return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="loading-state">Loading projects...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="page-container projects-page">
      <div className="projects-controls filters-container">
        <div className="projects-filter-controls view-toggle">
        <select
          className="filter-select"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
        >
          <option value="all">All Projects</option>
          <option value="my">My Projects</option>
          <option value="member">Member Projects</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
            <option value="members">Sort by Members</option>
            <option value="tasks">Sort by Tasks</option>
          <option value="deadline">Sort by Deadline</option>
            <option value="recent">Sort by Recent</option>
        </select>
        </div>

        <div className="projects-search search-container">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="view-toggle">
          <button 
            className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <BsGrid3X3Gap size={18} />
          </button>
          <button 
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <BsList size={18} />
          </button>
        </div>

        <div className="page-actions">
          <button
            className="action-button secondary"
            onClick={() => setShowJoinRequestsModal(true)}
          >
            Join Requests
            {receivedJoinRequests.length > 0 && (
              <span className="badge badge-error">{receivedJoinRequests.length}</span>
            )}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="action-button primary">
            <BsPlus /> Create Project
          </button>
        </div>
      </div>

      <div className="projects-content">
        {viewMode === 'grid' ? (
          <div className="projects-grid">
            {sortedProjects.map(project => (
              <Link to={`/projects/${project._id}`} key={project._id}>
                <ProjectCard
                  project={project}
                  isCreator={project.admin._id === user?._id}
                  view="grid"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="projects-list">
            {sortedProjects.map(project => (
              <Link to={`/projects/${project._id}`} key={project._id}>
                <ProjectCard
                project={project}
                  isCreator={project.admin._id === user?._id}
                  view="list"
              />
              </Link>
            ))}
          </div>
        )}

        {sortedProjects.length === 0 && (
          <div className="projects-empty">
            <p>No projects found. Create a new project to get started!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
          teams={teams}
        />
      )}

      {showJoinRequestsModal && (
        <JoinRequestsModal
          onClose={() => setShowJoinRequestsModal(false)}
          requests={receivedJoinRequests}
          onAccept={acceptJoinRequest}
          onReject={rejectJoinRequest}
          loading={joinRequestsLoading}
        />
      )}
    </div>
  );
};

export default Projects; 