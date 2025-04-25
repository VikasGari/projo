import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useContacts } from '../../context/ContactsContext';
import ContactList from './components/ContactList';
import ContactGrid from './components/ContactGrid';
import ContactForm from './components/ContactForm';
import ContactImport from './components/ContactImport';
import { FaList, FaThLarge, FaFileCsv, FaFileExcel, FaPlus } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './Contacts.css';

const Contacts = () => {
  const { contacts, loading, error, fetchContacts } = useContacts();
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Only fetch contacts on initial mount
  useEffect(() => {
    console.log('Contacts component mounted, fetching contacts...');
    if (initialLoad) {
      fetchContacts();
      setInitialLoad(false);
    }
  }, [fetchContacts, initialLoad]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleViewToggle = useCallback(() => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  }, [viewMode]);

  const handleAddContact = useCallback(() => {
    console.log('Opening add contact form');
    setSelectedContact(null);
    setShowForm(true);
  }, []);

  const handleEditContact = useCallback((contact) => {
    console.log('Opening edit contact form for:', contact);
    setSelectedContact(contact);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    console.log('Closing contact form');
    setShowForm(false);
    setSelectedContact(null);
  }, []);

  const handleImportClose = useCallback(() => {
    setShowImport(false);
  }, []);

  const toggleExportDropdown = useCallback(() => {
    setShowExportDropdown(!showExportDropdown);
  }, [showExportDropdown]);

  const handleFormSuccess = useCallback(async (savedContact) => {
    console.log('Form submitted successfully, refreshing contacts...', savedContact);
    
    // Close the form immediately to prevent reopening
    setShowForm(false);
    setSelectedContact(null);
    
    // Set refreshing state to prevent multiple refreshes
    if (isRefreshing) {
      console.log('Already refreshing contacts, skipping...');
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Wait a moment to ensure the server has processed the request
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchContacts();
    } catch (err) {
      console.error('Error refreshing contacts:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchContacts, isRefreshing]);

  const handleExportCSV = useCallback(() => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Mobile', 'Company', 'Job Title', 'Address', 'City', 'State', 'ZIP Code', 'Country', 'Website', 'Notes', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.mobile,
        contact.company,
        contact.jobTitle,
        contact.address,
        contact.city,
        contact.state,
        contact.zipCode,
        contact.country,
        contact.website,
        contact.notes,
        contact.tags.join(';')
      ].map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  }, [contacts]);

  const handleExportExcel = useCallback(() => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Mobile', 'Company', 'Job Title', 'Address', 'City', 'State', 'ZIP Code', 'Country', 'Website', 'Notes', 'Tags'];
    const data = contacts.map(contact => [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      contact.mobile,
      contact.company,
      contact.jobTitle,
      contact.address,
      contact.city,
      contact.state,
      contact.zipCode,
      contact.country,
      contact.website,
      contact.notes,
      contact.tags.join(';')
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, 'contacts.xlsx');
    setShowExportDropdown(false);
  }, [contacts]);

  const handleImportCSV = useCallback(() => {
    setShowImport(true);
    setShowExportDropdown(false);
  }, []);

  const handleImportExcel = useCallback(() => {
    setShowImport(true);
    setShowExportDropdown(false);
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (contact.firstName || '').toLowerCase().includes(searchLower) ||
      (contact.lastName || '').toLowerCase().includes(searchLower) ||
      (contact.email || '').toLowerCase().includes(searchLower) ||
      (contact.phone || '').toLowerCase().includes(searchLower) ||
      (contact.mobile || '').toLowerCase().includes(searchLower) ||
      (contact.company || '').toLowerCase().includes(searchLower) ||
      (contact.jobTitle || '').toLowerCase().includes(searchLower) ||
      (contact.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading) return <div className="loading-state">Loading contacts...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="page-container contacts-container">
      <div className="contacts-actions filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="view-toggle">
          <button 
            onClick={() => setViewMode('list')} 
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            title="List View"
          >
            <FaList />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid View"
          >
            <FaThLarge />
          </button>
        </div>
        <div className="page-actions" ref={dropdownRef}>
          <div className="dropdown-container">
            <button className="action-button secondary" onClick={toggleExportDropdown}>
              Import/Export
            </button>
            {showExportDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-section">
                  <div className="dropdown-header">Export</div>
                  <button className="dropdown-item" onClick={handleExportCSV}>
                    <FaFileCsv /> Export CSV
                  </button>
                  <button className="dropdown-item" onClick={handleExportExcel}>
                    <FaFileExcel /> Export Excel
                  </button>
                </div>
                <div className="dropdown-section">
                  <div className="dropdown-header">Import</div>
                  <button className="dropdown-item" onClick={handleImportCSV}>
                     Import from CSV
                  </button>
                  <button className="dropdown-item" onClick={handleImportExcel}>
                     Import from Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="action-button primary" onClick={handleAddContact}>
            <FaPlus /> Add Contact
          </button>
        </div>
      </div>

      <div className="contacts-content">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <h3>No contacts found</h3>
            <p>
              {searchTerm ? "Try refining your search." : "Add your first contact to get started!"}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <ContactList contacts={filteredContacts} onEdit={handleEditContact} />
        ) : (
          <ContactGrid contacts={filteredContacts} onEdit={handleEditContact} />
        )}
      </div>

      {showForm && (
        <ContactForm 
          contact={selectedContact} 
          onClose={handleCloseForm} 
          onSave={handleFormSuccess} 
        />
      )}

      {showImport && (
        <ContactImport onClose={handleImportClose} onSuccess={handleFormSuccess} />
      )}
    </div>
  );
};

export default Contacts;