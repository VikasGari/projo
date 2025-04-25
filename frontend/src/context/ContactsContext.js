import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

const ContactsContext = createContext();

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

export const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contacts');
      setContacts(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData) => {
    try {
      setLoading(true);
      const response = await api.post('/contacts', contactData);
      
      // Check if the response contains duplicates
      if (response.data.duplicates) {
        return response.data;
      }
      
      // If no duplicates, add the contact to the list
      setContacts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating contact');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchCreateContacts = async (contactsData) => {
    try {
      setLoading(true);
      const response = await api.post('/contacts/batch', contactsData);
      
      // Update the contacts list with successfully created contacts
      if (response.data.created && response.data.created.length > 0) {
        setContacts(prev => [...prev, ...response.data.created]);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error importing contacts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id, contactData) => {
    try {
      setLoading(true);
      const response = await api.put(`/contacts/${id}`, contactData);
      setContacts(prev => prev.map(contact => 
        contact._id === id ? response.data : contact
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating contact');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(contact => contact._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting contact');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportContactsToCSV = () => {
    try {
      // Convert contacts to CSV format
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Mobile',
        'Company',
        'Job Title',
        'Address',
        'City',
        'State',
        'Country',
        'ZIP Code',
        'Website',
        'Notes',
        'Tags'
      ];
      
      const csvData = contacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.email || '',
        contact.phone || '',
        contact.mobile || '',
        contact.company || '',
        contact.jobTitle || '',
        contact.address || '',
        contact.city || '',
        contact.state || '',
        contact.country || '',
        contact.zipCode || '',
        contact.website || '',
        contact.notes || '',
        (contact.tags || []).join('; ')
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'contacts.csv');
    } catch (err) {
      console.error('Error exporting contacts to CSV:', err);
      setError('Failed to export contacts to CSV');
    }
  };

  const exportContactsToExcel = () => {
    try {
      // Convert contacts to worksheet format
      const worksheet = XLSX.utils.json_to_sheet(
        contacts.map(contact => ({
          'First Name': contact.firstName || '',
          'Last Name': contact.lastName || '',
          'Email': contact.email || '',
          'Phone': contact.phone || '',
          'Mobile': contact.mobile || '',
          'Company': contact.company || '',
          'Job Title': contact.jobTitle || '',
          'Address': contact.address || '',
          'City': contact.city || '',
          'State': contact.state || '',
          'Country': contact.country || '',
          'ZIP Code': contact.zipCode || '',
          'Website': contact.website || '',
          'Notes': contact.notes || '',
          'Tags': (contact.tags || []).join('; ')
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'contacts.xlsx');
    } catch (err) {
      console.error('Error exporting contacts to Excel:', err);
      setError('Failed to export contacts to Excel');
    }
  };

  const value = {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    batchCreateContacts,
    updateContact,
    deleteContact,
    exportContactsToCSV,
    exportContactsToExcel
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
};

export default ContactsContext; 