import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://triangle-lab-chat-production.up.railway.app/").replace(/\/$/, "");

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

const labelStyle = {
  fontSize: "10px",
  color: "#4b5563",
  display: "block",
  marginBottom: "6px",
  letterSpacing: "0.08em",
  fontWeight: "600",
  textTransform: "uppercase",
};

export default function Register({ onSuccess, onSwitchToLogin }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("clientToken",   res.data.token);
      localStorage.setItem("customerName",  res.data.name);
      localStorage.setItem("customerEmail", res.data.email);
      onSuccess(res.data.name, res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 22px" }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <div style={{ width: "28px", height: "3px", background: "linear-gradient(90deg,#8B5CF6,#6366f1)", borderRadius: "2px" }}/>
        <span style={{ fontSize: "10px", color: "#4b5563", letterSpacing: "0.1em", fontWeight: "600" }}>
          CREATE ACCOUNT
        </span>
      </div>
      <div style={{ fontSize: "17px", fontWeight: "700", color: "#e2e8f0", marginBottom: "4px" }}>
        Get started
      </div>
      <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "20px" }}>
        Create your account to start chatting
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "9px 12px", borderRadius: "8px", marginBottom: "14px",
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)",
          color: "#f87171", fontSize: "12px",
        }}>
          {error}
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Full name</label>
        <input
          style={inputStyle}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Email</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />
      </div>

      {/* Confirm */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Confirm password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />
      </div>

      {/* Register button */}
      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          width: "100%", padding: "12px",
          background: loading
            ? "rgba(75,61,128,0.5)"
            : "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)",
          border: "none", borderRadius: "10px", color: "white",
          fontSize: "13px", fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.03em",
          boxShadow: loading ? "none" : "0 4px 20px rgba(139,92,246,0.4)",
          marginBottom: "18px",
        }}
      >
        {loading ? "Creating account…" : "Create Account →"}
      </button>

      {/* Switch to login */}
      <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563" }}>
        Already have an account?{" "}
        <span
          onClick={onSwitchToLogin}
          style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}
        >
          Sign In
        </span>
      </div>
    </div>
  );
}