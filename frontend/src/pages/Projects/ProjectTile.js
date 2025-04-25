import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCalendarAlt, FaChartLine, FaTasks, FaEdit, FaTrash, FaEllipsisH } from "react-icons/fa";

const ProjectTile = ({ project, index, view, onEdit, onDelete }) => {
  const navigate = useNavigate();

  // Modern color themes with gradients
  const colorThemes = [
    { 
      gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      text: "#FFFFFF",
      accent: "#4F46E5"
    },
    { 
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      text: "#FFFFFF",
      accent: "#047857"
    },
    { 
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      text: "#FFFFFF",
      accent: "#B45309"
    },
    { 
      gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      text: "#FFFFFF",
      accent: "#B91C1C"
    }
  ];

  const colors = colorThemes[index % colorThemes.length];

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('.action-btn')) {
      return;
    }
    navigate(`/projects/${project._id}`);
  };

  return (
    <div 
      className={`project-card ${view}`} 
      style={{ 
        background: colors.gradient,
        color: colors.text
      }}
      onClick={handleCardClick}
    >
      <div className="project-card-content">
        <div className="project-header">
          <div className="project-title">
            <h3>{project.name}</h3>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(project.status) }}
            >
              {project.status}
            </span>
          </div>
          <div className="project-actions">
            <button className="action-btn edit" onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}>
              <FaEdit />
            </button>
            <button className="action-btn delete" onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}>
              <FaTrash />
            </button>
            <button className="action-btn more" onClick={(e) => {
              e.stopPropagation();
              // Handle more options
            }}>
              <FaEllipsisH />
            </button>
          </div>
        </div>

        <div className="project-creator">
          <img 
            src={project.admin?.profile_image || project.admin?.avatar || 'https://via.placeholder.com/32'} 
            alt={project.admin?.name || 'Creator'} 
          />
          <span>{project.admin?.name || 'Unknown'}</span>
        </div>

        <div className="project-stats">
          <div className="stat">
            <FaUsers className="stat-icon" />
            <span className="stat-value">{project.members?.length || 0}</span>
            <span className="stat-label">Members</span>
          </div>
          <div className="stat">
            <FaTasks className="stat-icon" />
            <span className="stat-value">{project.tasks?.length || 0}</span>
            <span className="stat-label">Tasks</span>
          </div>
          <div className="stat">
            <FaCalendarAlt className="stat-icon" />
            <span className="stat-value">
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
            </span>
            <span className="stat-label">Deadline</span>
          </div>
          <div className="stat">
            <FaChartLine className="stat-icon" />
            <span className="stat-value">{project.progress || 0}%</span>
            <span className="stat-label">Progress</span>
          </div>
        </div>

        <div className="project-progress">
          <div 
            className="progress-bar"
            style={{ 
              width: `${project.progress || 0}%`,
              backgroundColor: colors.accent
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectTile;
