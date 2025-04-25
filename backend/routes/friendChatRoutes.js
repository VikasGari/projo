const express = require("express");
const {
    getChat,
    startChat,
    sendMessage,
    markMessagesAsRead,
    deleteChat
} = require("../controllers/friendChatController");

const router = express.Router();

router.get("/:user1/:user2", getChat);
router.post("/start", startChat);
router.post("/message", sendMessage);
router.patch("/read", markMessagesAsRead);
router.delete("/:id", deleteChat);

module.exports = router;
