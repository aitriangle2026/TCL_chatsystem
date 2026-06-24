const express = require("express");
const router = express.Router();
const upload = require("../utils/upload");
const { sendMessage, getMessages, editMessage, deleteMessage } = require("../controllers/messageController");

router.get("/:conversationId", getMessages);
router.post("/", upload.single("file"), sendMessage);
router.put("/:id/edit", editMessage);
router.put("/:id/delete", deleteMessage);

module.exports = router;