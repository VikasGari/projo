import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useEvents } from '../../../context/EventsContext';
import './EventForm.css';

const EVENT_TAGS = [
  'meeting',
  'deadline',
  'reminder',
  'appointment',
  'general',
];

const EventForm = ({ open, onClose, event, selectedDate }) => {
  const { createEvent, updateEvent } = useEvents();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(selectedDate || new Date(), "yyyy-MM-dd'T'HH:mm"),
    tag: 'general',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        date: format(new Date(event.date), "yyyy-MM-dd'T'HH:mm"),
        tag: event.tag || 'general',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: format(selectedDate || new Date(), "yyyy-MM-dd'T'HH:mm"),
        tag: 'general',
      });
    }
  }, [event, selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };

      if (event) {
        await updateEvent(event._id, eventData);
      } else {
        await createEvent(eventData);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  if (!open) return null;

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="event-form-header">
            <h2>{event ? 'Edit Event' : 'Add New Event'}</h2>
            <button type="button" className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="event-form-content">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={error ? 'error' : ''}
              />
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Date & Time</label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tag">Tag</label>
              <select
                id="tag"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
              >
                {EVENT_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="event-form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm; 