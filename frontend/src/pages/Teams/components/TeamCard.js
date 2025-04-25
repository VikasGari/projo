import React from 'react';
import './TeamCard.css';

const TeamCard = ({ team, onClick, isCreator, view = 'grid' }) => {
  const {
    name,
    description,
    admin,
    members = [],
    projects = [],
    createdAt
  } = team;

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

  const renderMeta = () => {
    if (view === 'grid') {
      return (
        <div className="team-meta">
          <span>{members.length} Members</span>
          <span className="separator">•</span>
          <span>{projects.length} Projects</span>
        </div>
      );
    }

    return (
      <div className="team-meta">
        <div className="team-meta-item">
          <span className="team-meta-label">Members</span>
          <span className="team-meta-value">{members.length}</span>
        </div>
        <div className="team-meta-item">
          <span className="team-meta-label">Projects</span>
          <span className="team-meta-value">{projects.length}</span>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    const profileImage = admin?.profile_image;
    const adminName = admin?.name || 'Unknown User';

    if (view === 'grid') {
      return (
        <div className="team-admin">
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
      <div className="team-admin">
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
    <div className={`team-card ${view}`} onClick={onClick}>
      <div className="team-header">
        <div className="team-title-wrap">
          <h3>{name}</h3>
          <span className="team-description">
            {description || 'No description provided'}
          </span>
        </div>
      </div>

      <div className="team-times">
        <div className="time-info">
          <span className="time-label">Created</span>
          <span className="time-value">{formatDate(createdAt)}</span>
        </div>
      </div>

      <div className="team-footer">
        {renderMeta()}
        {renderAdmin()}
      </div>
    </div>
  );
};

export default TeamCard; 