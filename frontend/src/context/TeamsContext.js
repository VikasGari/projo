import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TeamsContext = createContext();

export const useTeams = () => useContext(TeamsContext);

export const TeamsProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeader, user } = useAuth();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/team`, {
        headers: getAuthHeader()
      });
      const teamsWithAdmin = response.data.map(team => ({
        ...team,
        isAdmin: team.admin?._id === user?._id,
        adminName: team.admin?._id === user?._id ? 'You' : team.admin?.name
      }));
      setTeams(teamsWithAdmin);
      setError(null);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(error.response?.data?.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamById = async (teamId) => {
    try {
      const response = await axios.get(`${API_URL}/team/${teamId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team details');
    }
  };

  const createTeam = async (teamData) => {
    try {
      const response = await axios.post(`${API_URL}/team`, teamData, {
        headers: getAuthHeader()
      });
      setTeams(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const updateTeam = async (id, teamData) => {
    try {
      const response = await axios.put(`${API_URL}/team/${id}`, teamData, {
        headers: getAuthHeader()
      });
      const updatedTeam = response.data;
      setTeams(prev => prev.map(team => 
        team._id === id ? {
          ...updatedTeam,
          isAdmin: updatedTeam.admin?._id === user?._id,
          adminName: updatedTeam.admin?._id === user?._id ? 'You' : updatedTeam.admin?.name
        } : team
      ));
      return updatedTeam;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update team');
    }
  };

  const deleteTeam = async (id) => {
    try {
      await axios.delete(`${API_URL}/team/${id}`, {
        headers: getAuthHeader()
      });
      setTeams(prev => prev.filter(team => team._id !== id));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete team');
    }
  };

  const addMember = async (teamId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/team/${teamId}/members`, {
        userId
      }, {
        headers: getAuthHeader()
      });
      setTeams(prev => prev.map(team => {
        if (team._id === teamId) {
          return response.data;
        }
        return team;
      }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (teamId, userId) => {
    try {
      await axios.delete(`${API_URL}/team/${teamId}/members/${userId}`, {
        headers: getAuthHeader()
      });
      setTeams(prev => prev.map(team => {
        if (team._id === teamId) {
          return {
            ...team,
            members: team.members.filter(member => member._id !== userId)
          };
        }
        return team;
      }));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/team/join-requests`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch join requests');
    }
  };

  const sendJoinRequest = async (teamId, email) => {
    try {
      const response = await axios.post(`${API_URL}/team/${teamId}/invite`, {
        email
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send join request');
    }
  };

  const acceptJoinRequest = async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/team/accept-request`, {
        requestId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to accept join request');
    }
  };

  const rejectJoinRequest = async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/team/reject-request`, {
        requestId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject join request');
    }
  };

  const inviteMember = async (teamId, email) => {
    try {
      const response = await axios.post(`${API_URL}/team/${teamId}/invite`, {
        email
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to invite member');
    }
  };

  const addSubAdmin = async (teamId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/team/${teamId}/subadmin`, {
        userId
      }, {
        headers: getAuthHeader()
      });
      setTeams(prev => prev.map(team => {
        if (team._id === teamId) {
          return response.data;
        }
        return team;
      }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add subadmin');
    }
  };

  const removeSubAdmin = async (teamId, userId) => {
    try {
      const response = await axios.delete(`${API_URL}/team/${teamId}/subadmin/${userId}`, {
        headers: getAuthHeader()
      });
      setTeams(prev => prev.map(team => {
        if (team._id === teamId) {
          return response.data;
        }
        return team;
      }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove subadmin');
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/received-team-requests`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch received requests');
    }
  };

  const handleAcceptRequest = async (teamId) => {
    try {
      const response = await axios.post(`${API_URL}/user/accept-team-request`, {
        teamId
      }, {
        headers: getAuthHeader()
      });
      // Refresh teams after accepting request
      await fetchTeams();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (teamId) => {
    try {
      const response = await axios.post(`${API_URL}/user/reject-team-request`, {
        teamId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const value = {
    teams,
    loading,
    error,
    fetchTeams,
    fetchTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    fetchJoinRequests,
    sendJoinRequest,
    acceptJoinRequest,
    rejectJoinRequest,
    inviteMember,
    addSubAdmin,
    removeSubAdmin,
    fetchReceivedRequests,
    handleAcceptRequest,
    handleRejectRequest
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}; 