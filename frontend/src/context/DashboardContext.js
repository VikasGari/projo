import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { getAuthHeader } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dashboard', {
        ...getAuthHeader(),
        withCredentials: true
      });
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Update active time
  const updateActiveTime = async (hours, minutes) => {
    try {
      const response = await axios.put('/dashboard/active-time', 
        { hours, minutes }, 
        {
          ...getAuthHeader(),
          withCredentials: true
        }
      );
      setDashboard(prev => ({
        ...prev,
        activeToday: response.data
      }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update active time');
      throw err;
    }
  };

  // Update weekly activity
  const updateWeeklyActivity = async (weeklyActivity) => {
    try {
      const response = await axios.put('/dashboard/weekly-activity', 
        { weeklyActivity }, 
        {
          ...getAuthHeader(),
          withCredentials: true
        }
      );
      setDashboard(prev => ({
        ...prev,
        weeklyActivity: response.data
      }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update weekly activity');
      throw err;
    }
  };

  // Update mini note
  const updateMiniNote = async (note) => {
    try {
      const response = await axios.put('/dashboard/mini-note', 
        { note }, 
        {
          ...getAuthHeader(),
          withCredentials: true
        }
      );
      setDashboard(prev => ({
        ...prev,
        miniNote: response.data.miniNote
      }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update mini note');
      throw err;
    }
  };

  // Update pinned projects
  const updatePinnedProjects = async (projectIds) => {
    try {
      const response = await axios.put('/dashboard/pinned-projects', 
        { projectIds }, 
        {
          ...getAuthHeader(),
          withCredentials: true
        }
      );
      setDashboard(prev => ({
        ...prev,
        pinnedProjects: response.data
      }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update pinned projects');
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const value = {
    dashboard,
    loading,
    error,
    fetchDashboard,
    updateActiveTime,
    updateWeeklyActivity,
    updateMiniNote,
    updatePinnedProjects
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext; 