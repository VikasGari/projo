import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectsContext';
import { useEvents } from '../../context/EventsContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTeams } from '../../context/TeamsContext';
import { useNotes } from '../../context/NotesContext';
import { useTasks } from '../../context/TasksContext';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';
import FolderIcon from '@mui/icons-material/Folder';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import './Dashboard.css';

// FullScreenClock component
const FullScreenClock = ({ onClose }) => {
  const [time, setTime] = useState(new Date());
  const clockRef = useRef(null);

  const requestFullscreen = async () => {
    try {
      const element = clockRef.current;
      if (element) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      onClose(); // Close the clock if fullscreen fails
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && 
          !document.webkitFullscreenElement && 
          !document.msFullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Request fullscreen after a short delay to ensure component is mounted
    const fullscreenTimeout = setTimeout(() => {
      requestFullscreen();
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(fullscreenTimeout);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      onClose(); // Ensure we still close the clock even if exitFullscreen fails
    }
  };

  return (
    <div ref={clockRef} className="fullscreen-clock">
      <IconButton 
        className="fullscreen-close" 
        onClick={exitFullscreen}
        size="large"
      >
        <FullscreenExitIcon />
      </IconButton>
      <div className="fullscreen-time">
        {time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>
      <div className="fullscreen-date">
        {time.toLocaleDateString([], { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div className="fullscreen-instructions">
        Press ESC to exit fullscreen mode
      </div>
    </div>
  );
};

// Widget component with optional action button
const Widget = ({ title, children, action }) => (
  <div className="widget">
    <div className="widget-header">
      <Typography variant="h6" className="widget-title" gutterBottom>
        {title}
      </Typography>
      {action}
    </div>
    {children}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { events, loading: eventsLoading, error: eventsError, fetchEventsByDateRange } = useEvents();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const [pinnedProjects, setPinnedProjects] = useState(() => {
    const saved = localStorage.getItem('pinnedProjects');
    return saved ? JSON.parse(saved) : [];
  });
  const [isClockFullScreen, setIsClockFullScreen] = useState(false);

  // State for active hours tracking
  const [activeHours, setActiveHours] = useState(() => {
    const saved = localStorage.getItem(`activeHours_${new Date().toDateString()}`);
    return saved ? JSON.parse(saved) : { hours: 0, minutes: 0, lastUpdate: null };
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [miniNote, setMiniNote] = useState(() => {
    const saved = localStorage.getItem('miniNote');
    return saved || '';
  });
  const [weeklyActivity, setWeeklyActivity] = useState(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const savedHours = localStorage.getItem(`activeHours_${date.toDateString()}`);
      const hours = savedHours ? JSON.parse(savedHours).hours : 0;
      const minutes = savedHours ? JSON.parse(savedHours).minutes : 0;
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: hours + minutes / 60,
        date: date.toDateString()
      });
    }
    return days;
  });

  // Update mini note
  const handleMiniNoteChange = (e) => {
    const newValue = e.target.value;
    setMiniNote(newValue);
    localStorage.setItem('miniNote', newValue);
  };

  // Update active hours when user is on the page
  useEffect(() => {
    const today = new Date().toDateString();
    const lastActiveDay = localStorage.getItem('lastActiveDay');
    
    if (lastActiveDay !== today) {
      setActiveHours({ hours: 0, minutes: 0, lastUpdate: new Date().getTime() });
      localStorage.setItem('lastActiveDay', today);
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      setActiveHours(prev => {
        if (!prev.lastUpdate) {
          return { ...prev, lastUpdate: new Date().getTime() };
        }

        const now = new Date().getTime();
        const diff = now - prev.lastUpdate;
        const newMinutes = prev.minutes + Math.floor(diff / 60000);
        
        const updatedHours = {
          hours: prev.hours + Math.floor(newMinutes / 60),
          minutes: newMinutes % 60,
          lastUpdate: now
        };

        localStorage.setItem(`activeHours_${today}`, JSON.stringify(updatedHours));
        
        // Update weekly activity for today
        setWeeklyActivity(prev => {
          const newData = [...prev];
          const todayIndex = newData.findIndex(d => d.date === today);
          if (todayIndex !== -1) {
            newData[todayIndex].hours = updatedHours.hours + updatedHours.minutes / 60;
          }
          return newData;
        });

        return updatedHours;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Get events for next 3 months
        await fetchEventsByDateRange(startDate, endDate);
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      }
    };

    fetchUpcomingEvents();
  }, [fetchEventsByDateRange]);

  // Calculate project counts
  const projectCounts = {
    ongoing: projects?.filter(p => p.status === 'ongoing').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    future: projects?.filter(p => p.status === 'future').length || 0
  };

  // Calculate task counts
  const taskCounts = {
    todo: tasks?.filter(t => t.status === 'todo').length || 0,
    assigned: tasks?.filter(t => t.status === 'assigned').length || 0,
    inReview: tasks?.filter(t => t.status === 'in_review').length || 0,
    completed: tasks?.filter(t => t.status === 'completed').length || 0
  };

  // Filter task statuses to show
  const getTaskStatusesToShow = () => {
    const orderedStatuses = [
      ['Todo', taskCounts.todo],
      ['Assigned', taskCounts.assigned],
      ['In Review', taskCounts.inReview],
      ['Completed', taskCounts.completed]
    ];

    const firstThreeStatuses = orderedStatuses.slice(0, 3);
    const hasZeroInFirstThree = firstThreeStatuses.find(([_, count]) => count === 0);

    if (hasZeroInFirstThree) {
      return orderedStatuses
        .filter(([status, count]) => status !== hasZeroInFirstThree[0])
        .slice(0, 3);
    } else {
      return firstThreeStatuses;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const hours = Math.floor(payload[0].value);
      const minutes = Math.round((payload[0].value - hours) * 60);
      return (
        <div className="custom-tooltip">
          <p>{label}</p>
          <p>{`${hours}h ${minutes}m`}</p>
        </div>
      );
    }
    return null;
  };

  // Get upcoming events (sorted by nearest future date)
  const upcomingEvents = events
    ?.filter(event => new Date(event.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5) || [];

  // Handle pinning/unpinning projects
  const handlePinProject = (project) => {
    if (pinnedProjects.length < 4) {
      const newPinnedProjects = [...pinnedProjects, project];
      setPinnedProjects(newPinnedProjects);
      localStorage.setItem('pinnedProjects', JSON.stringify(newPinnedProjects));
    }
  };

  const handleUnpinProject = (projectId) => {
    const newPinnedProjects = pinnedProjects.filter(p => p.id !== projectId);
    setPinnedProjects(newPinnedProjects);
    localStorage.setItem('pinnedProjects', JSON.stringify(newPinnedProjects));
  };

  // Quick access actions
  const quickActions = [
    {
      title: 'New Project',
      icon: <FolderIcon />,
      onClick: () => navigate('/projects/new')
    },
    {
      title: 'Add Note',
      icon: <NoteAddIcon />,
      onClick: () => navigate('/notes/new')
    },
    {
      title: 'Add Contact',
      icon: <PersonAddIcon />,
      onClick: () => navigate('/contacts/new')
    },
    {
      title: 'Add Event',
      icon: <EventIcon />,
      onClick: () => navigate('/events/new')
    }
  ];

  return (
    <>
      {isClockFullScreen && (
        <FullScreenClock onClose={() => setIsClockFullScreen(false)} />
      )}
      <div className="dashboard-container">
        <div className="widgets-row">
          <div className="widget-wrapper">
            <Widget title="Projects">
              <div className="widget-content">
                <div className="stat-item">
                  <span className="stat-label">Ongoing</span>
                  <span className="stat-value ongoing">{projectCounts.ongoing}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value completed">{projectCounts.completed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Future</span>
                  <span className="stat-value future">{projectCounts.future}</span>
                </div>
              </div>
            </Widget>
          </div>

          <div className="widget-wrapper">
            <Widget title="Tasks">
              <div className="widget-content">
                {getTaskStatusesToShow().map(([status, count]) => (
                  <div key={status} className="stat-item">
                    <span className="stat-label">{status}</span>
                    <span className={`stat-value ${status.toLowerCase().replace(/ /g, '-')}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Widget>
          </div>

          <div className="widget-wrapper mini-note">
            <Widget title="Mini Note">
              <div className="widget-content">
                <textarea
                  className="mini-note-input"
                  value={miniNote}
                  onChange={handleMiniNoteChange}
                  placeholder="Type your quick note here..."
                />
              </div>
            </Widget>
          </div>
        </div>

        <div className="widgets-row">
          <div className="widget-wrapper weekly-activity">
            <Widget title="Active Last Week">
              <div className="widget-content">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={weeklyActivity}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      hide={true}
                      label={{ 
                        value: 'Minutes', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: 'var(--text-secondary)' }
                      }} 
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'var(--surface-2)' }}
                    />
                    <Bar 
                      dataKey="hours" 
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Widget>
          </div>

          <div className="widget-wrapper time-widgets-container">
            <div className="time-widget-half">
              <Widget 
                title="Clock"
                action={
                  <IconButton 
                    size="small"
                    onClick={() => setIsClockFullScreen(true)}
                  >
                    <FullscreenIcon />
                  </IconButton>
                }
              >
                <div className="widget-content time-widget">
                  <div className="time-display large">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Widget>
            </div>

            <div className="time-widget-half">
              <Widget title="Active Today">
                <div className="widget-content time-widget">
                  <div className="time-display large">
                    {String(activeHours.hours).padStart(2, '0')}:
                    {String(activeHours.minutes).padStart(2, '0')}
                  </div>
                </div>
              </Widget>
            </div>
          </div>
        </div>

        <div className="widgets-row">
          <div className="widget-wrapper upcoming-events">
            <Widget title="Upcoming Events">
              <div className="widget-content">
                {upcomingEvents.length > 0 ? (
                  <div className="events-list">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="event-item">
                        <div className="event-info">
                          <div className="event-title">{event.title}</div>
                          <div className="event-date">
                            {new Date(event.startDate).toLocaleDateString()} at{' '}
                            {new Date(event.startDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-events">No upcoming events</div>
                )}
              </div>
            </Widget>
          </div>

          <div className="widget-wrapper pinned-projects">
            <Widget 
              title="Pinned Projects" 
              action={
                <IconButton 
                  size="small"
                  onClick={() => {
                    // TODO: Open project selection dialog
                  }}
                  disabled={pinnedProjects.length >= 4}
                >
                  <AddIcon />
                </IconButton>
              }
            >
              <div className="widget-content">
                {pinnedProjects.length > 0 ? (
                  <div className="pinned-projects-list">
                    {pinnedProjects.map(project => (
                      <div key={project.id} className="pinned-project-item">
                        <Link to={`/projects/${project.id}`} className="project-link">
                          {project.name}
                        </Link>
                        <IconButton 
                          size="small"
                          onClick={() => handleUnpinProject(project.id)}
                          className="unpin-button"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-pinned">No pinned projects</div>
                )}
              </div>
            </Widget>
          </div>

          <div className="widget-wrapper quick-access">
            <Widget title="Quick Access">
              <div className="widget-content">
                <div className="quick-actions-grid">
                  {quickActions.map(action => (
                    <Button
                      key={action.title}
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={action.onClick}
                      className="quick-action-button"
                    >
                      {action.title}
                    </Button>
                  ))}
                </div>
              </div>
            </Widget>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;