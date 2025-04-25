const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    readBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }]
});

const teamChatSchema = new mongoose.Schema({
    team: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Team", 
        required: true,
        unique: true
    },
    messages: [messageSchema],
    lastMessageAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Add index for faster queries
teamChatSchema.index({ team: 1 });
teamChatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("TeamChat", teamChatSchema);
