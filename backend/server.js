require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { setIo } = require("./socket");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

const app = express();

// ── Ensure uploads folder exists ─────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Created uploads/ directory");
}

const allowedOrigins = [
  "https://triangleadminchatdashboard.netlify.app",
  "https://trianglechat.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):5\d{3}$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Triangle Chat Backend Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
  maxHttpBufferSize: 500 * 1024 * 1024, // 500MB
});

setIo(io);

let adminCount = 0;

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("admin_connected", () => {
    socket.isAdmin = true;
    adminCount++;
    io.emit("admin_status", { online: adminCount > 0 });
    console.log("Admin connected. Admin count:", adminCount);
  });

  socket.on("join_conversation", (conversationId) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on("leave_conversation", (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  socket.on("send_message", (data) => {
    if (data?.conversationId) {
      socket.to(`conversation:${data.conversationId}`).emit("receive_message", data);
    }
  });

  socket.on("typing_started", (data) => {
    if (data?.conversationId) {
      socket.to(`conversation:${data.conversationId}`).emit("typing_started", data);
    }
  });

  socket.on("typing_stopped", (data) => {
    if (data?.conversationId) {
      socket.to(`conversation:${data.conversationId}`).emit("typing_stopped", data);
    }
  });

  socket.on("disconnect", () => {
    if (socket.isAdmin) {
      adminCount = Math.max(0, adminCount - 1);
    }
    io.emit("admin_status", { online: adminCount > 0 });
    console.log("User Disconnected. Admin count:", adminCount);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas first, then start the server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});