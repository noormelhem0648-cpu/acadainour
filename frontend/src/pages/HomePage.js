import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE as API_URL } from '../config'

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
  useEffect(() => {
    const h = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', () => { setInstalled(true); setPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };
  return { prompt, installed, install };
}

export default function HomePage({ darkMode, setDarkMode, user, token, onLogout }) {
  const navigate = useNavigate();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const [showInstallInfo, setShowInstallInfo] = useState(false);
  const { prompt: installPrompt, installed, install } = useInstallPrompt();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/keys/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHasKey(d.has_key)).catch(() => {});
  }, [token]);

  const submitKey = async () => {
    if (!keyInput.trim()) return;
    setKeyStatus("loading");
    try {
      const res = await fetch(`${API_URL}/keys/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: keyInput.trim() }),
      });
      const d = await res.json();
      if (res.ok) { setKeyStatus("success"); setHasKey(true); setKeyInput(""); }
      else setKeyStatus(d.detail || "خطأ");
    } catch { setKeyStatus("خطأ بالاتصال"); }
  };

  return (
    <div className="page home-page">
      <header className="header">
        <span className="app-name">Noura AI</span>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
        {token && (
          <button
            className={"header-action-btn key-btn" + (hasKey ? " key-active" : "")}
            onClick={() => setShowKeyModal(true)}
            title={hasKey ? "مفتاحك مضاف ✓" : "أضف مفتاح Gemini"}
          >🔑</button>
        )}
        {!installed && (
          <button
            className="header-action-btn install-btn"
            onClick={installPrompt ? install : () => setShowInstallInfo(true)}
            title="تثبيت التطبيق"
          >
            📲 تثبيت
          </button>
        )}
        {onLogout && <button className="header-action-btn" onClick={onLogout} title="خروج">🚪</button>}
      </header>

      <main className="main-content">
        <div className="hero">
          <h1>Your Academic AI Assistant</h1>
          <p>Powered by course materials from Yarmouk University - Applied English Language Department</p>
        </div>

        <div className="card-grid">
          <button className="dept-card" onClick={() => navigate("/years")}>
            <div className="card-icon">📚</div>
            <h2>اللغة الإنجليزية التطبيقية</h2>
            <p>Applied English Language</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>14 مادة × 4 سنوات — يرموك</p>
            <span className="card-arrow">&gt;</span>
          </button>
          <button className="dept-card" onClick={() => navigate("/english-learning")}>
            <div className="card-icon">🎓</div>
            <h2>تعليم اللغة الإنجليزية</h2>
            <p>للناطقين بغيرها</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>من الصفر إلى الطلاقة — 6 مستويات × 30 يوماً</p>
            <span className="card-arrow">&gt;</span>
          </button>
        </div>
      </main>

      {showKeyModal && (
        <div className="quiz-modal-overlay" onClick={() => { setShowKeyModal(false); setKeyStatus(null); }} role="dialog" aria-modal="true">
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>🔑 أضف مفتاح Gemini</h3>
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", margin: "4px 0 16px" }}>
              مفتاحك يُضاف لقاعدة البيانات ويوسّع طاقة السيرفر للجميع.
              احصل على مفتاح مجاني من <strong>aistudio.google.com</strong>
            </p>
            {hasKey ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>مفتاحك مضاف — شكراً على دعم السيرفر! 🎉</p>
                <button className="quiz-modal-btn cancel" style={{ marginTop: 12 }} onClick={() => setShowKeyModal(false)}>إغلاق</button>
              </div>
            ) : (
              <>
                <input
                  className="quiz-topic-input"
                  placeholder="AIzaSy... أو AQ..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitKey()}
                  autoFocus
                  style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                />
                {keyStatus && keyStatus !== "loading" && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: "0.83rem",
                    background: keyStatus === "success" ? "#e8f5e9" : "#fdecea",
                    color: keyStatus === "success" ? "#2e7d32" : "#c62828",
                  }}>
                    {keyStatus === "success" ? "✅ تم إضافة مفتاحك بنجاح!" : keyStatus}
                  </div>
                )}
                <div className="quiz-modal-actions">
                  <button className="quiz-modal-btn primary" onClick={submitKey} disabled={keyStatus === "loading" || !keyInput.trim()}>
                    {keyStatus === "loading" ? "جاري..." : "✅ إضافة"}
                  </button>
                  <button className="quiz-modal-btn cancel" onClick={() => { setShowKeyModal(false); setKeyStatus(null); }}>إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showInstallInfo && (
        <div className="quiz-modal-overlay" onClick={() => setShowInstallInfo(false)}>
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>📲 تثبيت التطبيق</h3>
            {isIOS ? (
              <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--text-muted)', margin: '12px 0' }}>
                <p>على <strong>iPhone / iPad</strong>:</p>
                <ol style={{ paddingRight: 20, marginTop: 8 }}>
                  <li>افتحي الموقع من <strong>Safari</strong></li>
                  <li>اضغطي زر المشاركة <strong>⬆️</strong> في أسفل الشاشة</li>
                  <li>اختاري <strong>"Add to Home Screen"</strong></li>
                  <li>اضغطي <strong>Add</strong> ✓</li>
                </ol>
              </div>
            ) : (
              <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--text-muted)', margin: '12px 0' }}>
                <p>على <strong>Android</strong> (Chrome):</p>
                <ol style={{ paddingRight: 20, marginTop: 8 }}>
                  <li>افتحي قائمة المتصفح <strong>⋮</strong></li>
                  <li>اختاري <strong>"Add to Home Screen"</strong> أو <strong>"Install App"</strong></li>
                  <li>اضغطي <strong>Install</strong> ✓</li>
                </ol>
              </div>
            )}
            <button className="quiz-modal-btn cancel" onClick={() => setShowInstallInfo(false)}>حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
}
