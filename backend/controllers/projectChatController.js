const asyncHandler = require("express-async-handler");
const ProjectChat = require("../models/ProjectChat");
const Project = require("../models/Project");
const User = require("../models/User");

// @desc Get project chat messages
// @route GET /project-chat/:projectId
const getProjectChat = asyncHandler(async (req, res) => {
    try {
        const { projectId } = req.params;

        // First verify if the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Check if user has access to the project
        const isMember = project.members.includes(req.user._id) || 
                        project.owner.toString() === req.user._id.toString();
        
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this project chat" });
        }

        // Try to find the chat
        const chat = await ProjectChat.findOne({ project: projectId })
            .populate("messages.sender", "name email");

        // If chat doesn't exist, return an empty chat response
        if (!chat) {
            return res.json({
                _id: null,
                project: projectId,
                messages: [],
                lastMessageAt: null
            });
        }

        res.json(chat);
    } catch (error) {
        console.error('Error in getProjectChat:', error);
        res.status(500).json({ 
            message: "Error fetching project chat",
            error: error.message 
        });
    }
});

// @desc Start a project chat
// @route POST /project-chat/start
const startProjectChat = asyncHandler(async (req, res) => {
    const { projectId } = req.body;

    if (!projectId) return res.status(400).json({ message: "Project ID is required" });

    const existingChat = await ProjectChat.findOne({ project: projectId });

    if (existingChat) return res.status(400).json({ message: "Chat already exists" });

    const chat = await ProjectChat.create({ project: projectId });

    res.status(201).json({ message: "Project chat started", chat });
});

// @desc Send a message in a project chat
// @route POST /project-chat/message
const sendProjectMessage = asyncHandler(async (req, res) => {
    const { projectId, content } = req.body;

    if (!projectId || !content) {
        return res.status(400).json({ message: "Project ID and content are required" });
    }

    try {
        // Find or create chat for the project
        let chat = await ProjectChat.findOne({ project: projectId });
        
        if (!chat) {
            chat = await ProjectChat.create({ project: projectId });
        }

        // Add the new message
        const newMessage = {
            sender: req.user._id,
            content: content.trim(),
            createdAt: new Date()
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        await chat.save();

        // Populate sender info before sending response
        await chat.populate('messages.sender', 'name email');

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
// @route PATCH /project-chat/read
const markProjectMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const chat = await ProjectChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages.forEach((msg) => {
        if (!msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
        }
    });

    await chat.save();
    res.json({ message: "Messages marked as read", chat });
});

// @desc Delete a project chat
// @route DELETE /project-chat/:id
const deleteProjectChat = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const chat = await ProjectChat.findById(id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await chat.deleteOne();
    res.json({ message: "Chat deleted" });
});

module.exports = {
    getProjectChat,
    startProjectChat,
    sendProjectMessage,
    markProjectMessagesAsRead,
    deleteProjectChat,
};
