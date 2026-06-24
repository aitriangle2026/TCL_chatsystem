const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { getIo } = require("../socket");

const withId = (doc) => ({
  ...doc,
  id: doc.id ?? doc._id?.toString?.() ?? doc._id,
});

const createConversation = async (req, res) => {
  const { userId, customerName, customerEmail } = req.body;
  try {
    const db = getDB();
    const conversations = db.collection("conversations");

    const existing = await conversations.findOne({ customer_email: customerEmail });
    if (existing) return res.status(200).json({ conversationId: existing._id });

    const result = await conversations.insertOne({
      user_id: userId ? new ObjectId(userId) : null,
      customer_name: customerName || "",
      customer_email: customerEmail || "",
      ai_enabled: 1,
      is_pinned: 0,
      admin_deleted: 0,
      last_message: null,
      last_message_time: null,
      created_at: new Date(),
    });
    res.status(201).json({ conversationId: result.insertedId });
  } catch (err) {
    res.status(500).json(err);
  }
};

const getConversations = async (req, res) => {
  try {
    const db = getDB();
    const conversations = await db.collection("conversations")
      .find({ admin_deleted: { $ne: 1 } })
      .sort({ last_message_time: -1, created_at: -1 })
      .toArray();
    res.status(200).json(conversations.map(withId));
  } catch (err) {
    res.status(500).json(err);
  }
};

const takeOverConversation = async (req, res) => {
  try {
    const db = getDB();
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      { $set: { ai_enabled: 0 } }
    );
    res.status(200).json({ success: true, message: "AI Disabled" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const pinConversation = async (req, res) => {
  try {
    const db = getDB();
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      { $set: { is_pinned: req.body.pin ? 1 : 0 } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const db = getDB();

    await db.collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { admin_deleted: 1 } }
    );

    const io = getIo();
    io.emit("admin_conversation_deleted", { conversationId });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  createConversation,
  getConversations,
  takeOverConversation,
  pinConversation,
  deleteConversation,
};