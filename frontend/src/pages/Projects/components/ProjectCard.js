import React from 'react';
import './ProjectCard.css';

const ProjectCard = ({ project, onClick, isCreator, view = 'grid' }) => {
  const {
    name,
    description,
    admin,
    members = [],
    tasks = [],
    status,
    deadline,
    startTime,
    createdAt
  } = project;

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'future':
        return 'var(--warning-light)';
      case 'ongoing':
        return 'var(--success-light)';
      case 'completed':
        return 'var(--info-light)';
      default:
        return 'var(--surface-2)';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'future':
        return 'var(--warning)';
      case 'ongoing':
        return 'var(--success)';
      case 'completed':
        return 'var(--info)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const renderMeta = () => {
    if (view === 'grid') {
      return (
        <div className="project-meta">
          <span>{members.length} Members</span>
          <span className="separator">•</span>
          <span>{tasks.length} Tasks</span>
        </div>
      );
    }

    return (
      <div className="project-meta">
        <div className="project-meta-item">
          <span className="project-meta-label">Members</span>
          <span className="project-meta-value">{members.length}</span>
        </div>
        <div className="project-meta-item">
          <span className="project-meta-label">Tasks</span>
          <span className="project-meta-value">{tasks.length}</span>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    const profileImage = admin?.profile_image;
    const adminName = admin?.name || 'Unknown User';

    if (view === 'grid') {
      return (
        <div className="project-admin">
          <span className="admin-label">Admin:</span>
          <div className="admin-info">
            <div className="admin-avatar">
              {profileImage ? (
                <img src={profileImage} alt={adminName} />
              ) : (
                <span>{adminName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="admin-name">{adminName}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="project-admin">
        <span className="admin-label">Admin</span>
        <div className="admin-info">
          <div className="admin-avatar">
            {profileImage ? (
              <img src={profileImage} alt={adminName} />
            ) : (
              <span>{adminName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="admin-name">{adminName}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`project-card ${view}`} onClick={onClick}>
      <div className="project-header">
        <div className="project-title-wrap">
          <h3>{name}</h3>
          <span 
            className="project-status"
            style={{ 
              backgroundColor: getStatusColor(status),
              color: getStatusTextColor(status)
            }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="project-times">
        <div className="time-group">
          <div className="time-info">
            <span className="time-label">Start Time</span>
            <span className="time-value">{formatDate(startTime || createdAt)}</span>
          </div>
        </div>
        <div className="time-group">
          <div className="time-info">
            <span className="time-label">End Time</span>
            <span className="time-value">{formatDate(deadline)}</span>
          </div>
        </div>
      </div>

      <div className="project-footer">
        {renderMeta()}
        {renderAdmin()}
      </div>
    </div>
  );
};

export default ProjectCard; 