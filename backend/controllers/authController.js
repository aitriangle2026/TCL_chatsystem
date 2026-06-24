const { getDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "tcl_secret_key";

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    const db = getDB();
    const users = db.collection("users");

    const existing = await users.findOne({ email, role: "client" });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      name,
      email,
      password: hashed,
      role: "client",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId, name, email, role: "client" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name, email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email, role: "client" });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: "client" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { register, login };