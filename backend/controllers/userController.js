const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Project = require("../models/Project");
const Team = require("../models/Team");

// @desc Get a user by ID
// @route GET /user/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("friends", "name email profile_image")
    .populate("friendRequestsReceived", "name email profile_image")
    .populate("friendRequestsSent", "name email profile_image")
    .populate("teamJoinRequests", "name")
    .populate("projectJoinRequests", "name")
    .exec();

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// @desc Verify JWT token and return user data
// @route GET /user/verify
const verifyToken = asyncHandler(async (req, res) => {
  // Get token from cookie or Authorization header
  let token = req.cookies.token;
  
  // Check Authorization header if no cookie token
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("friends", "name email profile_image")
      .populate("friendRequestsReceived", "name email profile_image")
      .populate("friendRequestsSent", "name email profile_image")
      .populate("teamJoinRequests", "name")
      .populate("projectJoinRequests", "name")
      .exec();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ user });
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
});

const signinWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  const user = await User.findOne({ email })
    .populate("friends", "name email profile_image")
    .populate("friendRequestsReceived", "name email profile_image")
    .populate("friendRequestsSent", "name email profile_image")
    .populate("teamJoinRequests", "name")
    .populate("projectJoinRequests", "name")
    .exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  const isPasswordCorrect = await user.matchPassword(password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: "Wrong Password. Access Denied" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Send response with token and user data
  res.json({ 
    success: true,
    message: "Login Successful", 
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      friends: user.friends,
      friendRequestsReceived: user.friendRequestsReceived,
      friendRequestsSent: user.friendRequestsSent,
      teamJoinRequests: user.teamJoinRequests,
      projectJoinRequests: user.projectJoinRequests
    },
    token
  });
});

// @desc Create a new user
// @route POST /user
const createUser = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name)
    return res.status(400).json({ message: "All fields are required" });

  const duplicate = await User.findOne({ email }).lean().exec();
  if (duplicate)
    return res.status(409).json({ message: "User already exists" });

  const user = await User.create({ email, password, name });

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({ 
    message: "User created", 
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image
    },
    token
  });
});

// @desc Update user details
// @route PATCH /user/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, profile_image } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = name;
  if (profile_image) user.profile_image = profile_image;

  await user.save();
  res.json({ message: "User updated successfully", user });
});

// @desc Delete a user
// @route DELETE /user/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await user.deleteOne();
  res.json({ message: "User deleted successfully" });
});

// @desc Send a friend request
// @route POST /user/friend-request
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.body;
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver)
    return res.status(404).json({ message: "User not found" });

  // Check if sender has already sent a request to receiver
  const existingSentRequest = sender.friendRequestsSent.find(
    request => request.to.toString() === receiverId.toString() && request.status === "pending"
  );

  if (existingSentRequest)
    return res.status(400).json({ message: "You have already sent a friend request to this user" });

  // Check if receiver has already sent a request to sender
  const existingReceivedRequest = receiver.friendRequestsSent.find(
    request => request.to.toString() === senderId.toString() && request.status === "pending"
  );

  if (existingReceivedRequest)
    return res.status(400).json({ message: "This user has already sent you a friend request" });

  // Add the friend request
  sender.friendRequestsSent.push({
    to: receiverId,
    status: "pending",
    requestedAt: Date.now()
  });

  receiver.friendRequestsReceived.push({
    from: senderId,
    status: "pending",
    requestedAt: Date.now()
  });

  await sender.save();
  await receiver.save();

  // Create notification for the receiver
  const notification = {
    recipient: receiverId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: `${sender.name} sent you a friend request`,
    read: false,
    relatedUser: senderId,
    link: '/friends',
    metadata: {
      senderName: sender.name,
      senderId: senderId
    }
  };

  try {
    // Send notification through socket service
    const { sendNotification } = require('../services/socketService');
    const newNotification = await sendNotification(notification);
    
    if (!newNotification) {
      console.error('Failed to send friend request notification');
    } else {
      console.log('Friend request notification sent successfully:', newNotification);
    }

    // Send HTTP response
    res.json({ 
      message: "Friend request sent",
      notification: newNotification
    });
  } catch (error) {
    console.error('Error sending friend request notification:', error);
    // Still send success response even if notification fails
  res.json({ message: "Friend request sent" });
  }
});

