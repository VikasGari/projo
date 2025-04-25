import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const EventsContext = createContext();

// Base URL for API calls
const API_URL = 'http://localhost:5000';

export const EventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeader } = useAuth();

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/events`, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching events');
      console.error('Error in fetchEvents:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Fetch events by date range
  const fetchEventsByDateRange = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      // Format dates to ISO string
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();
      
      const { data } = await axios.get(
        `${API_URL}/events/range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching events');
      console.error('Error in fetchEventsByDateRange:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Create a new event
  const createEvent = async (eventData) => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${API_URL}/events`, eventData, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setEvents((prev) => [...prev, data]);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating event');
      console.error('Error in createEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an event
  const updateEvent = async (id, eventData) => {
    try {
      setLoading(true);
      const { data } = await axios.put(`${API_URL}/events/${id}`, eventData, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setEvents((prev) =>
        prev.map((event) => (event._id === id ? data : event))
      );
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating event');
      console.error('Error in updateEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/events/${id}`, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setEvents((prev) => prev.filter((event) => event._id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting event');
      console.error('Error in deleteEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        fetchEvents,
        fetchEventsByDateRange,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}; 