import React, { useState, useEffect } from 'react';
import { useEvents } from '../../context/EventsContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isBefore, startOfDay, isAfter, isSameDay } from 'date-fns';
import { Add as AddIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import './Events.css';

const Events = () => {
  const { events, loading, error, fetchEvents, fetchEventsByDateRange, deleteEvent } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showExpiredEvents, setShowExpiredEvents] = useState(false);

  useEffect(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    fetchEventsByDateRange(startDate, endDate);
  }, [selectedDate, fetchEventsByDateRange]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowEventForm(true);
    setSelectedEvent(null);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  // Get the start of the week for the first day of the month
  const firstDayOfMonth = startOfMonth(selectedDate);
  const startOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start from Monday
  
  // Get the end of the week for the last day of the month
  const lastDayOfMonth = endOfMonth(selectedDate);
  const endOfCalendar = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }); // End on Sunday
  
  // Generate all days for the calendar view
  const calendarDays = eachDayOfInterval({
    start: startOfCalendar,
    end: endOfCalendar,
  });

  // Improved function to determine if a day belongs to the current month
  const isCurrentMonthDay = (day) => {
    return isSameMonth(day, selectedDate);
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  // Group days by week for proper calendar display
  const weeks = [];
  let currentWeek = [];
  
  calendarDays.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7 || index === calendarDays.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Separate active and expired events
  const today = startOfDay(new Date());
  const activeEvents = events.filter(event => !isBefore(new Date(event.date), today));
  const expiredEvents = events.filter(event => isBefore(new Date(event.date), today));

  // Sort events by date and time
  const sortedActiveEvents = [...activeEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sortedExpiredEvents = [...expiredEvents].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Handle delete expired events
  const handleDeleteExpiredEvents = async () => {
    if (window.confirm('Are you sure you want to delete all expired events?')) {
      try {
        for (const event of expiredEvents) {
          await deleteEvent(event._id);
        }
      } catch (err) {
        console.error('Error deleting expired events:', err);
      }
    }
  };

  return (
    <div className="events-container">
      {/* Header */}
      <div className="events-header">
        <h1>Events</h1>
        <div className="events-header-actions">
          <button 
            className="delete-expired-button"
            onClick={handleDeleteExpiredEvents}
            disabled={expiredEvents.length === 0}
          >
            <DeleteIcon /> Delete Expired Events
          </button>
          <button 
            className="add-event-button"
            onClick={() => {
              setShowEventForm(true);
              setSelectedEvent(null);
            }}
          >
            <AddIcon /> Add Event
          </button>
        </div>
      </div>

      <div className="events-content">
        {/* Event List */}
        <div className="event-list-container">
          <div className="event-list-header">
            <h2>All Events</h2>
            <div className="event-list-actions">
              <button 
                className="toggle-expired-button"
                onClick={() => setShowExpiredEvents(!showExpiredEvents)}
              >
                {showExpiredEvents ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                {showExpiredEvents ? 'Hide Expired Events' : 'See Expired Events'}
                {expiredEvents.length > 0 && (
                  <span className="expired-count">({expiredEvents.length})</span>
                )}
              </button>
              {showExpiredEvents && expiredEvents.length > 0 && (
                <button 
                  className="delete-expired-button-small"
                  onClick={handleDeleteExpiredEvents}
                >
                  <DeleteIcon /> Delete All
                </button>
              )}
            </div>
          </div>
          <EventList
            events={sortedActiveEvents}
            loading={loading}
            error={error}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setShowEventForm(true);
            }}
            selectedDate={selectedDate}
          />
          {showExpiredEvents && (
            <div className="expired-events-section">
              <h3>Expired Events</h3>
              <EventList
                events={sortedExpiredEvents}
                loading={false}
                error={null}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setShowEventForm(true);
                }}
                isExpired={true}
                selectedDate={selectedDate}
              />
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div className="calendar-container">
          <div className="calendar-header">
            <h2>{format(selectedDate, 'MMMM yyyy')}</h2>
            <div className="calendar-navigation">
              <button onClick={handlePreviousMonth}>
                <ChevronLeftIcon />
              </button>
              <button onClick={handleNextMonth}>
                <ChevronRightIcon />
              </button>
            </div>
          </div>
          
          <div className="calendar-grid">
            {/* Calendar header */}
            <div className="calendar-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div className="calendar-weekday" key={day}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            {weeks.map((week, weekIndex) => (
              <div className="calendar-week" key={weekIndex}>
                {week.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isCurrentMonthDay(day);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div 
                      className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isTodayDate ? 'today' : ''}`}
                      key={day.toString()}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="calendar-day-number">
                        {format(day, 'd')}
                      </div>
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div className="calendar-event" key={event._id}>
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="calendar-more-events">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Form Dialog */}
      <EventForm
        open={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Events;