import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useContacts } from '../../../context/ContactsContext';
import './ContactForm.css';

const ContactForm = ({ contact, onClose, onSuccess }) => {
  const { createContact, updateContact } = useContacts();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    company: '',
    jobTitle: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    website: '',
    notes: '',
    tags: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    }
  }, [contact]);

  // Create a function to manually show the duplicate dialog
  const showDuplicateDialogManually = (duplicateData) => {
    // Create the dialog element
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'duplicate-dialog-overlay';
    dialogOverlay.id = 'duplicate-dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'duplicate-dialog';
    
    const existingContact = duplicateData[0];
    
    dialogContent.innerHTML = `
      <h3>Potential Duplicate Found</h3>
      <p>We found a contact that might be a duplicate:</p>
      
      <div class="contact-comparison">
        <div class="existing-contact">
          <h4>Existing Contact</h4>
          <p>Name: ${existingContact.firstName} ${existingContact.lastName}</p>
          ${existingContact.email ? `<p>Email: ${existingContact.email}</p>` : ''}
          ${existingContact.phone ? `<p>Phone: ${existingContact.phone}</p>` : ''}
        </div>
      </div>

      <div class="dialog-actions">
        <button id="create-anyway-btn" class="create-anyway-button">
          Create Anyway
        </button>
        <button id="cancel-duplicate-btn" class="cancel-button">
          Cancel
        </button>
      </div>
    `;
    
    dialogOverlay.appendChild(dialogContent);
    document.body.appendChild(dialogOverlay);
    
    // Store the reference to the dialog
    dialogRef.current = dialogOverlay;
    
    // Add event listeners
    document.getElementById('create-anyway-btn').addEventListener('click', handleCreateAnyway);
    document.getElementById('cancel-duplicate-btn').addEventListener('click', () => {
      if (dialogRef.current) {
        document.body.removeChild(dialogRef.current);
        dialogRef.current = null;
      }
      onClose();
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      throw new Error('First name and last name are required');
    }

    if (formData.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      throw new Error('Please enter a valid email address');
    }

    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
      throw new Error('Please enter a valid website URL');
    }
  };

  const cleanFormData = (data) => {
    const cleanedData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          if (value.trim() !== '') {
            cleanedData[key] = value.trim();
          }
        } else if (Array.isArray(value) && value.length > 0) {
          cleanedData[key] = value;
        }
      }
    });
    return cleanedData;
  };

  const handleCreateAnyway = async () => {
    console.log('Creating contact anyway...');
    try {
      setLoading(true);
      setError('');
      const cleanedData = cleanFormData(formData);
      
      // Add a flag to indicate that we want to create the contact anyway
      cleanedData.forceCreate = true;
      
      console.log('Submitting with forceCreate flag:', cleanedData);
      const response = await createContact(cleanedData);
      
      console.log('Response from createContact:', response);
      
      // Remove the dialog if it exists
      if (dialogRef.current) {
        document.body.removeChild(dialogRef.current);
        dialogRef.current = null;
      }
      
      if (response && onSuccess) {
        onSuccess(response);
        onClose();
      }
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err.message || 'Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    setError('');
    setLoading(true);
    setIsSubmitting(true);

    try {
      validateForm();
      const cleanedData = cleanFormData(formData);
      console.log('Submitting cleaned form data:', cleanedData);

      let response;
      if (contact) {
        console.log('Updating existing contact:', contact._id);
        response = await updateContact(contact._id, cleanedData);
        if (response && onSuccess) {
          onSuccess(response);
          onClose();
        }
      } else {
        console.log('Creating new contact');
        response = await createContact(cleanedData);
        console.log('Server response:', response);
        
        if (response.duplicates && response.duplicates.length > 0) {
          // Show duplicate warning dialog
          console.log('Duplicates found:', response.duplicates);
          setDuplicates(response.duplicates);
          
          // Use the manual approach to show the dialog
          showDuplicateDialogManually(response.duplicates);
          
          setLoading(false);
          setIsSubmitting(false);
          return;
        }

        if (response && onSuccess) {
          onSuccess(response);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [contact, createContact, updateContact, formData, isSubmitting, onClose, onSuccess]);

  // Clean up the dialog when the component unmounts
  useEffect(() => {
    return () => {
      if (dialogRef.current) {
        document.body.removeChild(dialogRef.current);
        dialogRef.current = null;
      }
    };
  }, []);

  return (
    <div className="contact-form-container">
      <div className="contact-form">
        <div className="contact-form-header">
          <h2>{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="mobile">Mobile</label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="jobTitle">Job Title</label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm; 