// @desc Accept a friend request
// @route POST /user/accept-friend-request
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { userId, friendId } = req.body;
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend)
    return res.status(404).json({ message: "User not found" });

  if (!user.friendRequestsReceived.includes(friendId))
    return res.status(400).json({ message: "No request from this user" });

  user.friendRequestsReceived = user.friendRequestsReceived.filter(
    (id) => id.toString() !== friendId
  );
  friend.friendRequestsSent = friend.friendRequestsSent.filter(
    (id) => id.toString() !== userId
  );

  user.friends.push(friendId);
  friend.friends.push(userId);

  await user.save();
  await friend.save();

  res.json({ message: "Friend request accepted" });
});

// @desc Reject a friend request
// @route POST /user/reject-friend-request
const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { userId, friendId } = req.body;
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend)
    return res.status(404).json({ message: "User not found" });

  user.friendRequestsReceived = user.friendRequestsReceived.filter(
    (id) => id.toString() !== friendId
  );
  friend.friendRequestsSent = friend.friendRequestsSent.filter(
    (id) => id.toString() !== userId
  );

  await user.save();
  await friend.save();

  res.json({ message: "Friend request rejected" });
});

// @desc Remove a friend
// @route POST /user/remove-friend
const removeFriend = asyncHandler(async (req, res) => {
  const { userId, friendId } = req.body;
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend)
    return res.status(404).json({ message: "User not found" });

  user.friends = user.friends.filter((id) => id.toString() !== friendId);
  friend.friends = friend.friends.filter((id) => id.toString() !== userId);

  await user.save();
  await friend.save();

  res.json({ message: "Friend removed" });
});

// @desc Accept a project join request
// @route POST /user/accept-project-request
const acceptProjectJoinRequest = asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user._id;

    console.log('Accepting project request:', { projectId, userId });

    // Find user and project
    const [user, project] = await Promise.all([
        User.findById(userId),
        Project.findById(projectId)
    ]);

    if (!user) {
        console.log('User not found:', userId);
        return res.status(404).json({ message: "User not found" });
    }

    if (!project) {
        console.log('Project not found:', projectId);
        return res.status(404).json({ message: "Project not found" });
    }

    console.log('Found user and project:', {
        userId: user._id,
        projectId: project._id,
        userRequests: user.projectJoinRequests
    });

    // Find the join request in user's projectJoinRequests
    const userRequest = user.projectJoinRequests.find(
        request => request.project.toString() === projectId && request.status === "pending"
    );

    if (!userRequest) {
        console.log('Join request not found for:', { projectId, userId });
        return res.status(404).json({ message: "Join request not found" });
    }

    console.log('Found join request:', userRequest);

    // Update request status
    userRequest.status = "accepted";

    // Add user to project members if not already a member
    if (!project.members.some(memberId => memberId.toString() === userId.toString())) {
        console.log('Adding user to project members');
        project.members.push(userId);
    }

    // Add project to user's projects if not already there
    if (!user.projects.some(projId => projId.toString() === projectId.toString())) {
        console.log('Adding project to user projects');
        user.projects.push(projectId);
    }

    // Save both user and project
    await Promise.all([
        user.save(),
        project.save()
    ]);

    console.log('Saved changes:', {
        userProjects: user.projects,
        projectMembers: project.members
    });

    // Return updated data
    res.json({ 
        message: "Project join request accepted",
        project: {
            _id: project._id,
            name: project.name,
            members: project.members
        }
    });
});

// @desc Reject a project join request
// @route POST /user/reject-project-request
const rejectProjectJoinRequest = asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Find the join request in user's receivedProjectJoinRequests
    const userRequest = user.projectJoinRequests.find(
        request => request.project.toString() === projectId && request.status === "pending"
    );

    if (!userRequest) {
        return res.status(404).json({ message: "Join request not found" });
    }

    // Get the project
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Find the corresponding request in project's sentjoinRequests
    const projectRequest = project.joinRequests.find(
        request => request.user.toString() === userId && request.status === "pending"
    );

    if (!projectRequest) {
        return res.status(404).json({ message: "Join request not found in project" });
    }

    // Update request status in both places
    userRequest.status = "rejected";
    projectRequest.status = "rejected";

    await user.save();
    await project.save();

    res.json({ message: "Project join request rejected" });
});

