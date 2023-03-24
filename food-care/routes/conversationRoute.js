const express = require("express");
const { createConversation, getConversation, getConversationsofUsers } = require("../controllers/conversationController");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
router.use(validateToken);

router.route("/").post(createConversation);
router.route("/:id").get(getConversation);
router.route("/chats/:userId").get(getConversationsofUsers)

module.exports = router;

