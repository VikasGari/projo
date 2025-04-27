import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(new URL('/user/verify', API_URL).toString(), {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear token and redirect if it's an authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        if (window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(new URL('/user/login', API_URL).toString(), {
        email,
        password
      }, {
        withCredentials: true
      });

      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(userData);
      
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(new URL('/user', API_URL).toString(), userData, {
        withCredentials: true
      });
      
      const { token, user: newUser } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(newUser);
      
      return newUser;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await axios.post(new URL('/user/logout', API_URL).toString(), {}, {
        headers: getAuthHeader(),
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put(new URL('/user/profile', API_URL).toString(), profileData, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    getAuthHeader
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