// @desc Get a user by email
// @route GET /user/email/:email
const getUserByEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.params.email })
    .select("-password")
    .populate("friends", "name email profile_image")
    .populate("friendRequestsReceived", "name email profile_image")
    .populate("friendRequestsSent", "name email profile_image")
    .populate("teamJoinRequests", "name")
    .populate("projectJoinRequests", "name")
    .exec();

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// @desc Get received project join requests
// @route GET /user/received-project-requests
const getReceivedProjectRequests = asyncHandler(async (req, res) => {
    // Get the user ID from the authenticated user
    const userId = req.user._id;
    
    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId)
        .populate({
            path: "projectJoinRequests",
            populate: [
                {
                    path: "project",
                    select: "name description admin team",
                    populate: [
                        {
                            path: "admin",
                            select: "name email profile_image"
                        },
                        {
                            path: "team",
                            select: "name"
                        }
                    ]
                },
                {
                    path: "requestedBy",
                    select: "name email profile_image"
                }
            ]
        });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Filter only pending requests and format the response
    const pendingRequests = user.projectJoinRequests
        .filter(request => request.status === "pending")
        .map(request => ({
            _id: request._id,
            project: request.project,
            requestedBy: request.requestedBy,
            status: request.status,
            requestedAt: request.requestedAt
        }));

    res.json(pendingRequests);
});

// @desc Get received team join requests
// @route GET /user/received-team-requests
const getReceivedTeamRequests = asyncHandler(async (req, res) => {
    // Get the user ID from the authenticated user
    const userId = req.user._id;
    
    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId)
        .populate({
            path: "teamJoinRequests",
            populate: [
                {
                    path: "team",
                    select: "name description admin",
                    populate: {
                        path: "admin",
                        select: "name email profile_image"
                    }
                },
                {
                    path: "requestedBy",
                    select: "name email profile_image"
                }
            ]
        });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Filter only pending requests and format the response
    const pendingRequests = user.teamJoinRequests
        .filter(request => request.status === "pending")
        .map(request => ({
            _id: request._id,
            team: request.team,
            requestedBy: request.requestedBy,
            status: request.status,
            requestedAt: request.requestedAt
        }));

    res.json(pendingRequests);
});

// @desc Accept a team join request
// @route POST /user/accept-team-request
const acceptTeamJoinRequest = asyncHandler(async (req, res) => {
    const { teamId } = req.body;
    const userId = req.user._id;

    // Find user and team
    const [user, team] = await Promise.all([
        User.findById(userId),
        Team.findById(teamId)
    ]);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    // Find the join request in user's teamJoinRequests
    const userRequest = user.teamJoinRequests.find(
        request => request.team.toString() === teamId && request.status === "pending"
    );

    if (!userRequest) {
        return res.status(404).json({ message: "Join request not found" });
    }

    // Update request status
    userRequest.status = "accepted";

    // Add user to team members if not already a member
    if (!team.members.some(memberId => memberId.toString() === userId.toString())) {
        team.members.push(userId);
    }

    // Add team to user's teams if not already there
    if (!user.teams.some(teamId => teamId.toString() === teamId.toString())) {
        user.teams.push(teamId);
    }

    // Save both user and team
    await Promise.all([
        user.save(),
        team.save()
    ]);

    // Return updated data
    res.json({ 
        message: "Team join request accepted",
        team: {
            _id: team._id,
            name: team.name,
            members: team.members
        }
    });
});

// @desc Reject a team join request
// @route POST /user/reject-team-request
const rejectTeamJoinRequest = asyncHandler(async (req, res) => {
    const { teamId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Find the join request in user's teamJoinRequests
    const userRequest = user.teamJoinRequests.find(
        request => request.team.toString() === teamId && request.status === "pending"
    );

    if (!userRequest) {
        return res.status(404).json({ message: "Join request not found" });
    }

    // Update request status
    userRequest.status = "rejected";

    await user.save();

    res.json({ message: "Team join request rejected" });
});

// @desc Get user's friends
// @route GET /user/friends
const getFriends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const user = await User.findById(userId)
    .populate('friends', 'name email profile_image')
    .exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user.friends);
});

// @desc Get user's friend requests
// @route GET /user/friend-requests
const getFriendRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const user = await User.findById(userId)
    .populate('friendRequestsReceived.from', 'name email profile_image')
    .exec();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Only return pending requests
  const pendingRequests = user.friendRequestsReceived.filter(
    request => request.status === 'pending'
  );

  res.json(pendingRequests);
});

module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  signinWithEmail,
  verifyToken,
  acceptProjectJoinRequest,
  rejectProjectJoinRequest,
  getUserByEmail,
  getReceivedProjectRequests,
  getReceivedTeamRequests,
  acceptTeamJoinRequest,
  rejectTeamJoinRequest,
  getFriends,
  getFriendRequests
};
