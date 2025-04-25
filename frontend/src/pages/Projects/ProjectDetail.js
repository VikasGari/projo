import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { useTasks } from '../../context/TasksContext';
import { useAuth } from '../../context/AuthContext';
import { BsArrowLeft, BsThreeDots, BsPlusLg, BsX, BsCheck2, BsArrowRepeat, BsPerson, BsArrowDown, BsArrowUp, BsTrash, BsPersonPlus, BsPencil, BsChatDots, BsList, BsSend, BsXCircle, BsFolder } from 'react-icons/bs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import '../../styles/DetailPage.css';
import axios from 'axios';
import { useFriends } from '../../context/FriendsContext';
import { useTeams } from '../../context/TeamsContext';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { useProjectChat } from '../../context/ProjectChatContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Task Details Modal Component
const TaskDetailsModal = ({ task, onClose, onDelete, canDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: task.name,
    description: task.description || '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    priority: task.priority || 'medium'
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await onEdit(task._id, editFormData);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{isEditing ? 'Edit Task' : 'Task Details'}</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            {isEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-group">
                  <label>Task Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="task-detail-item">
                  <h3>Name</h3>
                  <p>{task.name}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Description</h3>
                  <p>{task.description || 'No description provided'}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Status</h3>
                  <p className={`status-badge ${task.status}`}>{task.status}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Priority</h3>
                  <p className={`priority-badge ${task.priority}`}>{task.priority}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Due Date</h3>
                  <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Assigned To</h3>
                  <p>{task.assignedTo ? task.assignedTo.name : 'Not assigned'}</p>
                </div>
                <div className="task-detail-item">
                  <h3>Created By</h3>
                  <p>{task.createdBy.name}</p>
                </div>
                <div className="modal-actions">
                  <button className="edit-btn" onClick={handleEdit}>
                    <BsPencil /> Edit Task
                  </button>
                  {canDelete && (
                    <button className="delete-btn" onClick={() => onDelete(task._id)}>
                      <BsTrash /> Delete Task
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, isAdmin, project, onClick, index, onEdit }) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const { deleteTask } = useTasks();
  
  const canDelete = isAdmin || task.createdBy?._id === user?._id;
  const canEdit = isAdmin || task.createdBy?._id === user?._id || task.assignedTo?._id === user?._id;

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
      // Refresh project data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  return (
    <>
      <Draggable draggableId={task._id} index={index}>
        {(provided) => (
          <div 
            className={`task-card ${task.isRejected ? 'rejected' : ''} ${task.status === 'completed' ? 'completed' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div className="task-content">
              <div className="task-header">
                <h4 className="task-title">{task.name || 'Untitled Task'}</h4>
                {canEdit && (
                  <button 
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(true);
                    }}
                  >
                    <BsPencil />
                  </button>
                )}
              </div>
              
              <div className="task-meta">
                <span className={`task-priority priority-${task.priority?.toLowerCase() || 'medium'}`}>
                  {task.priority || 'Medium'}
                </span>
                <div className="task-creator">
                  By: {task.createdBy?.name || 'Unknown'}
                </div>
                {task.dueDate && (
                  <div className="task-due-date">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {task.isRejected && (
                <div className="rejection-note">
                  <BsArrowRepeat /> Reassigned: {task.remark}
                </div>
              )}

              <div className="task-actions">
                <button 
                  className="view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
      
      {showDetails && (
        <TaskDetailsModal
          task={task}
          onClose={() => setShowDetails(false)}
          onDelete={handleDelete}
          canDelete={canDelete}
          onEdit={onEdit}
        />
      )}
    </>
  );
};

// Task Column Component
const TaskColumn = ({ id, title, tasks = [], isAdmin, project, onClick, children, onEdit }) => {
  console.log(`Rendering ${title} column with tasks:`, tasks); // Debug log
  
  return (
    <div className="task-column">
      <div className="task-column-header">
        <div className="header-content">
          <h3 className="task-column-title">{title}</h3>
          <span className="task-count">{tasks.length}</span>
          {id === 'todo' && children}
        </div>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isAdmin={isAdmin}
                  project={project}
                  onClick={onClick}
                  index={index}
                  onEdit={onEdit}
                />
              ))
            ) : (
              <div className="empty-column">
                No tasks in this column
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const MemberCard = ({ member, project, isAdmin, onPromote, onDemote, onRemove }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends = [], sendFriendRequest } = useFriends();
  const isFriend = Array.isArray(friends) && friends.some(friend => friend._id === member._id);
  const isCurrentUser = user?._id === member._id;
  const isAdminMember = project.admin._id === member._id;
  const isSubAdmin = project.subAdmins?.some(admin => admin._id === member._id);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewProfile = () => {
    navigate(`/profile/${member._id}`);
    setShowActionMenu(false);
  };

  const handleSendFriendRequest = async () => {
    if (loadingAction) return;
    
    setLoadingAction('friend');
    try {
      await sendFriendRequest(member._id);
      toast.success('Friend request sent successfully');
      setShowActionMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePromote = async () => {
    if (loadingAction) return;
    
    setLoadingAction('promote');
    try {
      await onPromote(project._id, member._id);
      toast.success('Member promoted to sub-admin');
      setShowActionMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote member');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDemote = async () => {
    if (loadingAction) return;
    
    setLoadingAction('demote');
    try {
      await onDemote(project._id, member._id);
      toast.success('Sub-admin demoted to member');
      setShowActionMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote member');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async () => {
    if (loadingAction) return;
    
    setLoadingAction('remove');
    try {
      await onRemove(project._id, member._id);
      toast.success('Member removed successfully');
      setShowActionMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoadingAction(null);
    }
  };

  // Add null checks and default values
  const memberName = member?.name || 'Unknown User';
  const memberEmail = member?.email || 'No email';
  const profileImage = member?.profile_image;

  return (
    <div className="member-card">
      <div className="member-avatar">
        {profileImage ? (
          <img src={profileImage} alt={memberName} />
        ) : (
          <span>{memberName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="member-info">
        <div className="member-details">
          <h4>{memberName}</h4>
          <p>{memberEmail}</p>
          <div className="member-badges">
            {isCurrentUser && <p className="you-badge">You</p>}
            {isAdminMember && <p className="admin-badge">Admin</p>}
            {isSubAdmin && <p className="subadmin-badge">Sub-Admin</p>}
          </div>
        </div>
      </div>
      <div className="member-actions" ref={actionMenuRef}>
        <button 
          className="action-btn"
          onClick={() => setShowActionMenu(!showActionMenu)}
          title="Actions"
          disabled={!!loadingAction}
        >
          {loadingAction ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <BsThreeDots />
          )}
        </button>
        {showActionMenu && (
          <div className="action-menu">
            <div 
              className="action-menu-item"
              onClick={handleViewProfile}
            >
              <BsPerson /> View Profile
            </div>
            {!isCurrentUser && !isFriend && (
              <div 
                className="action-menu-item"
                onClick={handleSendFriendRequest}
                disabled={loadingAction === 'friend'}
              >
                {loadingAction === 'friend' ? (
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <BsPersonPlus />
                )} Add Friend
              </div>
            )}
            {isAdmin && !isCurrentUser && !isAdminMember && (
              <>
                {!isSubAdmin ? (
                  <div 
                    className="action-menu-item"
                    onClick={handlePromote}
                    disabled={loadingAction === 'promote'}
                  >
                    {loadingAction === 'promote' ? (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <BsArrowUp />
                    )} Promote to Sub-Admin
                  </div>
                ) : (
                  <div 
                    className="action-menu-item"
                    onClick={handleDemote}
                    disabled={loadingAction === 'demote'}
                  >
                    {loadingAction === 'demote' ? (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <BsArrowDown />
                    )} Demote from Sub-Admin
                  </div>
                )}
                <div 
                  className="action-menu-item danger"
                  onClick={handleRemove}
                  disabled={loadingAction === 'remove'}
                >
                  {loadingAction === 'remove' ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <BsTrash />
                  )} Remove Member
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InviteMembersModal = ({ onClose, onInvite, projectId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      await onInvite(email.trim());
      setEmail('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Invite Member</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter user's email"
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddTaskModal = ({ onClose, onAdd, projectId }) => {
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(taskData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Add New Task</h3>
            <button className="close-btn" onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Task Name</label>
                <input
                  type="text"
                  value={taskData.name}
                  onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    projects, 
    loading, 
    error, 
    updateProject,
    fetchProjects,
    addTask,
    addSubAdmin,
    removeSubAdmin,
    removeMember,
    inviteMember,
    createTask,
    updateTask,
    deleteTask,
    getProject,
    deleteProject
  } = useProjects();
  const { sendFriendRequest } = useFriends();
  const { teams } = useTeams();
  const { 
    messages, 
    loading: chatLoading, 
    error: chatError, 
    fetchMessages, 
    sendMessage, 
    markMessagesAsRead,
    sendingMessage,
    setMessages
  } = useProjectChat();
  const { updateTaskStatus, deleteTask: deleteTaskContext, assignTask } = useTasks();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({
    todo: [],
    assigned: [],
    review: [],
    completed: []
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [draggedTask, setDraggedTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'ongoing',
    deadline: ''
  });
  const [newMessage, setNewMessage] = useState('');
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [projectMessages, setProjectMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadProjectData = useCallback(async () => {
    try {
      let foundProject;
      
      // First try to find in existing projects
      if (projects && projects.length > 0) {
        foundProject = projects.find(p => p._id === projectId);
      }
      
      // If not found in existing projects, fetch directly
      if (!foundProject) {
        try {
          foundProject = await getProject(projectId);
        } catch (error) {
          console.error('Error fetching project:', error);
          toast.error('Project not found');
          navigate('/projects');
          return;
        }
      }

      // Sort tasks by due date
      const sortedTasks = {
        todo: foundProject.tasks.filter(t => t.status === 'todo').sort((a, b) => 
          a.dueDate && b.dueDate ? new Date(a.dueDate) - new Date(b.dueDate) : !a.dueDate ? 1 : -1
        ),
        assigned: foundProject.tasks.filter(t => t.status === 'assigned').sort((a, b) => 
          a.dueDate && b.dueDate ? new Date(a.dueDate) - new Date(b.dueDate) : !a.dueDate ? 1 : -1
        ),
        review: foundProject.tasks.filter(t => t.status === 'review').sort((a, b) => 
          a.dueDate && b.dueDate ? new Date(a.dueDate) - new Date(b.dueDate) : !a.dueDate ? 1 : -1
        ),
        completed: foundProject.tasks.filter(t => t.status === 'completed').sort((a, b) => 
          a.dueDate && b.dueDate ? new Date(a.dueDate) - new Date(b.dueDate) : !a.dueDate ? 1 : -1
        )
      };
      setProject(foundProject);
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
    }
  }, [projects, projectId, getProject, navigate]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    if (project?._id) {
      loadProjectMessages();
    }
  }, [project?._id]);

  const loadProjectMessages = async () => {
    if (!project?._id) return;
    
    setIsChatLoading(true);
    try {
      await fetchMessages(project._id);
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setIsChatLoading(false);
    }
  };

  const isAdmin = project?.admin?._id && user?._id ? project.admin._id.toString() === user._id.toString() : false;
  const isSubAdmin = project?.subAdmins && user?._id ? project.subAdmins.some(admin => admin?._id?.toString() === user._id.toString()) : false;
  const canManage = isAdmin || isSubAdmin;

  useEffect(() => {
    console.log('Project:', project);
    console.log('User:', user);
    console.log('Is Admin:', isAdmin);
    console.log('Is SubAdmin:', isSubAdmin);
    console.log('Can Manage:', canManage);
  }, [project, user, isAdmin, isSubAdmin, canManage]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task._id);
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Failed to update task status');
    }
  };

  const handleDrop = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Don't do anything if dropped in same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    try {
      const sourceStatus = source.droppableId;
      const destinationStatus = destination.droppableId;
      const taskId = draggableId;
      const task = tasks[sourceStatus].find(t => t._id === taskId);

      // Check permissions for status changes
      if (!isAdmin && !isSubAdmin) {
        // Only assigned user can move task to review
        if (destinationStatus === 'review' && task.assignedTo?._id !== user?._id) {
          toast.error('Only the assigned user can move this task to review');
          return;
        }
        
        // Only admin/subadmin can move tasks to completed
        if (destinationStatus === 'completed') {
          toast.error('Only project administrators can mark tasks as completed');
          return;
        }

        // Only admin/subadmin can assign tasks
        if (destinationStatus === 'assigned') {
          toast.error('Only project administrators can assign tasks');
          return;
        }
      }

      // If moving to assigned, show assign modal
      if (destinationStatus === 'assigned') {
        setCurrentTask(task);
        setShowAssignModal(true);
        return;
      }

      // Update task status
      await handleUpdateTaskStatus(taskId, destinationStatus);

      // Optimistically update UI
      const updatedTasks = { ...tasks };
      let movedTask;

      // Remove from source
      updatedTasks[sourceStatus] = updatedTasks[sourceStatus].filter(t => {
        if (t._id === taskId) {
          movedTask = { ...t, status: destinationStatus };
          return false;
        }
        return true;
      });

      // Add to destination
      if (movedTask) {
        updatedTasks[destinationStatus] = [...updatedTasks[destinationStatus], movedTask];
      }

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      // Revert to original state by reloading project data
      await loadProjectData();
    }
  };

  const handleAssignTask = async () => {
    if (!currentTask || !selectedMember) {
      toast.error('Please select a member to assign the task to');
      return;
    }
    
    try {
      // First update the task status
      await updateTaskStatus(currentTask._id, 'assigned');
      
      // Then assign the task to the selected member
      const updatedTask = await assignTask(currentTask._id, selectedMember);
      
      // Update local state
      setTasks(prev => {
        const todoTasks = prev.todo.filter(t => t._id !== currentTask._id);
        const assignedTasks = [...prev.assigned, updatedTask];
        return {
          ...prev,
          todo: todoTasks,
          assigned: assignedTasks
        };
      });
      
      setShowAssignModal(false);
      setSelectedMember('');
      setCurrentTask(null);
      
      toast.success('Task assigned successfully');
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error(error.message || 'Failed to assign task');
    }
  };

  const handleRejectTask = async () => {
    if (!currentTask || !remark.trim()) return;
    
    // Update local state
    const updatedTasks = { ...tasks };
    updatedTasks.review = updatedTasks.review.filter(t => t._id !== currentTask._id);
    
    const updatedTask = { 
      ...currentTask, 
      status: 'assigned', 
      remark: remark.trim(),
      isRejected: true
    };
    
    updatedTasks.assigned = [...updatedTasks.assigned, updatedTask];
    setTasks(updatedTasks);
    
    // Update in backend
    try {
      await updateProject(projectId, {
        taskUpdate: {
          taskId: currentTask._id,
          status: 'assigned',
          remark: remark.trim(),
          isRejected: true
        }
      });
      
      setShowRemarkModal(false);
      setRemark('');
      setCurrentTask(null);
    } catch (error) {
      console.error('Error rejecting task:', error);
      fetchProjects();
    }
  };

  const handleAddTaskClick = () => {
    setNewTask({
      name: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
    setShowAddTaskModal(true);
  };

  const handleAddTask = async (taskData) => {
    if (!taskData.name.trim()) {
      toast.error('Task name is required');
      return;
    }
    
    try {
      const newTask = await createTask(project._id, {
        title: taskData.name.trim(),
        description: taskData.description.trim(),
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        status: 'todo'
      });
      
      // Update local state immediately
      setTasks(prevTasks => ({
        ...prevTasks,
        todo: [...prevTasks.todo, newTask]
      }));
      
      setShowAddTaskModal(false);
      setNewTask({
        name: '',
        description: '',
        dueDate: '',
        priority: 'medium'
      });
      
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleTaskAction = (action, task) => {
    setCurrentTask(task);
    if (action === 'view') {
      setShowTaskDetails(true);
    }
  };

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  const handlePromoteMember = async (projectId, memberId) => {
    if (!projectId || !memberId) return;
    
    try {
      const updatedProject = await addSubAdmin(projectId, memberId);
      
      // Update local state immediately
      setProject(prevProject => ({
        ...prevProject,
        subAdmins: [...prevProject.subAdmins, updatedProject.subAdmins[updatedProject.subAdmins.length - 1]]
      }));
      
      toast.success('Member promoted to sub-admin');
    } catch (err) {
      console.error('Error promoting member:', err);
      toast.error(err.response?.data?.message || 'Failed to promote member');
    }
  };

  const handleDemoteMember = async (projectId, memberId) => {
    if (!projectId || !memberId) return;
    
    try {
      const updatedProject = await removeSubAdmin(projectId, memberId);
      
      // Update local state immediately
      setProject(prevProject => ({
        ...prevProject,
        subAdmins: prevProject.subAdmins.filter(admin => admin._id !== memberId)
      }));
      
      toast.success('Sub-admin demoted to member');
    } catch (err) {
      console.error('Error demoting member:', err);
      toast.error(err.response?.data?.message || 'Failed to demote member');
    }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    if (!projectId || !memberId) return;
    
    try {
      const updatedProject = await removeMember(projectId, memberId);
      
      // Update local state immediately
      setProject(prevProject => ({
        ...prevProject,
        members: prevProject.members.filter(member => member._id !== memberId)
      }));
      
      toast.success('Member removed successfully');
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleInviteMember = async (email) => {
    if (!project?._id) return;
    
    try {
      await inviteMember(project._id, email);
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleEditProject = () => {
    if (!project) return;
    
    if (!isAdmin && !isSubAdmin) {
      toast.error('You are not authorized to edit this project');
      return;
    }
    
    setEditFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'ongoing',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!project?._id) return;
    
    try {
      await updateProject(project._id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        status: editFormData.status,
        deadline: editFormData.deadline || null
      });
      
      setShowEditModal(false);
      toast.success('Project updated successfully');
      await loadProjectData();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !project?._id) return;

    try {
      const response = await sendMessage(project._id, newMessage);
      setNewMessage('');
      // Update messages directly from the response instead of refetching
      if (response?.chat?.messages) {
        setMessages(response.chat.messages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      await loadProjectData();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const handleEditTask = async (taskId, updatedData) => {
    try {
      await updateTask(taskId, updatedData);
      await loadProjectData();
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    }
  };

  const renderChat = () => {
    if (chatLoading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      );
    }

    if (chatError) {
      return (
        <div className="error-state">
          <p>{chatError}</p>
          <button className="retry-button" onClick={() => fetchMessages(project._id)}>
            <BsArrowRepeat /> Retry
          </button>
        </div>
      );
    }

    return (
      <div className="chat-container">
        <div className="chat-messages">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div 
                key={message._id} 
                className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
              >
                <div className="sender-avatar">
                  {message.sender.profile_image ? (
                    <img src={message.sender.profile_image} alt={message.sender.name} />
                  ) : (
                    <span>{message.sender.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-header">
                    <span className="sender-name">{message.sender.name}</span>
                    <span className="message-time">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-placeholder">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendingMessage}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <BsSend />
            )}
          </button>
        </form>
      </div>
    );
  };

  const renderMemberActions = (member) => {
    if (!isAdmin || member._id === user._id) return null;
    
    return (
      <div className="member-actions">
        {member.role === 'member' ? (
          <button 
            className="promote-button"
            onClick={() => handlePromoteMember(project._id, member._id)}
          >
            <BsArrowUp /> Promote to Sub-admin
          </button>
        ) : (
          <button 
            className="demote-button"
            onClick={() => handleDemoteMember(project._id, member._id)}
          >
            <BsArrowDown /> Demote to Member
          </button>
        )}
        <button 
          className="remove-button"
          onClick={() => handleRemoveMember(project._id, member._id)}
        >
          <BsTrash /> Remove
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (project?._id && activeTab === 'chat') {
      fetchMessages(project._id);
    }
  }, [project?._id, activeTab, fetchMessages]);

  useEffect(() => {
    if (project?._id && activeTab === 'chat' && messages.length > 0) {
      markMessagesAsRead(project._id);
    }
  }, [project?._id, activeTab, messages.length, markMessagesAsRead]);

  const handleDeleteProject = async () => {
    if (!project?._id) return;
    
    if (!isAdmin) {
      toast.error('You are not authorized to delete this project');
      return;
    }

    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(project._id);
        toast.success('Project deleted successfully');
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error(error.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-button" onClick={loadProjectData}>
            <BsArrowRepeat /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>Project not found</p>
          <button className="retry-button" onClick={handleBackToProjects}>
            <BsArrowLeft /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBackToProjects}>
            <BsArrowLeft /> Back to Projects
          </button>
          {isAdmin && (
            <div className="detail-actions">
              <button className="action-button" onClick={handleEditProject}>
                <BsPencil /> Edit Project
              </button>
              <button className="action-button" onClick={() => setShowInviteModal(true)}>
                <BsPersonPlus /> Invite
              </button>
              <button className="action-button danger" onClick={handleDeleteProject}>
                <BsTrash /> Delete Project
              </button>
            </div>
          )}
        </div>
        <div className="detail-info">
          <div className="detail-title">
            <h1>{project?.name}</h1>
            <div className="detail-meta">
              <span className="member-count">{project?.members?.length || 0} members</span>
              <span className="status-badge">{project?.status}</span>
            </div>
          </div>
          {project?.description && (
            <div className="detail-description">
              <p>{project.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="detail-tabs">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <BsPerson className="tab-icon" />
            <span>Members</span>
            {project?.members?.length > 0 && (
              <span className="tab-badge">{project.members.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <BsList className="tab-icon" />
            <span>Tasks</span>
            {project?.tasks?.length > 0 && (
              <span className="tab-badge">{project.tasks.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <BsChatDots className="tab-icon" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'members' && (
          <div className="members-container">
            <div className="members-list">
              {project?.members?.length > 0 ? (
                project.members.map(member => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    project={project}
                    isAdmin={isAdmin}
                    onPromote={handlePromoteMember}
                    onDemote={handleDemoteMember}
                    onRemove={handleRemoveMember}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>No members in this project yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-container">
            <DragDropContext onDragEnd={handleDrop}>
            <div className="tasks-list">
                <TaskColumn
                  id="todo"
                  title="To Do"
                  tasks={tasks.todo}
                  isAdmin={isAdmin}
                  project={project}
                  onClick={handleTaskAction}
                  onEdit={handleEditTask}
                >
                  {canManage && (
                    <button className="add-task-btn" onClick={handleAddTaskClick}>
                      <BsPlusLg />
                    </button>
                  )}
                </TaskColumn>
                <TaskColumn
                  id="assigned"
                  title="Assigned"
                  tasks={tasks.assigned}
                  isAdmin={isAdmin}
                  project={project}
                  onClick={handleTaskAction}
                  onEdit={handleEditTask}
                />
                <TaskColumn
                  id="review"
                  title="In Review"
                  tasks={tasks.review}
                  isAdmin={isAdmin}
                  project={project}
                  onClick={handleTaskAction}
                  onEdit={handleEditTask}
                />
                <TaskColumn
                  id="completed"
                  title="Completed"
                  tasks={tasks.completed}
                  isAdmin={isAdmin}
                  project={project}
                  onClick={handleTaskAction}
                  onEdit={handleEditTask}
                />
                    </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            {renderChat()}
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Invite Member</h3>
                <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                  <BsX />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  handleInviteMember(email);
                  setShowInviteModal(false);
                }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter user's email"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowInviteModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-button">
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Project</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <BsX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Enter project description"
                    rows="4"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="submit-button" onClick={handleUpdateProject}>
                  Update Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onAdd={handleAddTask}
          projectId={project._id}
        />
      )}

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Assign Task</h3>
                <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                  <BsX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Member</label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    required
                  >
                    <option value="">Select a member</option>
                    {project?.members?.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button className="submit-button" onClick={handleAssignTask}>
                    Assign Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail; 