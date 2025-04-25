const asyncHandler = require("express-async-handler");
const FriendChat = require("../models/FriendChat");
const User = require("../models/User");

// @desc Get a chat between two users
// @route GET /friend-chat/:user1/:user2
const getChat = asyncHandler(async (req, res) => {
    const { user1, user2 } = req.params;

    const chat = await FriendChat.findOne({
        participants: { $all: [user1, user2] }
    }).populate("messages.sender", "name email");

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat);
});

// @desc Start a new chat
// @route POST /friend-chat/start
const startChat = asyncHandler(async (req, res) => {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) return res.status(400).json({ message: "Both users are required" });

    const existingChat = await FriendChat.findOne({ participants: { $all: [user1, user2] } });

    if (existingChat) return res.status(400).json({ message: "Chat already exists" });

    const chat = await FriendChat.create({ participants: [user1, user2] });

    res.status(201).json({ message: "Chat started", chat });
});

// @desc Send a message in a friend chat
// @route POST /friend-chat/message
const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, senderId, content } = req.body;

    if (!chatId || !senderId || !content) return res.status(400).json({ message: "Missing required fields" });

    const chat = await FriendChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages.push({ sender: senderId, content });
    chat.lastMessageAt = Date.now();
    await chat.save();

    res.json({ message: "Message sent", chat });
});

// @desc Mark messages as read
// @route PATCH /friend-chat/read
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const chat = await FriendChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages.forEach((msg) => {
        if (msg.sender.toString() !== userId) {
            msg.read = true;
        }
    });

    await chat.save();
    res.json({ message: "Messages marked as read", chat });
});

// @desc Delete a chat
// @route DELETE /friend-chat/:id
const deleteChat = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const chat = await FriendChat.findById(id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await chat.deleteOne();
    res.json({ message: "Chat deleted" });
});

module.exports = {
    getChat,
    startChat,
    sendMessage,
    markMessagesAsRead,
    deleteChat,
};
