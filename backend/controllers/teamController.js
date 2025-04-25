const asyncHandler = require("express-async-handler");
const Team = require("../models/Team");
const User = require("../models/User");

// @desc    Get all teams for the logged-in user
// @route   GET /api/teams
// @access  Private
const getTeams = asyncHandler(async (req, res) => {
    // Get teams where user is either admin or member
    const teams = await Team.find({
        $or: [
            { admin: req.user._id },
            { members: req.user._id }
        ]
    })
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image")
        .sort("-createdAt");

    res.json(teams);
});

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id)
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image")
        .populate({
            path: "projects",
            select: "name description status startTime deadline members tasks",
            populate: [
                {
                    path: "members",
                    select: "name email profile_image"
                },
                {
                    path: "tasks",
                    select: "title description status priority dueDate"
                }
            ]
        });

    if (!team) {
        res.status(404);
        throw new Error("Team not found");
    }

    // Check if user is member or admin of the team
    const isMember = team.members.some(member => member._id.toString() === req.user._id.toString());
    const isAdmin = team.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
        res.status(403);
        throw new Error("Not authorized to access this team");
    }

    res.json(team);
});

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error("Please provide a team name");
    }

    const team = await Team.create({
        name,
        description,
        admin: req.user._id,
        members: [req.user._id] // Add creator as first member
    });

    const populatedTeam = await Team.findById(team._id)
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image");

    res.status(201).json(populatedTeam);
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private/Admin
const updateTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error("Team not found");
    }

    // Check if user is team admin
    if (team.admin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only team admin can update team details");
    }

    const { name, description } = req.body;
    team.name = name || team.name;
    team.description = description || team.description;

    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id)
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(populatedTeam);
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private/Admin
const deleteTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error("Team not found");
    }

    // Check if user is team admin
    if (team.admin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only team admin can delete the team");
    }

    await team.remove();
    res.json({ message: "Team removed" });
});

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private/Admin
const addMember = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    const { userId } = req.body;

    if (!team) {
        res.status(404);
        throw new Error("Team not found");
    }

    // Check if user is team admin
    if (team.admin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only team admin can add members");
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
        res.status(400);
        throw new Error("User is already a member of this team");
    }

    team.members.push(userId);
    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id)
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(populatedTeam);
});

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private/Admin
const removeMember = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    const { userId } = req.params;

    if (!team) {
        res.status(404);
        throw new Error("Team not found");
    }

    // Check if user is team admin
    if (team.admin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only team admin can remove members");
    }

    // Cannot remove the admin
    if (userId === team.admin.toString()) {
        res.status(400);
        throw new Error("Cannot remove team admin");
    }

    team.members = team.members.filter(member => member.toString() !== userId);
    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id)
        .populate("admin", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(populatedTeam);
});

// @desc    Invite a user to join a team
// @route   POST /api/teams/:id/invite
// @access  Private/Admin
const inviteUser = asyncHandler(async (req, res) => {
    const teamId = req.params.id;
    const { email } = req.body;
    const adminId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    // Check if the requester is the team admin or subadmin
    const isAdmin = team.admin.toString() === adminId.toString();
    const isSubAdmin = team.subAdmins.some(id => id.toString() === adminId.toString());
    
    if (!isAdmin && !isSubAdmin) {
        return res.status(403).json({ message: "Only team admin or subadmin can invite members" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (team.members.includes(user._id)) {
        return res.status(400).json({ message: "User is already a member of this team" });
    }

    // Check if there's already a pending request
    const existingRequest = user.teamJoinRequests.find(request => 
        request.team.toString() === teamId && request.status === "pending"
    );

    if (existingRequest) {
        return res.status(400).json({ message: "User already has a pending invitation to this team" });
    }

    // Add join request to user's teamJoinRequests
    user.teamJoinRequests.push({
        team: teamId,
        requestedBy: adminId,
        status: "pending",
        requestedAt: Date.now()
    });

    await user.save();

    res.json({ message: "Team invitation sent successfully" });
});

// @desc    Add a subadmin to a team
// @route   POST /api/teams/:id/subadmin
// @access  Private/Admin
const addSubAdmin = asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    // Only team admin can add subadmins
    if (team.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only team admin can add subadmins" });
    }

    // Check if user is already a subadmin
    if (team.subAdmins.includes(userId)) {
        return res.status(400).json({ message: "User is already a subadmin" });
    }

    // Check if user is a member
    if (!team.members.includes(userId)) {
        return res.status(400).json({ message: "User must be a member to become a subadmin" });
    }

    // Add user to subadmins
    team.subAdmins.push(userId);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedTeam);
});

// @desc    Remove a subadmin from a team
// @route   DELETE /api/teams/:id/subadmin/:userId
// @access  Private/Admin
const removeSubAdmin = asyncHandler(async (req, res) => {
    const { id: teamId, userId } = req.params;
    const adminId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    // Only team admin can remove subadmins
    if (team.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only team admin can remove subadmins" });
    }

    // Check if user is a subadmin
    if (!team.subAdmins.includes(userId)) {
        return res.status(400).json({ message: "User is not a subadmin" });
    }

    // Remove user from subadmins
    team.subAdmins = team.subAdmins.filter(id => id.toString() !== userId);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedTeam);
});

// @desc    Add a member to a team
// @route   POST /api/teams/:id/members
// @access  Private/Admin
const addTeamMember = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const team = await Team.findById(teamId);
    const user = await User.findById(userId);

    if (!team || !user) {
        return res.status(404).json({ message: "Team or user not found" });
    }

    // Check if the requester is the team admin or subadmin
    const isAdmin = team.admin.toString() === adminId.toString();
    const isSubAdmin = team.subAdmins.some(id => id.toString() === adminId.toString());
    
    if (!isAdmin && !isSubAdmin) {
        return res.status(403).json({ message: "Only team admin or subadmin can add members" });
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
        return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to team members
    team.members.push(userId);

    // Add team to user's teams array
    if (!user.teams) {
        user.teams = [];
    }
    if (!user.teams.includes(teamId)) {
        user.teams.push(teamId);
    }

    await Promise.all([team.save(), user.save()]);

    const updatedTeam = await Team.findById(team._id)
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedTeam);
});

// @desc    Remove a member from a team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private/Admin
const removeTeamMember = asyncHandler(async (req, res) => {
    const { teamId, userId } = req.params;
    const adminId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    // Check if the requester is the team admin
    if (team.admin.toString() !== adminId.toString()) {
        return res.status(403).json({ message: "Only team admin can remove members" });
    }

    // Cannot remove the admin
    if (userId === team.admin.toString()) {
        return res.status(400).json({ message: "Cannot remove team admin" });
    }

    // Check if user is a member
    if (!team.members.includes(userId)) {
        return res.status(400).json({ message: "User is not a member" });
    }

    // Remove user from team members
    team.members = team.members.filter(id => id.toString() !== userId);

    // Remove user from subadmins if they were one
    team.subAdmins = team.subAdmins.filter(id => id.toString() !== userId);

    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("admin", "name email profile_image")
        .populate("subAdmins", "name email profile_image")
        .populate("members", "name email profile_image");

    res.json(updatedTeam);
});

module.exports = {
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    inviteUser,
    addSubAdmin,
    removeSubAdmin,
    addTeamMember,
    removeTeamMember
};
