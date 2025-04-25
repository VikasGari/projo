const asyncHandler = require("express-async-handler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require('./notificationController');
const { sendNotification } = require('../services/socketService');

// Helper function to check if user has access to a project
const checkProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    
    return project.admin.toString() === userId.toString() || 
           project.members.some(member => member.toString() === userId.toString());
};

// @desc Get a task by ID
// @route GET /task/:id
// @access Private
const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, req.user._id);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to access this task" });
    }

    res.json(task);
});

// @desc Create a new task
// @route POST /task
// @access Private
const createTask = asyncHandler(async (req, res) => {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    const createdBy = req.user._id;

    if (!title || !projectId) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(projectId, req.user._id);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to create tasks in this project" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Create task with all fields
    const task = await Task.create({ 
        title, 
        description: description || '', 
        project: projectId, 
        assignedTo: assignedTo || null, 
        createdBy,
        status: 'todo',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        isRejected: false,
        remark: '',
        completedAt: null
    });

    // Populate task with references
    const populatedTask = await Task.findById(task._id)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();

    // Add task to project
    project.tasks.push(task._id);
    await project.save();

    res.status(201).json(populatedTask);
});

// @desc Update a task
// @route PUT /task/:id
// @access Private
const updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const task = await Task.findById(id)
        .populate("project", "name")
        .populate("createdBy", "name email");
        
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, userId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Only creator or project admin can update task details
    const isCreator = task.createdBy._id.toString() === userId.toString();
    const project = await Project.findById(task.project._id);
    const isAdmin = project.admin.toString() === userId.toString();

    if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Only task creator or project admin can update task details" });
    }

    // Update allowed fields
    if (updates.title) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status) task.status = updates.status;
    if (updates.priority) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;
    if (updates.isRejected !== undefined) task.isRejected = updates.isRejected;
    if (updates.remark !== undefined) task.remark = updates.remark;
    if (updates.completedAt !== undefined) task.completedAt = updates.completedAt;

    await task.save();

    // Return populated task
    const updatedTask = await Task.findById(id)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();

    res.json(updatedTask);
});

// @desc Update a task status
// @route PATCH /task/:id/status
// @access Private
const updateTaskStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(id)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");
        
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, userId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Only assigned user, creator, or project admin can update status
    const isAssigned = task.assignedTo && task.assignedTo._id.toString() === userId.toString();
    const isCreator = task.createdBy._id.toString() === userId.toString();
    const project = await Project.findById(task.project._id);
    const isAdmin = project.admin.toString() === userId.toString();

    if (!isAssigned && !isCreator && !isAdmin) {
        return res.status(403).json({ message: "Only assigned user, creator, or project admin can update task status" });
    }

    const oldStatus = task.status;
    task.status = status;
    
    if (status === 'completed') {
        task.completedAt = new Date();
    }

    await task.save();

    const updatedTask = await Task.findById(id)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();
    
    // Send notification to task creator if they're not the one updating it
    if (task.createdBy && task.createdBy._id.toString() !== userId) {
        const notification = {
            recipient: task.createdBy._id,
            type: "task_status_changed",
            title: "Task Status Updated",
            message: `Task "${task.title}" was moved from ${oldStatus} to ${status}`,
            relatedTask: task._id,
            relatedProject: task.project?._id,
            link: `/projects/${task.project?._id}`,
            metadata: {
                oldStatus,
                newStatus: status
            }
        };
        
        await sendNotification(notification);
    }
    
    // Send notification to assignee if they're not the one updating it
    if (task.assignedTo && task.assignedTo._id.toString() !== userId) {
        const notification = {
            recipient: task.assignedTo._id,
            type: "task_status_changed",
            title: "Task Status Updated",
            message: `Task "${task.title}" was moved from ${oldStatus} to ${status}`,
            relatedTask: task._id,
            relatedProject: task.project?._id,
            link: `/projects/${task.project?._id}`,
            metadata: {
                oldStatus,
                newStatus: status
            }
        };
        
        await sendNotification(notification);
    }

    res.json(updatedTask);
});

// @desc Delete a task
// @route DELETE /task/:id
// @access Private
const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(id)
        .populate("project", "name")
        .populate("createdBy", "name email");
        
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, userId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    // Only creator or project admin can delete task
    const isCreator = task.createdBy._id.toString() === userId.toString();
    const projectDoc = await Project.findById(task.project._id);
    const isAdmin = projectDoc.admin.toString() === userId.toString();

    if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Only task creator or project admin can delete task" });
    }

    // Remove task from project
    projectDoc.tasks = projectDoc.tasks.filter(taskId => taskId.toString() !== id);
    await projectDoc.save();

    await task.deleteOne();
    res.json({ message: "Task deleted" });
});

// @desc Assign a task to a user
// @route POST /task/assign
// @access Private
const assignTask = asyncHandler(async (req, res) => {
    const { taskId, userId } = req.body;
    const currentUserId = req.user._id;

    if (!taskId || !userId) {
        return res.status(400).json({ message: "Task ID and User ID are required" });
    }

    const task = await Task.findById(taskId)
        .populate("project", "name")
        .populate("createdBy", "name email");
        
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, currentUserId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to assign tasks in this project" });
    }

    // Only creator or project admin can assign tasks
    const isCreator = task.createdBy._id.toString() === currentUserId.toString();
    const project = await Project.findById(task.project._id);
    const isAdmin = project.admin.toString() === currentUserId.toString();

    if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Only task creator or project admin can assign tasks" });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if the user to be assigned is a project member
    const isProjectMember = project.members.some(member => member.toString() === userId);
    if (!isProjectMember) {
        return res.status(403).json({ message: "Can only assign tasks to project members" });
    }

    task.assignedTo = userId;
    await task.save();

    const updatedTask = await Task.findById(taskId)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();
    
    // Send notification to the assigned user
    const notification = {
        recipient: userId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You have been assigned to task "${task.title}" in project "${task.project?.name || 'Unknown'}"`,
        relatedTask: task._id,
        relatedProject: task.project?._id,
        relatedUser: currentUserId,
        link: `/projects/${task.project?._id}`,
    };
    
    await sendNotification(notification);

    res.json(updatedTask);
});

// @desc Unassign a task from a user
// @route POST /task/unassign
// @access Private
const unassignTask = asyncHandler(async (req, res) => {
    const { taskId } = req.body;
    const userId = req.user._id;

    if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
    }

    const task = await Task.findById(taskId)
        .populate("project", "name")
        .populate("createdBy", "name email");
        
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(task.project._id, userId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to unassign tasks in this project" });
    }

    // Only creator or project admin can unassign tasks
    const isCreator = task.createdBy._id.toString() === userId.toString();
    const project = await Project.findById(task.project._id);
    const isAdmin = project.admin.toString() === userId.toString();

    if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Only task creator or project admin can unassign tasks" });
    }

    // Store the previously assigned user before unassigning
    const previouslyAssignedTo = task.assignedTo;

    task.assignedTo = null;
    await task.save();

    const updatedTask = await Task.findById(taskId)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .exec();
    
    // Send notification to the previously assigned user if there was one
    if (previouslyAssignedTo) {
        const notification = {
            recipient: previouslyAssignedTo,
            type: "task_status_changed",
            title: "Task Unassigned",
            message: `You have been unassigned from task "${task.title}"`,
            relatedTask: task._id,
            relatedProject: task.project._id,
            relatedUser: userId,
            link: `/projects/${task.project._id}`,
        };
        
        await sendNotification(notification);
    }

    res.json(updatedTask);
});

module.exports = {
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    assignTask,
    unassignTask
};
