import React, { useState, useEffect } from "react";
import { API_BASE as API_URL } from '../config'

export default function AuthPage({ onLogin }) {
  // mode: "login" | "register" | "forgot" | "reset"
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect ?reset_token=... in the URL → show reset form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("reset_token");
    if (t) {
      setResetToken(t);
      setMode("reset");
    }
  }, []);

  const clearMsgs = () => { setError(""); setInfo(""); };

  const handleAuth = async (e) => {
    e.preventDefault();
    clearMsgs();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      const res = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong."); setLoading(false); return; }
      localStorage.setItem("noura_token", data.token);
      localStorage.setItem("noura_user", JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    clearMsgs();
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setInfo(data.message || "إذا كان الإيميل مسجّل، رح توصلك رسالة.");
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    clearMsgs();
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "خطأ."); setLoading(false); return; }
      setInfo(data.message || "تم تغيير كلمة السر!");
      // Clean the URL and switch to login after a moment
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => { setMode("login"); setInfo(""); }, 2000);
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">Noura AI</h1>
        <p className="auth-subtitle">Smart Student Assistant</p>
        <a className="auth-privacy-link" href="/privacy">الخصوصية والشروط</a>

        {(mode === "login" || mode === "register") && (
          <>
            <div className="auth-tabs">
              <button className={"auth-tab" + (mode === "login" ? " active" : "")} onClick={() => { setMode("login"); clearMsgs(); }}>
                Login
              </button>
              <button className={"auth-tab" + (mode === "register" ? " active" : "")} onClick={() => { setMode("register"); clearMsgs(); }}>
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              {mode === "register" && (
                <input type="text" placeholder="الاسم — Name" value={name} onChange={e => setName(e.target.value)} className="auth-input" required />
              )}
              <input type="email" placeholder="الإيميل — Email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" required />
              <input type="password" placeholder="كلمة المرور — Password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" required minLength={6} />

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "..." : mode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            {mode === "login" && (
              <button className="auth-forgot-link" onClick={() => { setMode("forgot"); clearMsgs(); }}>
                نسيت كلمة السر؟
              </button>
            )}

            <p className="auth-footer">
              {mode === "login" ? "ما عندك حساب؟ " : "عندك حساب؟ "}
              <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); clearMsgs(); }}>
                {mode === "login" ? "سجل الآن" : "سجل دخول"}
              </button>
            </p>
          </>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="auth-form">
            <p className="auth-subtitle" style={{ marginBottom: 12 }}>اكتب إيميلك ورح نبعتلك رابط لإعادة تعيين كلمة السر 📧</p>
            <input type="email" placeholder="الإيميل — Email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" required />
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "..." : "إرسال الرابط"}
            </button>
            <button type="button" className="auth-switch" style={{ marginTop: 10 }} onClick={() => { setMode("login"); clearMsgs(); }}>
              ← رجوع لتسجيل الدخول
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="auth-form">
            <p className="auth-subtitle" style={{ marginBottom: 12 }}>اكتب كلمة السر الجديدة 🔒</p>
            <input type="password" placeholder="كلمة السر الجديدة — New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="auth-input" required minLength={6} />
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "..." : "تغيير كلمة السر"}
            </button>
            <button type="button" className="auth-switch" style={{ marginTop: 10 }} onClick={() => { setMode("login"); clearMsgs(); window.history.replaceState({}, "", window.location.pathname); }}>
              ← رجوع لتسجيل الدخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
