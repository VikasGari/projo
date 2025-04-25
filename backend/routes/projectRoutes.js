const express = require("express");
const router = express.Router();
const {
    getAllProjects,
    getProjectById,
    createProject,
    addProjectMember,
    removeProjectMember,
    updateProject,
    deleteProject,
    inviteUser,
    addSubAdmin,
    removeSubAdmin
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const Project = require('../models/Project');

// Get all projects for user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id },
        { subAdmins: req.user._id }
      ]
    })
    .populate('admin', 'name email')
    .populate('members', 'name email')
    .populate('subAdmins', 'name email')
    .populate({
      path: 'tasks',
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name email' }
      ]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single project by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email')
      .populate('subAdmins', 'name email')
      .populate({
        path: 'tasks',
        populate: [
          { path: 'assignedTo', select: 'name email' },
          { path: 'createdBy', select: 'name email' }
        ]
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const hasAccess = 
      project.admin.equals(req.user._id) ||
      project.members.some(member => member.equals(req.user._id)) ||
      project.subAdmins.some(admin => admin.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new project
router.post("/", protect, createProject);

// Update project
router.put("/:id", protect, updateProject);

// Delete project
router.delete("/:id", protect, deleteProject);

// Add member to project
router.post("/:id/members", protect, addProjectMember);

// Remove member from project
router.delete("/:id/members/:userId", protect, removeProjectMember);

// Add subadmin to project
router.post("/:id/subadmin", protect, addSubAdmin);

// Remove subadmin from project
router.delete("/:id/subadmin/:userId", protect, removeSubAdmin);

// Project invite routes
router.post("/:id/invite", protect, inviteUser);

module.exports = router;
