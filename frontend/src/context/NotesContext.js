import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notes`, {
        headers: getAuthHeader()
      });
      setNotes(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch notes');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData) => {
    try {
      const response = await axios.post(`${API_URL}/notes`, noteData, {
        headers: getAuthHeader()
      });
      setNotes(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const response = await axios.put(`${API_URL}/notes/${id}`, noteData, {
        headers: getAuthHeader()
      });
      setNotes(prev => prev.map(note => 
        note._id === id ? response.data : note
      ));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`, {
        headers: getAuthHeader()
      });
      setNotes(prev => prev.filter(note => note._id !== id));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const value = {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}; 