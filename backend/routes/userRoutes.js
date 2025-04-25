const express = require("express");
const {
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
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// User CRUD routes
router.post("/login", signinWithEmail);
router.get("/verify", verifyToken);
router.get("/email/:email", getUserByEmail);

// Project join request routes
router.get("/received-project-requests", protect, getReceivedProjectRequests);
router.post("/accept-project-request", protect, acceptProjectJoinRequest);
router.post("/reject-project-request", protect, rejectProjectJoinRequest);

// Team join request routes
router.get("/received-team-requests", protect, getReceivedTeamRequests);
router.post("/accept-team-request", protect, acceptTeamJoinRequest);
router.post("/reject-team-request", protect, rejectTeamJoinRequest);

// Friend request routes
router.get("/friends", protect, getFriends);
router.get("/friend-requests", protect, getFriendRequests);
router.post("/friend-request", protect, sendFriendRequest);
router.post("/accept-friend-request", protect, acceptFriendRequest);
router.post("/reject-friend-request", protect, rejectFriendRequest);
router.post("/remove-friend", protect, removeFriend);

// Parameter routes (should be last)
router.get("/:id", getUserById);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
