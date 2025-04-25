import React, { useState, useEffect } from 'react';
import { useContacts } from '../../../context/ContactsContext';
import { FaEllipsisV, FaEnvelope, FaPhone, FaBuilding, FaEdit, FaShare, FaTrash } from 'react-icons/fa';

const ContactGrid = ({ contacts, onEdit }) => {
  const { deleteContact } = useContacts();
  const [menuOpenId, setMenuOpenId] = useState(null);

  const handleMenuOpen = (id, event) => {
    event.stopPropagation();
    event.preventDefault();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleMenuClose = () => {
    setMenuOpenId(null);
  };

  const handleEdit = (contact, event) => {
    event.stopPropagation();
    event.preventDefault();
    onEdit(contact);
    handleMenuClose();
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    event.preventDefault();
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
    handleMenuClose();
  };

  const handleShare = (contact, event) => {
    event.stopPropagation();
    event.preventDefault();
    // Implement share functionality
    console.log('Share contact:', contact);
    handleMenuClose();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.contact-list-actions')) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No contacts found</h3> 
        <p>Add contacts using the button above.</p>
      </div>
    );
  }

  return (
    <div className="contact-grid-items">
      {contacts.map(contact => (
        <div key={contact._id} className="contact-card">
          <div className="contact-card-header">
            <div className="contact-card-avatar-info">
              <div className="contact-list-avatar">
                {contact.profileImageUrl ? (
                  <img src={contact.profileImageUrl} alt={`${contact.firstName} ${contact.lastName}`} />
                ) : (
                  <>{contact.firstName ? contact.firstName.charAt(0) : ''}{contact.lastName ? contact.lastName.charAt(0) : ''}</>
                )}
              </div>
              <div className="contact-info">
                <h3 className="contact-list-name">
                  {contact.firstName} {contact.lastName}
                </h3>
                {(contact.jobTitle || contact.company) && (
                  <p className="contact-list-subtitle">
                    {contact.jobTitle}{contact.jobTitle && contact.company ? ', ' : ''}{contact.company}
                  </p>
                )}
              </div>
            </div>
            
            <div className={`contact-list-actions ${menuOpenId === contact._id ? 'menu-open' : ''}`}>
              <button 
                className="contact-menu-button" 
                onClick={(e) => handleMenuOpen(contact._id, e)}
                aria-label="Contact actions"
              >
                <FaEllipsisV />
              </button>
              {menuOpenId === contact._id && (
                <div className="contact-actions-menu">
                  <button 
                    className="contact-actions-menu-item" 
                    onClick={(e) => handleEdit(contact, e)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="contact-actions-menu-item" 
                    onClick={(e) => handleShare(contact, e)}
                  >
                    <FaShare /> Share
                  </button>
                  <button 
                    className="contact-actions-menu-item delete" 
                    onClick={(e) => handleDelete(contact._id, e)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="contact-card-body">
            <div className="contact-list-details">
              {contact.email && (
                <div className="contact-list-detail">
                  <FaEnvelope />
                  <span>{contact.email}</span>
                </div>
              )}
              {(contact.phone || contact.mobile) && (
                <div className="contact-list-detail">
                  <FaPhone />
                  <span>{contact.phone || contact.mobile}</span>
                </div>
              )}
              {contact.company && !contact.jobTitle && (
                <div className="contact-list-detail">
                  <FaBuilding />
                  <span>{contact.company}</span>
                </div>
              )}
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="contact-list-tags">
                {contact.tags.map((tag, index) => (
                  <span key={index} className="badge badge-info">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactGrid; 