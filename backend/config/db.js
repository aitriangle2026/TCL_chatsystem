const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { MongoClient } = require("mongodb");

let db;
let client;

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("triangle_chat");
    console.log("MongoDB Atlas Connected Successfully");

    // Create indexes for better query performance
    await db.collection("users").createIndex({ email: 1 });
    await db.collection("conversations").createIndex({ customer_email: 1 });
    await db.collection("messages").createIndex({ conversation_id: 1 });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
};

module.exports = { connectDB, getDB };