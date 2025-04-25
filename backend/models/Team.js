const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    subAdmins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    projects: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Project" 
    }],
    teamChat: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "TeamChat" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add method to check if a user is admin or sub-admin
teamSchema.methods.isAdmin = function(userId) {
    return this.admin.toString() === userId.toString() || 
           this.subAdmins.some(adminId => adminId.toString() === userId.toString());
};

// Add method to check if a user is a member
teamSchema.methods.isMember = function(userId) {
    return this.members.some(memberId => memberId.toString() === userId.toString());
};

module.exports = mongoose.model("Team", teamSchema);
