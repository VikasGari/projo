import React from 'react';
import { format, isSameMonth } from 'date-fns';
import './EventList.css';

const EventList = ({ events, loading, error, onEventClick, isExpired = false, selectedDate = new Date() }) => {
  if (loading) {
    return (
      <div className="event-list-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list-error">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="event-list-empty">
        <p>{isExpired ? 'No expired events found' : 'No events found'}</p>
      </div>
    );
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="event-list-content">
      <ul className="event-list">
        {sortedEvents.map((event) => {
          const eventDate = new Date(event.date);
          const isCurrentMonth = isSameMonth(eventDate, selectedDate);
          
          return (
            <li
              key={event._id}
              className={`event-list-item ${isExpired ? 'expired' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
              onClick={() => onEventClick(event)}
            >
              <div className="event-list-item-content">
                <div className="event-list-item-header">
                  <h3 className="event-list-item-title">{event.title}</h3>
                  {event.tag && (
                    <span className="event-list-item-tag">{event.tag}</span>
                  )}
                </div>
                <div className="event-list-item-details">
                  <span className="event-list-item-time">
                    {format(eventDate, 'MMM d, yyyy h:mm a')}
                  </span>
                  {event.description && (
                    <p className="event-list-item-description">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EventList; 