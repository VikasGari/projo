import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeams } from '../../context/TeamsContext';
import { BsGrid3X3Gap, BsList, BsX, BsCheck2, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import CreateTeamModal from './components/CreateTeamModal';
import TeamCard from './components/TeamCard';
import './teams.css';

// Join Requests Modal Component
const JoinRequestsModal = ({ onClose, requests = [], onAccept, onReject, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Team Join Requests</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            {requests.length === 0 ? (
              <div className="no-requests">
                <p>No pending team join requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <div key={request._id} className="request-item">
                    <div className="request-info">
                      <h4>{request.team.name}</h4>
                      <p>Requested by: {request.requestedBy.name}</p>
                      <p className="request-time">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => onAccept(request.team._id)}
                        disabled={loading}
                      >
                        <BsCheck2 /> Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => onReject(request.team._id)}
                        disabled={loading}
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

const Teams = () => {
  const { user } = useAuth();
  const { 
    teams, 
    loading, 
    error, 
    fetchTeams, 
    fetchReceivedRequests,
    handleAcceptRequest,
    handleRejectRequest,
    createTeam 
  } = useTeams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [receivedJoinRequests, setReceivedJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Only fetch teams once when component mounts
  useEffect(() => {
    fetchTeams();
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

  const acceptJoinRequest = async (teamId) => {
    try {
      await handleAcceptRequest(teamId);
      await Promise.all([fetchTeams(), loadJoinRequests()]);
      toast.success('Request accepted successfully');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept join request');
    }
  };

  const rejectJoinRequest = async (teamId) => {
    try {
      await handleRejectRequest(teamId);
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

  const handleCreateTeam = () => {
    setShowCreateModal(true);
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name && team.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'admin' && team.isAdmin) ||
      (filterBy === 'member' && !team.isAdmin);
    return matchesSearch && matchesFilter;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'members':
        return b.members.length - a.members.length;
      case 'projects':
        return b.projects.length - a.projects.length;
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="loading-state">Loading teams...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="page-container teams-page">
      <div className="teams-controls filters-container">
        <div className="teams-filter-controls view-toggle">
          <select
            className="filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All Teams</option>
            <option value="admin">Teams I Admin</option>
            <option value="member">Teams I'm In</option>
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="members">Sort by Members</option>
            <option value="projects">Sort by Projects</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>

        <div className="teams-search search-container">
          <input
            type="text"
            placeholder="Search teams..."
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
            <button onClick={handleCreateTeam} className="action-button primary">
              Create Team
            </button>
          </div>
      </div>

      <div className="teams-content">
        {viewMode === 'grid' ? (
          <div className="teams-grid">
            {sortedTeams.map(team => (
              <Link to={`/teams/${team._id}`} key={team._id}>
                <TeamCard
                  team={team}
                  isCreator={team.admin._id === user?._id}
                  view="grid"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="teams-list">
            {sortedTeams.map(team => (
              <Link to={`/teams/${team._id}`} key={team._id}>
                <TeamCard
                  team={team}
                  isCreator={team.admin._id === user?._id}
                  view="list"
                />
              </Link>
            ))}
          </div>
        )}

        {sortedTeams.length === 0 && (
          <div className="teams-empty">
            <p>No teams found. Create a new team to get started!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (formData) => {
            try {
              // Add the user's ID as adminId to the form data
              const teamData = {
                ...formData,
                adminId: user._id
              };
              
              // Call the createTeam function from TeamsContext
              await createTeam(teamData);
              setShowCreateModal(false);
              fetchTeams();
            } catch (error) {
              console.error('Error creating team:', error);
            }
          }}
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

export default Teams; 