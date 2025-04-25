import React, { useState } from 'react';
import { MdAdd, MdDeleteSweep } from 'react-icons/md';

const EventsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [hasExpiredEvents, setHasExpiredEvents] = useState(false);
  const [deleteExpiredLoading, setDeleteExpiredLoading] = useState(false);

  const handleDeleteExpired = async () => {
    setDeleteExpiredLoading(true);
    // Implement the logic to delete expired events
    setDeleteExpiredLoading(false);
  };

  return (
    <div className="page-container events-container">
      <div className="page-actions" style={{ marginBottom: '20px' }}>
        <button className="action-button primary" onClick={() => setShowAddModal(true)}>
          <MdAdd /> Add Event
        </button>
        {hasExpiredEvents && (
          <button 
            className="action-button error"
            onClick={handleDeleteExpired}
            disabled={deleteExpiredLoading}
          >
            <MdDeleteSweep /> Delete Expired Events
          </button>
        )}
      </div>

      {/* Rest of the page content */}
    </div>
  );
};

export default EventsPage; 