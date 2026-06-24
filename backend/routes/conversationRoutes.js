const express = require("express");
const router = express.Router();

const {
  createConversation,
  getConversations,
  takeOverConversation,
  pinConversation,
  deleteConversation,
} = require("../controllers/conversationController");

router.post("/", createConversation);
router.get("/", getConversations);
router.put("/takeover/:conversationId", takeOverConversation);
router.put("/pin/:conversationId", pinConversation);
router.delete("/:conversationId", deleteConversation);

module.exports = router;