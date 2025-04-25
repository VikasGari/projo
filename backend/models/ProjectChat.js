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

const projectChatSchema = new mongoose.Schema({
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Project", 
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
projectChatSchema.index({ project: 1 });
projectChatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("ProjectChat", projectChatSchema);
