import React, { useState } from "react";

const API_URL = "https://acadai-backend-avvo.onrender.com";

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const res = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
        setLoading(false);
        return;
      }

      localStorage.setItem("acadai_token", data.token);
      localStorage.setItem("acadai_user", JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">Noura AI</h1>
        <p className="auth-subtitle">Smart Student Assistant</p>

        <div className="auth-tabs">
          <button className={"auth-tab" + (isLogin ? " active" : "")} onClick={() => { setIsLogin(true); setError(""); }}>
            Login
          </button>
          <button className={"auth-tab" + (!isLogin ? " active" : "")} onClick={() => { setIsLogin(false); setError(""); }}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="الاسم — Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="auth-input"
              required
            />
          )}
          <input
            type="email"
            placeholder="الإيميل — Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور — Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            required
            minLength={6}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "..." : isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          {isLogin ? "ما عندك حساب؟ " : "عندك حساب؟ "}
          <button className="auth-switch" onClick={() => { setIsLogin(!isLogin); setError(""); }}>
            {isLogin ? "سجل الآن" : "سجل دخول"}
          </button>
        </p>
      </div>
    </div>
  );
}
