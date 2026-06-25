import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://triangle-lab-chat-production.up.railway.app/").replace(/\/$/, "");
import socket from "./socket";
import Login    from "./components/Login";
import Register from "./components/Register";

// ─────────────────────────────────────────────────────────
// 1. BACKDROP
// ─────────────────────────────────────────────────────────
const Backdrop = () => {
  const shapeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx;
      const ny = (e.clientY - cy) / cy;
      if (shapeRef.current) {
        shapeRef.current.style.transform = `translate(${nx * 14}px, ${ny * 10}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        .tcl-bd {
          position: fixed; inset: 0; z-index: 9990;
          background: #06070d;
          overflow: hidden;
        }
        .tcl-bd::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(139,92,246,0.18) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: gridDrift 28s linear infinite;
          z-index: 1;
        }
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 30px 30px; }
        }
        .tcl-beanbag {
          position: absolute;
          bottom: -20px; right: -40px;
          width: 480px;
          pointer-events: none; z-index: 2;
          filter: saturate(0.85) brightness(0.65)
            drop-shadow(0 0 60px rgba(99,102,241,0.55))
            drop-shadow(0 0 120px rgba(139,92,246,0.35));
          animation: beanbagFloat 7s ease-in-out infinite;
          user-select: none;
        }
        @keyframes beanbagFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-18px); }
        }
        .tcl-glass {
          position: absolute; inset: 0; z-index: 3;
          pointer-events: none;
          background:
            repeating-linear-gradient(105deg, transparent 0px, transparent 18px,
              rgba(255,255,255,0.015) 18px, rgba(255,255,255,0.015) 19px),
            repeating-linear-gradient(195deg, transparent 0px, transparent 22px,
              rgba(255,255,255,0.01) 22px, rgba(255,255,255,0.01) 23px);
        }
        .tcl-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); animation: glowPulse ease-in-out infinite; z-index: 4; }
        .tcl-glow-1 { width: 620px; height: 620px; top: -220px; left: -200px; background: radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%); animation-duration: 9s; }
        .tcl-glow-2 { width: 480px; height: 480px; bottom: -160px; right: 180px; background: radial-gradient(circle, rgba(99,102,241,0.38) 0%, transparent 70%); animation-duration: 12s; animation-delay: -5s; }
        .tcl-glow-3 { width: 340px; height: 340px; top: 30%; left: 45%; background: radial-gradient(circle, rgba(167,139,250,0.28) 0%, transparent 70%); animation-duration: 15s; animation-delay: -8s; }
        .tcl-glow-4 { width: 260px; height: 260px; top: 55%; left: 18%; background: radial-gradient(circle, rgba(109,70,232,0.3) 0%, transparent 70%); animation-duration: 11s; animation-delay: -3s; }
        @keyframes glowPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .75; transform: scale(1.15); } }
        .tcl-shapes { position: absolute; inset: 0; z-index: 5; pointer-events: none; transition: transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94); will-change: transform; }
        .tcl-shape { position: absolute; animation: shapeFloat ease-in-out infinite; }
        @keyframes shapeFloat { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(6deg); } }
        .tcl-particle { position: absolute; border-radius: 50%; background: rgba(139,92,246,0.7); pointer-events: none; animation: pDrift linear infinite; z-index: 6; }
        @keyframes pDrift { from { transform: translateY(100vh) translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 0.6; } to { transform: translateY(-60px) translateX(var(--drift)); opacity: 0; } }
        .tcl-vignette { position: absolute; inset: 0; z-index: 7; pointer-events: none; background: radial-gradient(ellipse 80% 80% at 35% 50%, transparent 30%, rgba(0,0,0,0.75) 100%); }
        .tcl-scanlines { position: absolute; inset: 0; z-index: 8; pointer-events: none; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px); }
      `}</style>

      <div className="tcl-bd">
        <div className="tcl-glow tcl-glow-1" />
        <div className="tcl-glow tcl-glow-2" />
        <div className="tcl-glow tcl-glow-3" />
        <div className="tcl-glow tcl-glow-4" />
        <img src="/beanbag.png" alt="" className="tcl-beanbag" draggable={false} />
        <div className="tcl-glass" />
        <div ref={shapeRef} className="tcl-shapes">
          <svg className="tcl-shape" style={{ top:"8%", left:"5%", width:80, height:80, opacity:0.28, animationDuration:"16s", animationDelay:"0s" }} viewBox="0 0 80 80"><polygon points="40,4 76,74 4,74" fill="none" stroke="#8B5CF6" strokeWidth="1.5"/></svg>
          <svg className="tcl-shape" style={{ top:"55%", left:"7%", width:44, height:44, opacity:0.2, animationDuration:"21s", animationDelay:"-6s" }} viewBox="0 0 44 44"><polygon points="22,2 42,40 2,40" fill="rgba(139,92,246,0.22)" stroke="#8B5CF6" strokeWidth="1"/></svg>
          <svg className="tcl-shape" style={{ top:"12%", left:"38%", width:52, height:52, opacity:0.18, animationDuration:"19s", animationDelay:"-9s" }} viewBox="0 0 52 52"><rect x="4" y="4" width="44" height="44" rx="4" fill="none" stroke="#6366f1" strokeWidth="1.2"/></svg>
          <svg className="tcl-shape" style={{ bottom:"20%", left:"30%", width:38, height:38, opacity:0.16, animationDuration:"17s", animationDelay:"-4s" }} viewBox="0 0 38 38"><circle cx="19" cy="19" r="16" fill="none" stroke="#8B5CF6" strokeWidth="1"/></svg>
          <svg className="tcl-shape" style={{ bottom:"10%", left:"15%", width:34, height:34, opacity:0.2, animationDuration:"23s", animationDelay:"-11s" }} viewBox="0 0 34 34"><polygon points="17,2 32,30 2,30" fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth="1"/></svg>
          <svg className="tcl-shape" style={{ top:"42%", left:"22%", width:26, height:26, opacity:0.15, animationDuration:"14s", animationDelay:"-7s" }} viewBox="0 0 26 26"><rect x="3" y="3" width="20" height="20" rx="2" fill="none" stroke="#8B5CF6" strokeWidth="1"/></svg>
          <svg className="tcl-shape" style={{ bottom:"30%", right:"42%", width:60, height:60, opacity:0.22, animationDuration:"18s", animationDelay:"-3s" }} viewBox="0 0 60 60"><polygon points="30,3 57,55 3,55" fill="rgba(139,92,246,0.14)" stroke="#8B5CF6" strokeWidth="1.2"/></svg>
        </div>
        {[
          { left:"6%",  size:2.5, dur:"13s", delay:"0s",   drift:"18px"  },
          { left:"19%", size:3,   dur:"17s", delay:"-5s",  drift:"-14px" },
          { left:"34%", size:2,   dur:"15s", delay:"-9s",  drift:"10px"  },
          { left:"50%", size:2.5, dur:"19s", delay:"-3s",  drift:"-9px"  },
          { left:"31%", size:3,   dur:"14s", delay:"-7s",  drift:"16px"  },
          { left:"12%", size:2,   dur:"21s", delay:"-15s", drift:"7px"   },
          { left:"44%", size:2,   dur:"12s", delay:"-2s",  drift:"-18px" },
          { left:"25%", size:2.5, dur:"18s", delay:"-12s", drift:"12px"  },
        ].map((p, i) => (
          <div key={i} className="tcl-particle" style={{
            left: p.left, bottom: 0, width: p.size, height: p.size,
            animationDuration: p.dur, animationDelay: p.delay, "--drift": p.drift,
          }}/>
        ))}
        <div className="tcl-vignette" />
        <div className="tcl-scanlines" />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────
// 2. CARD WRAP
// ─────────────────────────────────────────────────────────
const CardWrap = ({ children, height }) => (
  <>
    <Backdrop />
    <div style={{
      position: "fixed", inset: 0, zIndex: 9995,
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        width: "385px",
        height: height || "auto",
        background: "rgba(10,11,20,0.72)",
        backdropFilter: "blur(32px) saturate(1.4)",
        WebkitBackdropFilter: "blur(32px) saturate(1.4)",
        border: "1px solid rgba(139,92,246,0.22)",
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: `0 0 0 1px rgba(139,92,246,0.08), 0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(139,92,246,0.08)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        pointerEvents: "all",
      }}>
        {children}
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────
// 3. HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ chatStarted, isOnline, onClose }) => (
  <div style={{
    padding: "15px 18px",
    borderBottom: "1px solid rgba(139,92,246,0.12)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexShrink: 0,
    background: "rgba(6,7,13,0.55)",
    backdropFilter: "blur(8px)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}>
        <img src="/a2.png" alt="TCL" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", letterSpacing: "0.01em" }}>
          Triangle Creative Lab
        </div>
        {chatStarted ? (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: isOnline ? "#4ade80" : "#4b5563",
              boxShadow: isOnline ? "0 0 6px rgba(74,222,128,0.8)" : "none",
            }}/>
            <span style={{ fontSize: "11px", color: isOnline ? "#4ade80" : "#4b5563" }}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: "10px", color: "#3d4250", marginTop: "2px", letterSpacing: "0.03em" }}>
            Your vision. Our future.
          </div>
        )}
      </div>
    </div>
    <button
      onClick={onClose}
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        color: "#6b7280", width: "30px", height: "30px",
        borderRadius: "8px", cursor: "pointer", fontSize: "14px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
      onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >✕</button>
  </div>
);

// ─────────────────────────────────────────────────────────
// 4. EDIT MODAL (for customer)
// ─────────────────────────────────────────────────────────
const ClientEditModal = ({ msg, onSave, onClose }) => {
  const [text, setText] = useState(msg.message || "");
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "22px",
    }}>
      <div style={{
        background: "rgba(20,22,36,0.98)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "14px", padding: "20px",
        width: "310px",
        boxShadow: "0 16px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginBottom: "12px" }}>
          Edit Message
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "9px 11px",
            background: "#0a0b14",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "8px", color: "#e2e8f0", fontSize: "13px",
            resize: "none", outline: "none",
            fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
          }}
          autoFocus
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "#4b5563",
            cursor: "pointer", fontSize: "12px",
          }}>Cancel</button>
          <button onClick={() => onSave(text)} style={{
            padding: "7px 14px", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg,#8B5CF6,#6366f1)",
            color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "600",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 5. ERROR BOUNDARY
// ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{
        color: "#f87171", padding: 24, background: "#0a0b14",
        position: "fixed", inset: 0, zIndex: 99999,
        fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", overflowY: "auto",
      }}>
        <strong>Widget crashed:</strong>{"\n\n"}{this.state.error.message}{"\n\n"}{this.state.error.stack}
      </div>
    );
    return this.props.children;
  }
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "rgba(8,9,16,0.7)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: "9px",
  color: "#e2e8f0",
  fontSize: "13px",
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
};

// ─────────────────────────────────────────────────────────
// 6. APP
// ─────────────────────────────────────────────────────────
function App() {
  const [messages,           setMessages]           = useState([]);
  const [newMessage,         setNewMessage]         = useState("");
  const [conversationId,     setConversationId]     = useState(null);
  const [isOpen,             setIsOpen]             = useState(true);
  const [customerName,       setCustomerName]       = useState("");
  const [customerEmail,      setCustomerEmail]      = useState("");
  const [chatStarted,        setChatStarted]        = useState(false);
  const [selectedFile,       setSelectedFile]       = useState(null);
  const [isOnline,           setIsOnline]           = useState(false);
  const [uploading,          setUploading]          = useState(false);
  const [authView,           setAuthView]           = useState("login");
  const [resetMessage,       setResetMessage]       = useState("");
  const [resetError,         setResetError]         = useState("");
  const [resetEmail,         setResetEmail]         = useState("");
  const [resetToken,         setResetToken]         = useState("");
  const [newPassword,        setNewPassword]        = useState("");
  const [confirmPassword,    setConfirmPassword]    = useState("");
  const [isLoggedIn,         setIsLoggedIn]         = useState(false);
  const [editingMsg,         setEditingMsg]         = useState(null);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [typingUser,         setTypingUser]         = useState("");
  // "deleted" state: show a notice when admin deletes this conversation
  const [conversationEnded,  setConversationEnded]  = useState(false);

  const messagesEndRef    = useRef(null);
  const fileInputRef      = useRef(null);
  const conversationIdRef = useRef(null);

  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  const loadMessages = useCallback(async (convId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/${convId}`);
      setMessages(res.data);
    } catch (err) { console.error("Load messages error:", err); }
  }, []);

  const restoreConversation = useCallback(async (name, email) => {
    const storedConvId = localStorage.getItem("conversationId");
    if (storedConvId) {
      setConversationId(storedConvId);
      setChatStarted(true);
      setConversationEnded(false);
      socket.emit("join_conversation", storedConvId);
      await loadMessages(storedConvId);
      return storedConvId;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/conversations`, {
        customerName: name,
        customerEmail: email,
      });
      const newConvId = res.data.conversationId;
      localStorage.setItem("conversationId", newConvId);
      setConversationId(newConvId);
      setChatStarted(true);
      setConversationEnded(false);
      await loadMessages(newConvId);
      return newConvId;
    } catch (err) {
      console.error("Restore conversation error:", err);
      return null;
    }
  }, [loadMessages]);

  useEffect(() => {
    socket.emit("get_admin_status");

    const onAdminStatus    = (data) => setIsOnline(data.online);
    const onReceiveMsg     = (data) => {
      const cid = conversationIdRef.current;
      if (cid && String(cid) === String(data?.conversationId)) {
        loadMessages(cid);
      } else if (data?.conversationId) {
        setUnreadCount(prev => prev + 1);
      }
    };
    const onConnect        = () => socket.emit("get_admin_status");

    const onMessageEdited  = ({ messageId, newMessage: newText }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, message: newText, is_edited: 1 } : m
      ));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, message: "This message was deleted", is_deleted: 1 } : m
      ));
    };

    // Admin-side deletion is now hidden from customers; the customer conversation stays intact.
    const onConvDeleted = () => {
      setConversationEnded(false);
    };
    const onTypingStarted = ({ conversationId, senderType }) => {
      if (String(conversationIdRef.current) === String(conversationId) && senderType === "admin") {
        setTypingUser("Support is typing...");
      }
    };
    const onTypingStopped = ({ conversationId }) => {
      if (String(conversationIdRef.current) === String(conversationId)) {
        setTypingUser("");
      }
    };

    socket.on("connect",                 onConnect);
    socket.on("admin_status",            onAdminStatus);
    socket.on("receive_message",         onReceiveMsg);
    socket.on("message_edited",          onMessageEdited);
    socket.on("message_deleted",         onMessageDeleted);
    socket.on("typing_started",          onTypingStarted);
    socket.on("typing_stopped",          onTypingStopped);
    socket.on("admin_conversation_deleted", onConvDeleted);

    return () => {
      socket.off("connect",                 onConnect);
      socket.off("admin_status",            onAdminStatus);
      socket.off("receive_message",         onReceiveMsg);
      socket.off("message_edited",          onMessageEdited);
      socket.off("message_deleted",         onMessageDeleted);
      socket.off("typing_started",          onTypingStarted);
      socket.off("typing_stopped",          onTypingStopped);
      socket.off("admin_conversation_deleted", onConvDeleted);
    };
  }, [loadMessages]);

  // Restore session on mount
  useEffect(() => {
    const token  = localStorage.getItem("clientToken");
    const name   = localStorage.getItem("customerName");
    const email  = localStorage.getItem("customerEmail");
    if (token && name && email) {
      setIsLoggedIn(true);
      setCustomerName(name);
      setCustomerEmail(email);
      restoreConversation(name, email);
    }
  }, [restoreConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const createConversation = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/conversations`, {
        customerName,
        customerEmail,
      });
      const newConvId = res.data.conversationId;
      localStorage.setItem("conversationId", newConvId);
      setConversationId(newConvId);
      setChatStarted(true);
      setConversationEnded(false);
      socket.emit("join_conversation", newConvId);
      await loadMessages(newConvId);
    } catch (err) { console.error("Create conversation error:", err); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    const convId = conversationIdRef.current;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("conversationId", convId);
      formData.append("senderId",       1);
      formData.append("message",        newMessage || "");
      if (selectedFile) formData.append("file", selectedFile);
      await axios.post(`${API_BASE_URL}/api/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.emit("typing_stopped", { conversationId: convId, senderType: "customer" });
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadMessages(convId);
      socket.emit("send_message", { conversationId: convId });
    } catch (err) { console.error("Send error:", err.response?.data || err); }
    finally { setUploading(false); }
  };

  // Customer edits ONLY their own message (sender_id === 1) within 3 hours
  const handleEditSave = async (newText) => {
    if (!newText.trim() || !editingMsg) return;
    try {
      await axios.put(`${API_BASE_URL}/api/messages/${editingMsg.id}/edit`, {
        message: newText,
        senderId: 1,
      });
      setEditingMsg(null);
      await loadMessages(conversationIdRef.current);
    } catch (err) { console.error(err); }
  };

  // Customer deletes ONLY their own message (sender_id === 1) within 3 hours
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.put(`${API_BASE_URL}/api/messages/${msgId}/delete`, { senderId: 1 });
      await loadMessages(conversationIdRef.current);
    } catch (err) { console.error(err); }
  };

  const handleAuthSuccess = useCallback((name, email) => {
    setCustomerName(name);
    setCustomerEmail(email);
    setIsLoggedIn(true);
    restoreConversation(name, email);
  }, [restoreConversation]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerEmail");
    setIsLoggedIn(false);
    setChatStarted(false);
    setConversationId(null);
    setMessages([]);
    setNewMessage("");
    setSelectedFile(null);
    setAuthView("login");
    setResetMessage("");
    setResetError("");
    setIsOpen(true);
    setConversationEnded(false);
  }, []);

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError("Please enter your email");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: resetEmail,
        role: "client",
      });
      setResetError("");
      if (res.data?.emailSent === false && res.data?.resetLink) {
        setResetMessage(`A reset link was generated, but email delivery is not configured on this server. Use this link instead: ${res.data.resetLink}`);
      } else {
        setResetMessage(res.data?.resetLink ? `Reset link ready: ${res.data.resetLink}` : "If an account exists, a reset link has been sent to your email.");
      }
    } catch (err) {
      setResetMessage("");
      if (err.response?.status === 409) {
        setResetError("This email is already registered. Please sign in instead.");
      } else {
        setResetError(err.response?.data?.error || "Could not send reset link");
      }
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token: resetToken,
        email: resetEmail,
        password: newPassword,
      });
      setResetError("");
      setResetMessage("Password updated successfully. You can sign in now.");
      setAuthView("login");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetMessage("");
      setResetError(err.response?.data?.error || "Could not reset password");
    }
  };

  const handleClose = useCallback(() => setIsOpen(false), []);

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setUnreadCount(0); }}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          border: "1px solid rgba(139,92,246,0.25)",
          background: "rgba(10,11,20,0.9)", color: "#e2e8f0",
          padding: "10px 16px", borderRadius: "999px", cursor: "pointer",
          zIndex: 9999,
        }}
      >Open Support{unreadCount > 0 ? ` (${unreadCount})` : ""}</button>
    );
  }

  // ── 2. Auth gate ─────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <CardWrap>
        <Header chatStarted={false} isOnline={isOnline} onClose={handleClose} />
        {authView === "login" ? (
          <Login
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setAuthView("register")}
            onSwitchToForgot={() => setAuthView("forgot")}
          />
        ) : authView === "forgot" ? (
          <div style={{ padding: "24px 22px" }}>
            <div style={{ fontSize: "17px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>Reset password</div>
            <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "20px" }}>Enter your email and we will send you a reset link.</div>
            {resetError && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: "12px" }}>{resetError}</div>}
            {resetMessage && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "12px" }}>{resetMessage}</div>}
            <input
              style={{ ...inputStyle, marginBottom: "12px" }}
              type="email"
              placeholder="your@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button onClick={handleForgotPassword} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Send reset link</button>
            <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}>
              <span onClick={() => setAuthView("login")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Back to sign in</span>
            </div>
          </div>
        ) : authView === "reset" ? (
          <div style={{ padding: "24px 22px" }}>
            <div style={{ fontSize: "17px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>Set a new password</div>
            <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "20px" }}>Choose a new password for {resetEmail || "your account"}.</div>
            {resetError && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: "12px" }}>{resetError}</div>}
            {resetMessage && <div style={{ padding: "9px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "12px" }}>{resetMessage}</div>}
            <input style={{ ...inputStyle, marginBottom: "12px" }} type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input style={{ ...inputStyle, marginBottom: "16px" }} type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button onClick={handleResetPassword} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>Update password</button>
            <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}>
              <span onClick={() => setAuthView("login")} style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}>Back to sign in</span>
            </div>
          </div>
        ) : (
          <Register onSuccess={handleAuthSuccess} onSwitchToLogin={() => setAuthView("login")} />
        )}
      </CardWrap>
    );
  }

  // ── 3. Pre-chat form ──────────────────────────────────────
  if (!chatStarted) {
    return (
      <CardWrap>
        <Header chatStarted={false} isOnline={isOnline} onClose={handleClose} />
        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "28px", height: "3px", background: "linear-gradient(90deg,#8B5CF6,#6366f1)", borderRadius: "2px" }}/>
            <span style={{ fontSize: "10px", color: "#4b5563", letterSpacing: "0.1em", fontWeight: "600" }}>NEW CONVERSATION</span>
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#e2e8f0", marginBottom: "4px" }}>Start a conversation</div>
          <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "22px" }}>We typically reply within 1 hour</div>
          <button onClick={createConversation} style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)",
            border: "none", borderRadius: "10px", color: "white",
            fontSize: "13px", fontWeight: "600", cursor: "pointer",
            letterSpacing: "0.03em", boxShadow: "0 4px 24px rgba(139,92,246,0.4)",
          }}>Start Chat →</button>
        </div>
      </CardWrap>
    );
  }

  // ── 4. Chat window ─────────────────────────────────────────
  return (
    <>
      <button
        onClick={handleLogout}
        style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 99999,
          border: "1px solid rgba(224,43,43,0.4)", color: "#E02B2B",
          fontSize: "13px", fontWeight: "600", padding: "7px 16px",
          borderRadius: "8px", cursor: "pointer", letterSpacing: "0.03em",
          backdropFilter: "blur(8px)", background: "rgba(224,43,43,0.08)",
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(224,43,43,0.18)"}
        onMouseOut={(e)  => e.currentTarget.style.background = "rgba(224,43,43,0.08)"}
      >Logout</button>

      <CardWrap height="565px">
        <Header chatStarted={true} isOnline={isOnline} onClose={handleClose} />

        {/* Edit modal overlay */}
        {editingMsg && (
          <ClientEditModal
            msg={editingMsg}
            onSave={handleEditSave}
            onClose={() => setEditingMsg(null)}
          />
        )}

        {/* ── Conversation ended notice ── */}
        {conversationEnded ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "32px 24px", gap: "14px", textAlign: "center",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(224,43,43,0.1)",
              border: "1px solid rgba(224,43,43,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px",
            }}>🗑️</div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
              Conversation Ended
            </div>
            <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: "1.6" }}>
              This conversation has been closed by the support team. You can start a new one anytime.
            </div>
            <button
              onClick={() => {
                setConversationEnded(false);
                setChatStarted(false);
              }}
              style={{
                marginTop: "8px",
                padding: "10px 24px",
                background: "linear-gradient(135deg,#8B5CF6,#6366f1)",
                border: "none", borderRadius: "10px",
                color: "white", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", boxShadow: "0 4px 18px rgba(139,92,246,0.4)",
              }}
            >Start New Conversation</button>
          </div>
        ) : (
          <>
            {/* Messages list */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px",
              display: "flex", flexDirection: "column", gap: "12px",
              position: "relative",
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#3d4250", fontSize: "12px", marginTop: "50px" }}>
                  Send a message to get started 👋
                </div>
              )}

              {messages.map((msg) => {
                const isCustomer  = msg.sender_id === 1;
                const isAI        = msg.sender_id === 0;
                const isDeleted   = !!msg.is_deleted;
                const isImage     = msg.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                // Customer can only act on their own messages within 3 hours
                const withinLimit = Date.now() - new Date(msg.created_at).getTime() < 3 * 60 * 60 * 1000;
                const canEdit     = isCustomer && !isDeleted && withinLimit;
                const canDelete   = isCustomer && !isDeleted && withinLimit;

                return (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    isCustomer={isCustomer}
                    isAI={isAI}
                    isDeleted={isDeleted}
                    isImage={isImage}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => setEditingMsg(msg)}
                    onDelete={() => handleDeleteMessage(msg.id)}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {typingUser && (
              <div style={{ padding: "0 14px 8px", color: "#8B5CF6", fontSize: "12px", fontStyle: "italic" }}>
                {typingUser}
              </div>
            )}

            {/* File preview */}
            {selectedFile && (
              <div style={{
                padding: "8px 14px", background: "rgba(6,7,13,0.6)",
                borderTop: "1px solid rgba(139,92,246,0.1)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: "16px" }}>{selectedFile.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <span style={{ fontSize: "12px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedFile.name}
                  </span>
                </div>
                <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>✕</button>
              </div>
            )}

            {/* Input bar */}
            <div style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(139,92,246,0.1)",
              background: "rgba(6,7,13,0.6)",
              backdropFilter: "blur(8px)",
              display: "flex", gap: "8px", alignItems: "center", flexShrink: 0,
            }}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }}
                onChange={(e) => setSelectedFile(e.target.files[0] || null)} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{
                background: "rgba(20,22,36,0.8)", border: "1px solid rgba(255,255,255,0.07)",
                color: selectedFile ? "#8B5CF6" : "#4b5563",
                width: "36px", height: "36px", borderRadius: "9px", cursor: "pointer", fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>📎</button>

              <input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (e.target.value.trim()) {
                    socket.emit("typing_started", { conversationId: conversationIdRef.current, senderType: "customer" });
                  } else {
                    socket.emit("typing_stopped", { conversationId: conversationIdRef.current, senderType: "customer" });
                  }
                }}
                onBlur={() => socket.emit("typing_stopped", { conversationId: conversationIdRef.current, senderType: "customer" })}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                style={{
                  flex: 1, padding: "10px 13px",
                  background: "rgba(20,22,36,0.8)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: "9px", color: "#e2e8f0", fontSize: "13px",
                  outline: "none", fontFamily: "'Inter', sans-serif",
                }}
              />

              <button onClick={sendMessage} disabled={uploading} style={{
                background: uploading
                  ? "rgba(75,61,128,0.5)"
                  : "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)",
                color: "white", border: "none", borderRadius: "9px",
                width: "36px", height: "36px",
                cursor: uploading ? "not-allowed" : "pointer", fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                boxShadow: uploading ? "none" : "0 2px 14px rgba(139,92,246,0.45)",
              }}>
                {uploading ? "…" : "➤"}
              </button>
            </div>
          </>
        )}
      </CardWrap>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// 7. MESSAGE ROW  (extracted to avoid hooks-in-map issue)
// ─────────────────────────────────────────────────────────
function MessageRow({ msg, isCustomer, isAI, isDeleted, isImage, canEdit, canDelete, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: "flex", justifyContent: isCustomer ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar (non-customer only) */}
      {!isCustomer && (
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: isAI ? "linear-gradient(135deg,#1d9e75,#0f6e56)" : "rgba(255,255,255,0.06)",
          border: isAI ? "none" : "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
        }}>
          {isAI
            ? <span style={{ fontSize: "10px", color: "white", fontWeight: "700" }}>AI</span>
            : <img src="/a2.png" alt="TCL" style={{ width: "18px", height: "18px", objectFit: "contain" }}/>
          }
        </div>
      )}

      {/* Bubble + action buttons */}
      <div style={{ display: "flex", flexDirection: isCustomer ? "row-reverse" : "row", alignItems: "center", gap: "6px",maxWidth: "290px" }}>
        <div style={{
          background: isCustomer
            ? "linear-gradient(135deg, #8B5CF6 0%, #6d46e8 100%)"
            : "rgba(20,22,36,0.85)",
          color: isCustomer ? "#fff" : isDeleted ? "#4b5563" : "#c9d1e0",
          padding: "10px 14px",
          borderRadius: isCustomer ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          maxWidth: "245px",
          wordBreak: "break-word", 
          overflow: "hidden", 
          border: isCustomer ? "none" : "1px solid rgba(139,92,246,0.14)",
          boxShadow: isCustomer ? "0 4px 18px rgba(139,92,246,0.32)" : "none",
          backdropFilter: isCustomer ? "none" : "blur(8px)",
          fontStyle: isDeleted ? "italic" : "normal",
        }}>
          {isAI && (
            <div style={{ fontSize: "10px", color: "#4ade80", marginBottom: "5px", fontWeight: "700", letterSpacing: "0.06em" }}>
              AI ASSISTANT
            </div>
          )}
          {msg.file_url && isImage && !isDeleted && (
            <img src={`${API_BASE_URL}${msg.file_url}`} alt="attachment"
              style={{ width: "100%", maxWidth: "220px", borderRadius: "8px", marginBottom: msg.message ? "8px" : "0", display: "block" }}
            />
          )}
          {msg.file_url && !isImage && !isDeleted && (
            <a href={`${API_BASE_URL}${msg.file_url}`} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px",
                color: isCustomer ? "rgba(255,255,255,0.85)" : "#8B5CF6",
                marginBottom: msg.message ? "8px" : "0", textDecoration: "none",
              }}
            >📄 Open File</a>
          )}
          {msg.message && (
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>{msg.message}</div>
          )}
          {!!msg.is_edited && !isDeleted && (
            <div style={{ fontSize: "10px", opacity: 0.4, marginTop: "2px" }}>edited</div>
          )}
          <div style={{ fontSize: "10px", opacity: 0.4, marginTop: "5px", textAlign: isCustomer ? "right" : "left" }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Edit / Delete buttons — only for customer's own messages */}
        {hovered && (canEdit || canDelete) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {canEdit && (
              <button
                onClick={onEdit}
                title="Edit"
                style={{
                  background: "rgba(20,22,36,0.9)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#8B5CF6", borderRadius: "6px", padding: "4px 7px",
                  cursor: "pointer", fontSize: "11px",
                }}>✏️</button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                title="Delete"
                style={{
                  background: "rgba(20,22,36,0.9)", border: "1px solid rgba(224,43,43,0.25)",
                  color: "#f87171", borderRadius: "6px", padding: "4px 7px",
                  cursor: "pointer", fontSize: "11px",
                }}>🗑️</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 8. EXPORT
// ─────────────────────────────────────────────────────────
const WrappedApp = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default WrappedApp;