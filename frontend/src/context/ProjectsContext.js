import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectsContext = createContext();

export const useProjects = () => useContext(ProjectsContext);

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/project`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we have an array of projects
      const projects = Array.isArray(response.data) ? response.data : [];
      setProjects(projects);
      setError(null);
    } catch (error) {
      if (error.response?.status === 401) {
        // Only clear projects if unauthorized
        setProjects([]);
      }
      setError(error.response?.data?.message || 'Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProject = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/project/${projectId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project');
    }
  };

  const createProject = async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/project`, projectData, {
        headers: getAuthHeader()
      });
      // Add the new project to the list
      setProjects(prev => [...prev, response.data]);
      toast.success('Project created successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
      throw error;
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      const response = await axios.put(`${API_URL}/project/${id}`, projectData, {
        headers: getAuthHeader()
      });
      setProjects(prev => prev.map(project => 
        project._id === id ? response.data : project
      ));
      toast.success('Project updated successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project');
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`${API_URL}/project/${id}`, {
        headers: getAuthHeader()
      });
      setProjects(prev => prev.filter(project => project._id !== id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.response?.data?.message || 'Failed to delete project');
      throw error;
    }
  };

  const startProject = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/project/${id}/start`, {}, {
        headers: getAuthHeader()
      });
      setProjects(prev => prev.map(project => 
        project._id === id ? response.data : project
      ));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start project');
    }
  };

  const completeProject = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/project/${id}/complete`, {}, {
        headers: getAuthHeader()
      });
      setProjects(prev => prev.map(project => 
        project._id === id ? response.data : project
      ));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete project');
    }
  };

  const inviteMember = async (projectId, email) => {
    try {
      const response = await axios.post(`${API_URL}/project/${projectId}/invite`, {
        email
      }, {
        headers: getAuthHeader()
      });
      toast.success('Invitation sent successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending invitation');
      throw error;
    }
  };

  const removeMember = async (projectId, userId) => {
    try {
      await axios.post(`${API_URL}/project/${projectId}/remove-member`, {
        userId
      }, {
        headers: getAuthHeader()
      });
      
      // Update local state
      setProjects(prev => prev.map(project => {
        if (project._id === projectId) {
          return {
            ...project,
            members: project.members.filter(member => member._id !== userId)
          };
        }
        return project;
      }));
      
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing member');
      throw error;
    }
  };

  const addSubAdmin = async (projectId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/project/${projectId}/subadmin`, {
        userId
      }, {
        headers: getAuthHeader()
      });
      
      // Update local state
      setProjects(prev => prev.map(project => {
        if (project._id === projectId) {
          return {
            ...project,
            subAdmins: [...project.subAdmins, response.data.subAdmins[response.data.subAdmins.length - 1]]
          };
        }
        return project;
      }));
      
      toast.success('Sub-admin added successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding sub-admin');
      throw err;
    }
  };

  const removeSubAdmin = async (projectId, userId) => {
    try {
      await axios.delete(`${API_URL}/project/${projectId}/subadmin/${userId}`, {
        headers: getAuthHeader()
      });
      
      // Update local state
      setProjects(prev => prev.map(project => {
        if (project._id === projectId) {
          return {
            ...project,
            subAdmins: project.subAdmins.filter(admin => admin._id !== userId)
          };
        }
        return project;
      }));
      
      toast.success('Sub-admin removed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing sub-admin');
      throw err;
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const response = await axios.patch(`${API_URL}/project/${projectId}/status`, {
        status: newStatus
      }, {
        headers: getAuthHeader()
      });
      
      // Update local state
      setProjects(prev => prev.map(project => {
        if (project._id === projectId) {
          return {
            ...project,
            status: newStatus
          };
        }
        return project;
      }));
      
      toast.success('Project status updated successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating project status');
      throw err;
    }
  };

  const addTask = async (projectId, title, description, priority) => {
    try {
      const response = await axios.post(`${API_URL}/tasks`, {
        projectId,
        title,
        description,
        priority
      }, {
        headers: getAuthHeader()
      });

      // Update the project with the new task
      setProjects(prev => prev.map(project => {
        if (project._id === projectId) {
          return {
            ...project,
            tasks: [...project.tasks, response.data]
          };
        }
        return project;
      }));

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add task');
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      console.log('Fetching received requests...');
      const response = await axios.get(`${API_URL}/user/received-project-requests`, {
        headers: getAuthHeader()
      });
      console.log('Received response:', response.data);
      // Ensure we have an array of requests
      const requests = Array.isArray(response.data) ? response.data : [];
      console.log('Processed requests:', requests);
      return requests;
    } catch (error) {
      console.error('Error fetching received requests:', error);
      throw error;
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/user/accept-project-request`, {
        projectId: requestId
      }, {
        headers: getAuthHeader()
      });
      // Update projects list after accepting request
      await fetchProjects();
      toast.success('Request accepted successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accepting request');
      throw error;
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/user/reject-project-request`, {
        projectId: requestId
      }, {
        headers: getAuthHeader()
      });
      // Update projects list after rejecting request
      await fetchProjects();
      toast.success('Request rejected successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting request');
      throw error;
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`${API_URL}/task/${taskId}/status`, {
        status: newStatus
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const assignTask = async (taskId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/task/${taskId}/assign`, {
        userId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to assign task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/task/${taskId}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const updateTask = async (taskId, updatedData) => {
    try {
      const response = await axios.put(`${API_URL}/task/${taskId}`, updatedData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const createTask = async (projectId, taskData) => {
    try {
      const response = await axios.post(`${API_URL}/task`, {
        ...taskData,
        projectId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const value = {
    projects,
    loading,
    error,
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    startProject,
    completeProject,
    inviteMember,
    removeMember,
    addSubAdmin,
    removeSubAdmin,
    updateProjectStatus,
    addTask,
    fetchReceivedRequests,
    handleAcceptRequest,
    handleRejectRequest,
    updateTaskStatus,
    assignTask,
    deleteTask,
    updateTask,
    createTask
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}; 