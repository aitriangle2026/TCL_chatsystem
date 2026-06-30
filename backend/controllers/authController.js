const { getDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "tcl_secret_key";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();
const getRole = (role) => (role === "admin" ? "admin" : "client");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByEmail = async (users, email, role) => {
  const normalizedEmail = normalizeEmail(email);
  const roleFilter = role ? { role } : { role: { $in: ["client", "admin", null, undefined] } };
  let user = await users.findOne({ email: normalizedEmail, ...roleFilter });

  if (!user) {
    user = await users.findOne({
      email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: "i" },
    });
  }

  if (user && user.email !== normalizedEmail) {
    await users.updateOne(
      { _id: user._id },
      { $set: { email: normalizedEmail, updatedAt: new Date() } }
    );
  }

  return user;
};

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

async function sendVerificationEmail(email, verifyLink) {
  await sendEmail({
    to: email,
    subject: "Verify your Triangle Lab account",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Welcome to Triangle Lab</h2>

        <p>Please verify your email address.</p>

        <a
  href="${verifyLink}"
  style="
    display:inline-block;
    padding:12px 22px;
    background:#2563eb;
    color:#ffffff;
    text-decoration:none;
    border-radius:8px;
    font-weight:bold;
  "
>
  Verify Email
</a>

        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
}

async function sendResetPasswordEmail(email, resetLink) {
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Password Reset</h2>

        <p>Click below to reset your password.</p>

        <a
  href="${resetLink}"
  style="
    display:inline-block;
    padding:12px 22px;
    background:#2563eb;
    color:#ffffff;
    text-decoration:none;
    border-radius:8px;
    font-weight:bold;
  "
>
  Reset Password
</a>

        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });
}

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const normalizedRole = getRole(role);
  const normalizedEmail = normalizeEmail(email);

  try {
    const db = getDB();
    const users = db.collection("users");

    const existing = await users.findOne({ email: normalizedEmail, role: normalizedRole });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const rawVerificationToken =
  crypto.randomBytes(32).toString("hex");

const verificationToken =
  crypto
    .createHash("sha256")
    .update(rawVerificationToken)
    .digest("hex");

const verificationExpires =
  new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await users.insertOne({
  name,
  email: normalizedEmail,
  password: hashed,
  role: normalizedRole,

  isVerified: false,

  verificationToken,

  verificationExpires,

  createdAt: new Date(),
  updatedAt: new Date(),
});

const verifyLink =
`${process.env.API_URL}/api/auth/verify-email/${rawVerificationToken}`;
console.log("Sending verification email to:", normalizedEmail);
console.log("Verify Link:", verifyLink);

await sendVerificationEmail(
  normalizedEmail,
  verifyLink
);

console.log("Verification email sent successfully.");

    res.json({
  message: "Registration successful. Please verify your email.",
});
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
  const normalizedEmail = normalizeEmail(email);

  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await findUserByEmail(users, normalizedEmail, normalizedRole);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    if (user.role !== "admin" && !user.isVerified) {
  return res.status(403).json({
    error: "Please verify your email before logging in.",
  });
}

    const token = jwt.sign(
      { id: user._id, name: user.name, email: normalizeEmail(user.email), role: user.role || normalizedRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name, email: normalizeEmail(user.email), role: user.role || normalizedRole });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const normalizedRole = getRole(role);
  const normalizedEmail = normalizeEmail(email);

  try {
    const db = getDB();
    const users = db.collection("users");
    const user = await findUserByEmail(users, normalizedEmail, normalizedRole);

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

const resetLink =
  `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

await sendResetPasswordEmail(user.email, resetLink);

return res.json({
  message: "Password reset link sent to your email.",
});
  } catch (err) {
    console.error("Forgot password error:");
console.error(err);
console.error(err.stack);
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
    const normalizedEmail = normalizeEmail(email);

    const user = await users.findOne({
      email: normalizedEmail,
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

const verifyEmail = async (req, res) => {
  const { token } = req.params;

const hashedToken =
  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Verification link is invalid or expired.",
      });
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date(),
        },
        $unset: {
          verificationToken: "",
          verificationExpires: "",
        },
      }
    );

    return res.redirect(
  `${process.env.FRONTEND_URL}/?verified=true`
);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
};