const mongoose = require("mongoose");

const friendChatSchema = new mongoose.Schema({
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    messages: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            read: { type: Boolean, default: false }
        }
    ],
    lastMessageAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FriendChat", friendChatSchema);
