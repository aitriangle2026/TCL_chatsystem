import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

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

export default function Login({ onSuccess, onSwitchToRegister, onSwitchToForgot }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    setError("Please fill in all fields");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      {
        email,
        password,
      }
    );

    localStorage.setItem("clientToken", res.data.token);
    localStorage.setItem("customerName", res.data.name);
    localStorage.setItem("customerEmail", res.data.email);

    onSuccess(res.data.name, res.data.email);
  } catch (err) {
    setError(err.response?.data?.error || "Login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: "28px 22px" }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "28px", height: "3px", background: "linear-gradient(90deg,#8B5CF6,#6366f1)", borderRadius: "2px" }}/>
        <span style={{ fontSize: "10px", color: "#4b5563", letterSpacing: "0.1em", fontWeight: "600" }}>
          WELCOME BACK
        </span>
      </div>
      <div style={{ fontSize: "17px", fontWeight: "700", color: "#e2e8f0", marginBottom: "4px" }}>
        Sign in
      </div>
      <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "24px" }}>
        Continue your conversation with us
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "9px 12px", borderRadius: "8px", marginBottom: "16px",
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)",
          color: "#f87171", fontSize: "12px",
        }}>
          {error}
        </div>
      )}

      {/* Email */}
      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Email</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: "22px" }}>
        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>

      {/* Sign in button */}
      <button
        onClick={handleLogin}
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
        {loading ? "Signing in…" : "Sign In →"}
      </button>

      <div style={{ textAlign: "center", fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>
        <span
          onClick={onSwitchToForgot}
          style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600", display: "block", marginBottom: "8px" }}
        >
          Forgot password?
        </span>
        Don't have an account?{" "}
        <span
          onClick={onSwitchToRegister}
          style={{ color: "#8B5CF6", cursor: "pointer", fontWeight: "600" }}
        >
          Sign Up
        </span>
      </div>
    </div>
  );
}