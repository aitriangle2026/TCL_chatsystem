const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { getIo } = require("../socket");
const { getAIReply } = require("../utils/demoAI");

const EDIT_DELETE_LIMIT_MS = 3 * 60 * 60 * 1000;

const withId = (doc) => ({
  ...doc,
  id: doc.id ?? doc._id?.toString?.() ?? doc._id,
});

const sendMessage = async (req, res) => {
  const { conversationId, senderId, message } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!conversationId || !senderId)
    return res.status(400).json({ error: "conversationId and senderId are required" });

  try {
    const db = getDB();
    const messages = db.collection("messages");
    const conversations = db.collection("conversations");

    await messages.insertOne({
      conversation_id: new ObjectId(conversationId),
      sender_id: parseInt(senderId, 10),
      message: message || "",
      file_url: fileUrl,
      is_edited: 0,
      is_deleted: 0,
      edited_at: null,
      created_at: new Date(),
    });

    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { admin_deleted: 0 } }
    );

    const io = getIo();
    io.emit("receive_message", { conversationId, senderId, message, fileUrl });

    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { last_message: message || "📎 File", last_message_time: new Date() } }
    );

    const senderIdNum = parseInt(senderId, 10);
    if (senderIdNum !== 1) return res.status(201).json({ success: true });

    const convo = await conversations.findOne({ _id: new ObjectId(conversationId) });
    if (!convo?.ai_enabled) return res.status(201).json({ success: true });

    const aiReply = getAIReply(message);
    await messages.insertOne({
      conversation_id: new ObjectId(conversationId),
      sender_id: 0,
      message: aiReply,
      file_url: null,
      is_edited: 0,
      is_deleted: 0,
      edited_at: null,
      created_at: new Date(),
    });

    io.emit("receive_message", { conversationId, senderId: 0, message: aiReply });
    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { last_message: aiReply, last_message_time: new Date() } }
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
};

const getMessages = async (req, res) => {
  try {
    const db = getDB();
    const messages = await db.collection("messages")
      .find({ conversation_id: new ObjectId(req.params.conversationId) })
      .sort({ created_at: 1 })
      .toArray();
    res.status(200).json(messages.map(withId));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const editMessage = async (req, res) => {
  const { id } = req.params;
  const { message, senderId } = req.body;
  const senderIdNum = parseInt(senderId, 10);

  if (!message?.trim()) return res.status(400).json({ error: "Message cannot be empty" });

  try {
    const db = getDB();
    const messagesCol = db.collection("messages");

    const msg = await messagesCol.findOne({ _id: new ObjectId(id) });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.sender_id === 0)
      return res.status(403).json({ error: "AI messages cannot be edited" });
    if (msg.sender_id !== senderIdNum)
      return res.status(403).json({ error: "You can only edit your own messages" });

    const age = Date.now() - new Date(msg.created_at).getTime();
    if (age > EDIT_DELETE_LIMIT_MS)
      return res.status(403).json({ error: "Edit time limit exceeded (3 hours)" });

    if (msg.is_deleted) return res.status(400).json({ error: "Cannot edit a deleted message" });

    await messagesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { message, is_edited: 1, edited_at: new Date() } }
    );

    const io = getIo();
    io.emit("message_edited", {
      messageId: id,
      conversationId: msg.conversation_id,
      newMessage: message,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit message" });
  }
};

const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const { senderId } = req.body;
  const senderIdNum = parseInt(senderId, 10);

  try {
    const db = getDB();
    const messagesCol = db.collection("messages");

    const msg = await messagesCol.findOne({ _id: new ObjectId(id) });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.sender_id === 0)
      return res.status(403).json({ error: "AI messages cannot be deleted" });
    if (msg.sender_id !== senderIdNum)
      return res.status(403).json({ error: "You can only delete your own messages" });

    const age = Date.now() - new Date(msg.created_at).getTime();
    if (age > EDIT_DELETE_LIMIT_MS)
      return res.status(403).json({ error: "Delete time limit exceeded (3 hours)" });

    await messagesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_deleted: 1, message: "This message was deleted" } }
    );

    const io = getIo();
    io.emit("message_deleted", { messageId: id, conversationId: msg.conversation_id });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
};

module.exports = { sendMessage, getMessages, editMessage, deleteMessage };