import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const TasksContext = createContext();

export const useTasks = () => useContext(TasksContext);

export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const { getAuthHeader } = useAuth();

  const fetchTasks = async (projectId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}/tasks`, {
        headers: getAuthHeader()
      });
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching tasks');
      toast.error(err.response?.data?.message || 'Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (projectId, taskData) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/tasks`, taskData, {
        headers: getAuthHeader()
      });
      setTasks(prev => [...prev, response.data]);
      toast.success('Task created successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating task');
      throw err;
    }
  };

  const updateTask = async (projectId, taskId, taskData) => {
    try {
      const response = await axios.put(
        `${API_URL}/projects/${projectId}/tasks/${taskId}`,
        taskData,
        { headers: getAuthHeader() }
      );
      setTasks(prev => prev.map(t => t._id === taskId ? response.data : t));
      toast.success('Task updated successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating task');
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/task/${taskId}`, {
        headers: getAuthHeader()
      });
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting task');
      throw err;
    }
  };

  const assignTask = async (taskId, userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/task/assign`,
        { taskId, userId },
        { headers: getAuthHeader() }
      );
      setTasks(prev => prev.map(t => t._id === taskId ? response.data : t));
      toast.success('Task assigned successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning task');
      throw err;
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await axios.patch(
        `${API_URL}/task/${taskId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      setTasks(prev => prev.map(t => t._id === taskId ? response.data : t));
      toast.success('Task status updated successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating task status');
      throw err;
    }
  };

  const addRemark = async (projectId, taskId, remark) => {
    try {
      const response = await axios.post(
        `${API_URL}/projects/${projectId}/tasks/${taskId}/remarks`,
        { text: remark },
        { headers: getAuthHeader() }
      );
      setTasks(prev => prev.map(t => t._id === taskId ? response.data : t));
      toast.success('Remark added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding remark');
      throw err;
    }
  };

  const value = {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus,
    addRemark
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}; 