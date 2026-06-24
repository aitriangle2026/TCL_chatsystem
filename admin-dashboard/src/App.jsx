import { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "./socket";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://triangle-lab-chat-production.up.railway.app/").replace(/\/$/, "");

const normalizeConversation = (conversation) => ({
  ...conversation,
  id: conversation.id ?? conversation._id?.toString?.() ?? conversation._id,
});

const normalizeMessage = (message) => ({
  ...message,
  id: message.id ?? message._id?.toString?.() ?? message._id,
});

const styles = {
  app: {
    display: "flex", height: "100vh", background: "#111318",
    color: "#e2e8f0", fontFamily: "'Inter', sans-serif", overflow: "hidden",
  },
  sidebar: {
    width: "320px", flexShrink: 0, background: "#16181f",
    borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
  },
  brand: {
    padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
  },
  searchWrap: {
    padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0, position: "relative",
  },
  searchInput: {
    width: "100%", padding: "8px 12px 8px 34px", background: "#1d2030",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px",
    color: "#e2e8f0", fontSize: "13px", outline: "none", fontFamily: "'Inter', sans-serif",
  },
  searchIcon: {
    position: "absolute", left: "22px", top: "50%", transform: "translateY(-50%)",
    color: "#4b5563", fontSize: "15px", pointerEvents: "none",
  },
  convoLabel: {
    padding: "12px 14px 6px", fontSize: "10px", color: "#3d4250",
    letterSpacing: "0.08em", fontWeight: "600", flexShrink: 0,
  },
  convoList: { flex: 1, overflowY: "auto", padding: "0 8px 8px" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#111318" },
  chatHeader: {
    padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "#16181f", display: "flex", justifyContent: "space-between",
    alignItems: "center", flexShrink: 0,
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "24px 20px",
    display: "flex", flexDirection: "column", gap: "10px", background: "#111318",
  },
  inputBar: {
    padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "#16181f", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0,
  },
  messageInput: {
    flex: 1, padding: "12px 16px", background: "#1d2030",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px",
    color: "#e2e8f0", fontSize: "13px", outline: "none", fontFamily: "'Inter', sans-serif",
  },
  sendBtn: {
    padding: "11px 22px", background: "#8B5CF6", color: "white", border: "none",
    borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
    display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
  },
  attachBtn: {
    background: "#1d2030", border: "1px solid rgba(255,255,255,0.06)", color: "#4b5563",
    width: "40px", height: "40px", borderRadius: "10px", cursor: "pointer", fontSize: "16px",
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "12px", background: "#111318",
  },
};

// ── Conversation sidebar item ─────────────────────────────
function ConversationItem({ conversation, isActive, onClick, unreadCount }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "11px 10px", marginBottom: "2px", borderRadius: "10px", cursor: "pointer",
        background: isActive ? "#1d2030" : "transparent",
        border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: isActive ? "#8B5CF6" : "#1d2030",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "15px", fontWeight: "600",
          color: isActive ? "#fff" : "#4b5563", flexShrink: 0,
        }}>
          {(conversation.customer_name || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "14px", fontWeight: "500", color: "#e2e8f0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {conversation.customer_name || "Unknown"}
          </div>
          <div style={{
            fontSize: "12px", color: "#3d4250", whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px",
          }}>
            {conversation.last_message || "No messages yet"}
          </div>
        </div>
        {unreadCount > 0 && (
          <div style={{
            minWidth: "20px", height: "20px", borderRadius: "999px",
            background: "#8B5CF6", color: "white", fontSize: "11px",
            fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 6px", flexShrink: 0,
          }}>{unreadCount}</div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "7px" }}>
        {conversation.ai_enabled === 1 ? (
          <span style={{
            fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
            background: "rgba(74,222,128,0.1)", color: "#4ade80",
            border: "1px solid rgba(74,222,128,0.18)", fontWeight: "500",
          }}>AI active</span>
        ) : (
          <span style={{
            fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
            background: "rgba(251,146,60,0.1)", color: "#fb923c",
            border: "1px solid rgba(251,146,60,0.18)", fontWeight: "500",
          }}>Human mode</span>
        )}
        <span style={{ fontSize: "10px", color: "#3d4250" }}>
          {conversation.last_message_time
            ? new Date(conversation.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </span>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────
function EditModal({ msg, onSave, onClose }) {
  const [text, setText] = useState(msg.message || "");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#1d2030", border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "14px", padding: "24px", width: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0", marginBottom: "14px" }}>
          Edit Message
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{
            width: "100%", padding: "10px 12px", background: "#111318",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
            color: "#e2e8f0", fontSize: "13px", resize: "vertical", outline: "none",
            fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
          }}
          autoFocus
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "14px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: "13px",
          }}>Cancel</button>
          <button onClick={() => onSave(text)} style={{
            padding: "8px 18px", borderRadius: "8px", border: "none",
            background: "#8B5CF6", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────
// FIX 1: use === 1 checks for DB tinyint fields (is_deleted, is_edited)
//         to prevent 0 leaking as rendered text in JSX
// FIX 2: flex row-reverse so action buttons sit LEFT of admin bubble
// FIX 3: maxWidth on the flex wrapper so bubble never overflows
function MessageBubble({ msg, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const isAdmin    = msg.sender_id === 999;
  const isCustomer = msg.sender_id === 1;
  const isAI       = msg.sender_id === 0;

  // FIX 1: explicit === 1 so the number 0 never renders as text
  const isDeleted = msg.is_deleted === 1;
  const isEdited  = msg.is_edited  === 1;
  const isImage   = msg.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // Admin can only edit/delete their OWN messages within 3 hours
  const withinTimeLimit = Date.now() - new Date(msg.created_at).getTime() < 3 * 60 * 60 * 1000;
  const canEdit   = !isDeleted && isAdmin && withinTimeLimit;
  const canDelete = !isDeleted && isAdmin && withinTimeLimit;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}
    >
      {/* FIX 2 + 3: single flex row, row-reverse for admin, capped width */}
      <div style={{
        display: "flex",
        flexDirection: isAdmin ? "row-reverse" : "row",
        alignItems: "center",
        gap: "6px",
        maxWidth: "65%",  // FIX 3: prevents bubble from overflowing
      }}>

        {/* Bubble */}
        <div style={{
          background: isAdmin ? "#8B5CF6" : "#1d2030",
          color: isAdmin ? "#fff" : isDeleted ? "#4b5563" : "#c9d1e0",
          padding: "10px 14px",
          borderRadius: isAdmin ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
          border: isAdmin ? "none" : "1px solid rgba(255,255,255,0.06)",
          fontStyle: isDeleted ? "italic" : "normal",
          minWidth: 0,   // allow text to wrap inside flex child
          wordBreak: "break-word",
        }}>
          {/* Sender label */}
          {isAI && (
            <div style={{ fontSize: "10px", color: "#4ade80", marginBottom: "4px", fontWeight: "600", letterSpacing: "0.04em" }}>
              AI ASSISTANT
            </div>
          )}
          {isCustomer && (
            <div style={{ fontSize: "10px", color: "#4b5563", marginBottom: "4px", fontWeight: "600", letterSpacing: "0.04em" }}>
              CUSTOMER
            </div>
          )}

          {/* File */}
          {msg.file_url && isImage && !isDeleted && (
            <img
              src={`${API_BASE_URL}${msg.file_url}`}
              alt="attachment"
              style={{ width: "100%", maxWidth: "280px", borderRadius: "8px", marginBottom: msg.message ? "8px" : "0", display: "block", cursor: "pointer" }}
              onClick={() => window.open(`${API_BASE_URL}${msg.file_url}`, "_blank")}
            />
          )}
          {msg.file_url && !isImage && !isDeleted && (
            <a href={`${API_BASE_URL}${msg.file_url}`} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px",
                color: isAdmin ? "rgba(255,255,255,0.85)" : "#8B5CF6",
                marginBottom: msg.message ? "8px" : "0", textDecoration: "none",
                background: isAdmin ? "rgba(255,255,255,0.1)" : "rgba(139,92,246,0.08)",
                padding: "6px 10px", borderRadius: "6px",
              }}>
              📄 <span style={{ textDecoration: "underline" }}>Open File</span>
            </a>
          )}

          {/* Text */}
          {msg.message && (
            <div style={{ fontSize: "13px", lineHeight: "1.55" }}>{msg.message}</div>
          )}

          {/* FIX 1: isEdited boolean, never renders 0 */}
          {isEdited && !isDeleted && (
            <div style={{ fontSize: "10px", opacity: 0.4, marginTop: "2px" }}>edited</div>
          )}

          <div style={{ fontSize: "10px", opacity: 0.45, marginTop: "5px", textAlign: isAdmin ? "right" : "left" }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* FIX 2: action buttons — appear to the LEFT of admin bubble (row-reverse handles positioning) */}
        {hovered && (canEdit || canDelete) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
            {canEdit && (
              <button
                onClick={() => onEdit(msg)}
                title="Edit message"
                style={{
                  background: "#1d2030", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#8B5CF6", borderRadius: "6px", padding: "5px 9px",
                  cursor: "pointer", fontSize: "12px",
                }}
              >✏️</button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(msg.id)}
                title="Delete message"
                style={{
                  background: "#1d2030", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f87171", borderRadius: "6px", padding: "5px 9px",
                  cursor: "pointer", fontSize: "12px",
                }}
              >🗑️</button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
function App() {
  const [isAuthenticated,     setIsAuthenticated]     = useState(Boolean(localStorage.getItem("adminToken")));
  const [authView,             setAuthView]             = useState("login");
  const [authName,             setAuthName]             = useState("");
  const [authEmail,            setAuthEmail]            = useState("");
  const [authPassword,         setAuthPassword]         = useState("");
  const [authConfirm,          setAuthConfirm]          = useState("");
  const [authError,            setAuthError]            = useState("");
  const [authMessage,          setAuthMessage]          = useState("");
  const [resetEmail,           setResetEmail]           = useState("");
  const [resetToken,           setResetToken]           = useState("");
  const [newPassword,          setNewPassword]          = useState("");
  const [confirmPassword,      setConfirmPassword]      = useState("");
  const [conversations,       setConversations]       = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages,            setMessages]            = useState([]);
  const [newMessage,          setNewMessage]          = useState("");
  const [search,              setSearch]              = useState("");
  const [selectedFile,        setSelectedFile]        = useState(null);
  const [uploading,           setUploading]           = useState(false);
  const [editingMsg,          setEditingMsg]          = useState(null);
  const [unreadCounts,        setUnreadCounts]        = useState({});
  const [typingUser,          setTypingUser]          = useState("");

  const messagesEndRef  = useRef(null);
  const fileInputRef    = useRef(null);
  const selectedConvRef = useRef(null);

  useEffect(() => { selectedConvRef.current = selectedConversation; }, [selectedConversation]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    if (window.location.pathname.includes("/reset-password") && token && email) {
      setResetToken(token);
      setResetEmail(email);
      setAuthView("reset");
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("admin_connected");
      loadConversations();
    }
  }, [isAuthenticated]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (selectedConvRef.current?.id === data?.conversationId) {
        loadMessages(data.conversationId);
      } else if (data?.conversationId) {
        setUnreadCounts(prev => ({ ...prev, [data.conversationId]: (prev[data.conversationId] || 0) + 1 }));
      }
      loadConversations();
    };
    const handleEdited = ({ messageId, newMessage: newText }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, message: newText, is_edited: 1 } : m
      ));
    };
    const handleDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, is_deleted: 1, message: "This message was deleted" } : m
      ));
    };
    const handleConvDeleted = ({ conversationId }) => {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConvRef.current?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    };
    const handleTypingStarted = ({ conversationId, senderType }) => {
      if (selectedConvRef.current?.id === conversationId && senderType === "customer") {
        setTypingUser("Customer is typing...");
      }
    };
    const handleTypingStopped = ({ conversationId }) => {
      if (selectedConvRef.current?.id === conversationId) {
        setTypingUser("");
      }
    };

    socket.on("receive_message",      handleReceiveMessage);
    socket.on("message_edited",       handleEdited);
    socket.on("message_deleted",      handleDeleted);
    socket.on("typing_started",       handleTypingStarted);
    socket.on("typing_stopped",       handleTypingStopped);
    socket.on("admin_conversation_deleted", handleConvDeleted);
    return () => {
      socket.off("receive_message",      handleReceiveMessage);
      socket.off("message_edited",       handleEdited);
      socket.off("message_deleted",      handleDeleted);
      socket.off("typing_started",       handleTypingStarted);
      socket.off("typing_stopped",       handleTypingStopped);
      socket.off("admin_conversation_deleted", handleConvDeleted);
    };
  }, []);

  const handleAuthSuccess = (token, name, email) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminName", name);
    localStorage.setItem("adminEmail", email);
    setIsAuthenticated(true);
    setAuthError("");
    setAuthMessage("");
  };

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please fill in all fields");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: authEmail,
        password: authPassword,
        role: "admin",
      });
      handleAuthSuccess(res.data.token, res.data.name, res.data.email);
    } catch (err) {
      setAuthError(err.response?.data?.error || "Login failed");
    }
  };

  const handleRegister = async () => {
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please fill in all fields");
      return;
    }
    if (authPassword !== authConfirm) {
      setAuthError("Passwords do not match");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: authName,
        email: authEmail,
        password: authPassword,
        role: "admin",
      });
      handleAuthSuccess(res.data.token, res.data.name, res.data.email);
    } catch (err) {
      setAuthError(err.response?.data?.error || "Registration failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setAuthError("Please enter your email");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: resetEmail,
        role: "admin",
      });
      setAuthError("");
      setAuthMessage("If an account exists, a reset link has been sent to your email.");
    } catch (err) {
      setAuthMessage("");
      setAuthError(err.response?.data?.error || "Could not send reset link");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token: resetToken,
        email: resetEmail,
        password: newPassword,
      });
      setAuthError("");
      setAuthMessage("Password updated successfully. You can sign in now.");
      setAuthView("login");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setAuthMessage("");
      setAuthError(err.response?.data?.error || "Could not reset password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    setIsAuthenticated(false);
    setAuthView("login");
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirm("");
    setAuthError("");
    setAuthMessage("");
    setResetEmail("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/conversations`);
      setConversations(res.data.map(normalizeConversation));
    } catch (err) { console.error(err); }
  };

  const loadMessages = async (conversationId) => {
    try {
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
      const res = await axios.get(`${API_BASE_URL}/api/messages/${conversationId}`);
      setMessages(res.data.map(normalizeMessage));
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("conversationId", selectedConversation.id);
      formData.append("senderId", 999);
      formData.append("message", newMessage || "");
      if (selectedFile) formData.append("file", selectedFile);
      await axios.post(`${API_BASE_URL}/api/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.emit("typing_stopped", { conversationId: selectedConversation.id, senderType: "admin" });
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadMessages(selectedConversation.id);
      socket.emit("send_message", { conversationId: selectedConversation.id });
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleEditSave = async (newText) => {
    if (!newText.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/api/messages/${editingMsg.id}/edit`, {
        message: newText, senderId: 999,
      });
      setEditingMsg(null);
      await loadMessages(selectedConversation.id);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.put(`${API_BASE_URL}/api/messages/${msgId}/delete`, { senderId: 999 });
      await loadMessages(selectedConversation.id);
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm(`Delete the entire conversation with ${selectedConversation.customer_name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/conversations/${selectedConversation.id}`);
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
    } catch (err) { console.error(err); }
  };

  const takeOverConversation = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/conversations/takeover/${selectedConversation.id}`);
      await loadConversations();
      setSelectedConversation(prev => ({ ...prev, ai_enabled: 0 }));
    } catch (err) { console.error(err); }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#111318", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: "420px", background: "rgba(10,11,20,0.88)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "18px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
          <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "6px" }}>Admin Access</div>
          <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "20px" }}>Sign in or create an admin account to manage chats.</div>
          {authError && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: "12px" }}>{authError}</div>}
          {authMessage && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "12px" }}>{authMessage}</div>}
          {authView === "login" ? (
            <>
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="email" placeholder="Admin email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "14px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              <button onClick={handleLogin} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Sign in</button>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}>
                <span onClick={() => { setAuthView("forgot"); setAuthError(""); setAuthMessage(""); }} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600", display: "block", marginBottom: "8px" }}>Forgot password?</span>
                <span>Need an account? <span onClick={() => setAuthView("register")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Create one</span></span>
              </div>
            </>
          ) : authView === "register" ? (
            <>
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} placeholder="Admin name" value={authName} onChange={(e) => setAuthName(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="email" placeholder="Admin email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "14px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="password" placeholder="Confirm password" value={authConfirm} onChange={(e) => setAuthConfirm(e.target.value)} />
              <button onClick={handleRegister} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Create admin account</button>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}><span onClick={() => setAuthView("login")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Back to sign in</span></div>
            </>
          ) : authView === "forgot" ? (
            <>
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "14px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="email" placeholder="Admin email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <button onClick={handleForgotPassword} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Send reset link</button>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}><span onClick={() => setAuthView("login")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Back to sign in</span></div>
            </>
          ) : (
            <>
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 12px", marginBottom: "14px", background: "#16181f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#e2e8f0" }} type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button onClick={handleResetPassword} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Update password</button>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}><span onClick={() => setAuthView("login")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Back to sign in</span></div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {editingMsg && (
        <EditModal msg={editingMsg} onSave={handleEditSave} onClose={() => setEditingMsg(null)} />
      )}

      {/* ── SIDEBAR ── */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={{ width: "38px", height: "38px", borderRadius: "9px", overflow: "hidden", flexShrink: 0 }}>
            <img src="/a2.png" alt="TCL" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>Triangle Creative Lab</div>
            <div style={{ fontSize: "10px", color: "#3d4250", marginTop: "1px" }}>Support Dashboard</div>
          </div>
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.convoLabel}>CONVERSATIONS</div>
        <div style={styles.convoList}>
          {filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={selectedConversation?.id === conversation.id}
              onClick={() => { setSelectedConversation(conversation); setTypingUser(""); socket.emit("join_conversation", conversation.id); setUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 })); loadMessages(conversation.id); }}
              unreadCount={unreadCounts[conversation.id] || 0}
            />
          ))}
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={styles.main}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#16181f" }}>
          <button onClick={handleLogout} style={{ background: "rgba(224,43,43,0.08)", color: "#f87171", border: "1px solid rgba(224,43,43,0.2)", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
            Logout
          </button>
        </div>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "50%", background: "#8B5CF6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", fontWeight: "600", color: "white", flexShrink: 0,
                }}>
                  {(selectedConversation.customer_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
                    {selectedConversation.customer_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "1px" }}>
                    {selectedConversation.customer_email}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                  background: selectedConversation.ai_enabled === 1 ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)",
                  color: selectedConversation.ai_enabled === 1 ? "#4ade80" : "#fb923c",
                  border: selectedConversation.ai_enabled === 1 ? "1px solid rgba(74,222,128,0.18)" : "1px solid rgba(251,146,60,0.18)",
                  fontWeight: "500",
                }}>
                  {selectedConversation.ai_enabled === 1 ? "● AI Active" : "● Human Mode"}
                </span>

                {selectedConversation.ai_enabled === 1 && (
                  <button onClick={takeOverConversation} style={{
                    background: "rgba(224,43,43,0.08)", color: "#f87171",
                    border: "1px solid rgba(224,43,43,0.2)", padding: "6px 14px",
                    borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "500",
                  }}>Take Over</button>
                )}

                <button onClick={handleDeleteConversation} style={{
                  background: "rgba(224,43,43,0.08)", color: "#f87171",
                  border: "1px solid rgba(224,43,43,0.2)", padding: "6px 14px",
                  borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "500",
                }}>🗑 Delete Chat</button>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
                <span style={{
                  fontSize: "11px", color: "#3d4250", background: "#111318",
                  padding: "3px 10px", borderRadius: "20px",
                }}>Today</span>
              </div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onEdit={(m) => setEditingMsg(m)}
                  onDelete={handleDeleteMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {selectedFile && (
              <div style={{
                padding: "8px 20px", background: "#16181f",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: "18px" }}>{selectedFile.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <span style={{ fontSize: "12px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
                >✕</button>
              </div>
            )}

            {/* Input bar */}
            {typingUser && (
              <div style={{ padding: "0 20px 8px", color: "#8B5CF6", fontSize: "12px", fontStyle: "italic" }}>
                {typingUser}
              </div>
            )}
            <div style={styles.inputBar}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }}
                onChange={(e) => setSelectedFile(e.target.files[0] || null)} />

              <button
                style={{
                  ...styles.attachBtn,
                  color: selectedFile ? "#8B5CF6" : "#4b5563",
                  border: selectedFile ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
                }}
                onClick={() => fileInputRef.current?.click()}
              >📎</button>

              <input
                style={styles.messageInput}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (e.target.value.trim()) {
                    socket.emit("typing_started", { conversationId: selectedConversation.id, senderType: "admin" });
                  } else {
                    socket.emit("typing_stopped", { conversationId: selectedConversation.id, senderType: "admin" });
                  }
                }}
                onBlur={() => socket.emit("typing_stopped", { conversationId: selectedConversation.id, senderType: "admin" })}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a reply…"
              />

              <button
                style={{ ...styles.sendBtn, background: uploading ? "#4b3d80" : "#8B5CF6", cursor: uploading ? "not-allowed" : "pointer" }}
                onClick={sendMessage}
                disabled={uploading}
              >
                {uploading ? "…" : "➤ Send"}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "16px",
              background: "#1d2030", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <img src="/a2.png" alt="TCL" style={{ width: "40px", height: "40px", objectFit: "contain", opacity: 0.3 }} />
            </div>
            <div style={{ fontSize: "15px", fontWeight: "500", color: "#3d4250" }}>Select a conversation</div>
            <div style={{ fontSize: "12px", color: "#2e3340" }}>Choose from the sidebar to start replying</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;