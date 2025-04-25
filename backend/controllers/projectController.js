const asyncHandler = require("express-async-handler");
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const Task = require("../models/Task");

// @desc Get all projects
// @route GET /project
const getAllProjects = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find projects where user is:
    // 1. Admin
    // 2. SubAdmin
    // 3. Member
    const projects = await Project.find({
        $or: [
            { admin: userId },
            { subAdmins: userId },
            { members: userId }
        ]
    })
    .populate("team", "name")
    .populate("admin", "name email profile_image")
    .populate("subAdmins", "name email profile_image")
    .populate("members", "name email profile_image")
    .populate({
        path: "tasks",
        select: "title description status priority dueDate assignedTo createdBy isRejected remark completedAt",
        populate: [
            { path: "assignedTo", select: "name email profile_image" },
            { path: "createdBy", select: "name email profile_image" }
        ]
    })
    .sort({ createdAt: -1 })
    .exec();

    res.json(projects);
});

// @desc Get project by ID
// @route GET /project/:id
const getProjectById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const projectId = req.params.id;

    const project = await Project.findById(projectId)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image")
        .populate({
            path: "tasks",
            select: "title description status priority dueDate assignedTo createdBy isRejected remark completedAt",
            populate: [
                { path: "assignedTo", select: "name email profile_image" },
                { path: "createdBy", select: "name email profile_image" }
            ]
        })
        .exec();

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to the project
    const hasAccess = 
        project.admin._id.toString() === userId.toString() ||
        project.subAdmins.some(admin => admin._id.toString() === userId.toString()) ||
        project.members.some(member => member._id.toString() === userId.toString());

    if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this project" });
    }

    res.json(project);
});

// @desc Create a new project
// @route POST /project
const createProject = asyncHandler(async (req, res) => {
    const { name, description, teamId, status, startTime, deadline } = req.body;
    const adminId = req.user._id;

    if (!name || !adminId || !teamId) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    // Validate status-specific requirements
    if (status === 'future' && !startTime) {
        return res.status(400).json({ message: "Start time is required for future projects" });
    }
    if (status === 'ongoing' && !deadline) {
        return res.status(400).json({ message: "Deadline is required for ongoing projects" });
    }

    // Create project with admin as the first member
    const project = await Project.create({
        name,
        description,
        admin: adminId,
        members: [adminId],
        subAdmins: [], // Initialize empty subAdmins array
        team: teamId,
        status,
        startTime: status === 'future' ? startTime : null,
        deadline: status === 'ongoing' ? deadline : null
    });

    // Add project to admin's projects array
    const user = await User.findById(adminId);
    if (!user.projects) {
        user.projects = [];
    }
    user.projects.push(project._id);
    await user.save();

    // Add project to team's projects array
    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    if (!team.projects) {
        team.projects = [];
    }
    team.projects.push(project._id);
    await team.save();

    // Populate the response
    const populatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.status(201).json(populatedProject);
});

// @desc Add a member to a project
// @route POST /project/:id/members
const addProjectMember = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const project = await Project.findById(projectId);
    const user = await User.findById(userId);

    if (!project || !user) {
        return res.status(404).json({ message: "Project or user not found" });
    }

    // Check if the requester is the project admin or subadmin
    const isAdmin = project.admin.toString() === adminId.toString();
    const isSubAdmin = project.subAdmins.some(id => id.toString() === adminId.toString());
    
    if (!isAdmin && !isSubAdmin) {
        return res.status(403).json({ message: "Only project admin or subadmin can add members" });
    }

    // Check if user is already a member
    if (project.members.includes(userId)) {
        return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to project members
    project.members.push(userId);

    // Add project to user's projects array
    if (!user.projects) {
        user.projects = [];
    }
    if (!user.projects.includes(projectId)) {
        user.projects.push(projectId);
    }

    await Promise.all([project.save(), user.save()]);

    const updatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedProject);
});

// @desc Remove a member from a project
// @route DELETE /project/:id/members/:userId
const removeProjectMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const adminId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Check if the requester is the project admin
    if (project.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only project admin can remove members" });
    }

    // Cannot remove the admin
    if (userId === project.admin.toString()) {
        return res.status(400).json({ message: "Cannot remove project admin" });
    }

    // Check if user is a member
    if (!project.members.includes(userId)) {
        return res.status(400).json({ message: "User is not a member" });
    }

    project.members = project.members.filter(id => id.toString() !== userId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedProject);
});

