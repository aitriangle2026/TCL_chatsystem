const { getDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "tcl_secret_key";

const getRole = (role) => (role === "admin" ? "admin" : "client");

const getFrontendBase = (req, role = "client") => {
  const origin = req?.get("origin");
  if (origin && ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "https://triangle-admin-chat.netlify.app", "https://user-chat-site.netlify.app"].includes(origin)) {
    return origin;
  }

  if (role === "admin") {
    return process.env.ADMIN_FRONTEND_URL || "https://triangle-admin-chat.netlify.app";
  }

  return process.env.FRONTEND_URL || "https://user-chat-site.netlify.app";
};

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendResetMail = async (recipient, resetLink) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("Password reset link:", resetLink);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: "Reset your Triangle Lab password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password reset request</h2>
        <p>Use the link below to reset your password. It will expire in 1 hour.</p>
        <p><a href="${resetLink}" target="_blank" rel="noreferrer">Reset password</a></p>
      </div>
    `,
  });
};

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const normalizedRole = getRole(role);

  try {
    const db = getDB();
    const users = db.collection("users");

    const existing = await users.findOne({ email, role: normalizedRole });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      name,
      email,
      password: hashed,
      role: normalizedRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId, name, email, role: normalizedRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name, email, role: normalizedRole });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const normalizedRole = getRole(role);

  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email, role: normalizedRole });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: normalizedRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name, email: user.email, role: normalizedRole });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const normalizedRole = getRole(role);

  try {
    const db = getDB();
    const users = db.collection("users");
    const user = await users.findOne({ email, role: normalizedRole });

    if (!user) return res.status(404).json({ error: "No account found with that email" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    const frontendBase = getFrontendBase(req, normalizedRole);
    const resetLink = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendResetMail(user.email, resetLink);

    res.json({ message: "Password reset link sent to your email.", resetLink });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    return res.status(400).json({ error: "Token, email and password are required" });
  }

  try {
    const db = getDB();
    const users = db.collection("users");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await users.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: "Reset link is invalid or expired" });

    const hashed = await bcrypt.hash(password, 10);
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashed,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };