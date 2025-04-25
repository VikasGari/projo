const asyncHandler = require("express-async-handler");
const TeamChat = require("../models/TeamChat");
const Team = require("../models/Team");
const User = require("../models/User");

// @desc Get team chat messages
// @route GET /team-chat/:teamId
const getTeamChat = asyncHandler(async (req, res) => {
    try {
        const { teamId } = req.params;

        // First verify if the team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        // Check if user has access to the team
        const isMember = team.members.includes(req.user._id) || 
                        team.admin.toString() === req.user._id.toString() ||
                        team.subAdmins.some(admin => admin.toString() === req.user._id.toString());
        
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this team chat" });
        }

        // Try to find the chat
        const chat = await TeamChat.findOne({ team: teamId })
            .populate("messages.sender", "name email profile_image")
            .populate("messages.readBy", "name email profile_image");

        // If chat doesn't exist, return an empty chat response
        if (!chat) {
            return res.json({
                _id: null,
                team: teamId,
                messages: [],
                lastMessageAt: null
            });
        }

        res.json(chat);
    } catch (error) {
        console.error('Error in getTeamChat:', error);
        res.status(500).json({ 
            message: "Error fetching team chat",
            error: error.message 
        });
    }
});

// @desc Start a team chat
// @route POST /team-chat/start
const startTeamChat = asyncHandler(async (req, res) => {
    const { teamId } = req.body;

    if (!teamId) return res.status(400).json({ message: "Team ID is required" });

    const existingChat = await TeamChat.findOne({ team: teamId });

    if (existingChat) return res.status(400).json({ message: "Chat already exists" });

    const chat = await TeamChat.create({ team: teamId });

    res.status(201).json({ message: "Team chat started", chat });
});

// @desc Send a message in a team chat
// @route POST /team-chat/message
const sendTeamMessage = asyncHandler(async (req, res) => {
    const { teamId, content } = req.body;

    if (!teamId || !content) {
        return res.status(400).json({ message: "Team ID and content are required" });
    }

    try {
        // Find or create chat for the team
        let chat = await TeamChat.findOne({ team: teamId });
        
        if (!chat) {
            chat = await TeamChat.create({ team: teamId });
        }

        // Add the new message
        const newMessage = {
            sender: req.user._id,
            content: content.trim(),
            createdAt: new Date(),
            readBy: [req.user._id] // Sender has read their own message
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        await chat.save();

        // Populate sender info before sending response
        await chat.populate('messages.sender', 'name email profile_image');
        await chat.populate('messages.readBy', 'name email profile_image');

        res.json({ 
            message: "Message sent successfully",
            chat: chat
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            message: "Error sending message",
            error: error.message 
        });
    }
});

// @desc Mark messages as read by a user
// @route PATCH /team-chat/read
const markTeamMessagesAsRead = asyncHandler(async (req, res) => {
    const { teamId } = req.body;

    if (!teamId) {
        return res.status(400).json({ message: "Team ID is required" });
    }

    try {
        const chat = await TeamChat.findOne({ team: teamId });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Mark all unread messages as read by the user
        chat.messages.forEach(msg => {
            if (!msg.readBy.includes(req.user._id)) {
                msg.readBy.push(req.user._id);
            }
        });

        await chat.save();
        res.json({ message: "Messages marked as read", chat });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
            message: "Error marking messages as read",
            error: error.message 
        });
    }
});

// @desc Delete a team chat
// @route DELETE /team-chat/:teamId
const deleteTeamChat = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    try {
        // Check if user is team admin
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        if (team.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only team admin can delete the chat" });
        }

        const chat = await TeamChat.findOne({ team: teamId });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        await chat.deleteOne();
        res.json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ 
            message: "Error deleting chat",
            error: error.message 
        });
    }
});

module.exports = {
    getTeamChat,
    startTeamChat,
    sendTeamMessage,
    markTeamMessagesAsRead,
    deleteTeamChat
};
