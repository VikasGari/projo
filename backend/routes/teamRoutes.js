const express = require("express");
const {
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    addMember,
    removeMember,
    inviteUser,
    addSubAdmin,
    removeSubAdmin,
    addTeamMember,
    removeTeamMember
} = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Team CRUD routes
router.get("/", protect, getTeams);
router.get("/:id", protect, getTeamById);
router.post("/", protect, createTeam);
router.put("/:id", protect, updateTeam);

// Team membership routes
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);

// Team invite routes
router.post("/:id/invite", protect, inviteUser);

// Team subadmin routes
router.post("/:id/subadmin", protect, addSubAdmin);
router.delete("/:id/subadmin/:userId", protect, removeSubAdmin);

// Team member management routes
router.post("/:id/members", protect, addTeamMember);
router.delete("/:id/members/:userId", protect, removeTeamMember);

module.exports = router;