// @desc Update a project
// @route PUT /project/:id
const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, teamId, status, startTime, deadline } = req.body;
    const adminId = req.user._id;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only admin can update the project
    if (project.admin.toString() !== adminId) {
        return res.status(403).json({ message: "Not authorized to update this project" });
    }

    // Validate status transitions
    if (status && status !== project.status) {
        if (status === 'completed' && project.status !== 'ongoing') {
            return res.status(400).json({ message: "Project can only be marked as completed from ongoing status" });
        }
    }

    // Validate status-specific requirements
    if (status === 'future' && !startTime) {
        return res.status(400).json({ message: "Start time is required for future projects" });
    }
    if (status === 'ongoing' && !deadline) {
        return res.status(400).json({ message: "Deadline is required for ongoing projects" });
    }

    // Update project fields
    project.name = name || project.name;
    project.description = description || project.description;
    project.team = teamId || project.team;
    if (status) project.status = status;
    if (startTime && status === 'future') project.startTime = startTime;
    if (deadline && status === 'ongoing') project.deadline = deadline;

    await project.save();

    // Populate the response with necessary data
    const updatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image")
        .populate("tasks", "name status");

    res.json(updatedProject);
});

// @desc Delete a project
// @route DELETE /project/:id
const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only admin can delete the project
    if (project.admin.toString() !== adminId) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: id });

    // Delete the project
    await project.deleteOne();

    res.json({ message: "Project and associated tasks deleted successfully" });
});

// @desc Invite a user to a project
// @route POST /project/:id/invite
const inviteUser = asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const { email } = req.body;
    const adminId = req.user._id;

    console.log('Invite request:', { projectId, email, adminId });

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Check if the requester is the project admin or subadmin
    const isAdmin = project.admin.toString() === adminId.toString();
    const isSubAdmin = project.subAdmins.some(id => id.toString() === adminId.toString());
    
    if (!isAdmin && !isSubAdmin) {
        return res.status(403).json({ message: "Only project admin or subadmin can invite members" });
    }

    // Find user by email
    console.log('Searching for user with email:', email);
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('Found user:', user);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (project.members.includes(user._id)) {
        return res.status(400).json({ message: "User is already a member of this project" });
    }

    // Check if there's already a pending request
    const existingRequest = user.projectJoinRequests.find(request => 
        request.project.toString() === projectId && request.status === "pending"
    );

    if (existingRequest) {
        return res.status(400).json({ message: "User already has a pending invitation to this project" });
    }

    // Add join request to user's projectJoinRequests
    user.projectJoinRequests.push({
        project: projectId,
        requestedBy: adminId,
        status: "pending",
        requestedAt: Date.now()
    });

    await user.save();

    res.json({ message: "Project invitation sent successfully" });
});

// @desc Add a subadmin to a project
// @route POST /project/:id/subadmin
const addSubAdmin = asyncHandler(async (req, res) => {
    const { id: projectId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Only project admin can add subadmins
    if (project.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only project admin can add subadmins" });
    }

    // Check if user is already a subadmin
    if (project.subAdmins.includes(userId)) {
        return res.status(400).json({ message: "User is already a subadmin" });
    }

    // Check if user is a member
    if (!project.members.includes(userId)) {
        return res.status(400).json({ message: "User must be a member to become a subadmin" });
    }

    // Add user to subadmins
    project.subAdmins.push(userId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedProject);
});

// @desc Remove a subadmin from a project
// @route DELETE /project/:id/subadmin/:userId
const removeSubAdmin = asyncHandler(async (req, res) => {
    const { id: projectId, userId } = req.params;
    const adminId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Only project admin can remove subadmins
    if (project.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only project admin can remove subadmins" });
    }

    // Check if user is a subadmin
    if (!project.subAdmins.includes(userId)) {
        return res.status(400).json({ message: "User is not a subadmin" });
    }

    // Remove user from subadmins
    project.subAdmins = project.subAdmins.filter(id => id.toString() !== userId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
        .populate("team", "name")
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedProject);
});

module.exports = {
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
};
