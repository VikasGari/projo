const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    status: { 
        type: String, 
        enum: ["future", "ongoing", "completed"], 
        default: "future",
        required: true 
    },
    startTime: { 
        type: Date,
        required: function() {
            return this.status === 'future';
        }
    },
    deadline: { 
        type: Date,
        required: function() {
            return this.status === 'ongoing';
        }
    },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    projectChat: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectChat" },
    createdAt: { type: Date, default: Date.now },
});

// Pre-save middleware to enforce status transition rules
projectSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        // Can only mark as completed if previously ongoing
        if (this.status === 'completed' && this.isModified('status')) {
            if (this._previousStatus !== 'ongoing') {
                next(new Error('Project can only be marked as completed from ongoing status'));
                return;
            }
        }
        
        // Store current status for future reference
        this._previousStatus = this.status;
    }
    next();
});

module.exports = mongoose.model("Project", projectSchema);
