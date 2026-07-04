import React, { useState, useEffect } from "react";

const API_URL = "https://acadai-backend-avvo.onrender.com";

export default function InstructorPage({ darkMode, setDarkMode, user, token, onLogout }) {
  const [restrictions, setRestrictions] = useState([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchRestrictions = async () => {
    try {
      const res = await fetch(`${API_URL}/restrictions`, { headers });
      if (res.ok) setRestrictions(await res.json());
    } catch {}
  };

  useEffect(() => { fetchRestrictions(); }, []);

  const blockSubject = async () => {
    if (!subjectInput.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/restrictions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ subject_code: subjectInput.trim().toUpperCase(), reason: reasonInput.trim() }),
      });
      if (res.ok) {
        setMsg({ type: "success", text: `✅ تم حجب مادة ${subjectInput.toUpperCase()}` });
        setSubjectInput("");
        setReasonInput("");
        fetchRestrictions();
      } else {
        const d = await res.json();
        setMsg({ type: "error", text: d.detail || "خطأ" });
      }
    } catch {
      setMsg({ type: "error", text: "خطأ بالاتصال" });
    }
    setLoading(false);
  };

  const unblock = async (id, code) => {
    if (!window.confirm(`إلغاء حجب مادة ${code}؟`)) return;
    try {
      await fetch(`${API_URL}/restrictions/${id}`, { method: "DELETE", headers });
      setMsg({ type: "success", text: `✅ تم إلغاء حجب ${code}` });
      fetchRestrictions();
    } catch {
      setMsg({ type: "error", text: "خطأ بالاتصال" });
    }
  };

  const active = restrictions.filter(r => r.active);
  const inactive = restrictions.filter(r => !r.active);

  return (
    <div className={`page instructor-page${darkMode ? " dark-page" : ""}`}>
      <header className="instructor-header">
        <div className="instructor-header-left">
          <span className="instructor-logo">🎓</span>
          <div>
            <div className="instructor-title">لوحة التحكم</div>
            <div className="instructor-subtitle">{user?.name}</div>
          </div>
        </div>
        <div className="instructor-header-right">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="inst-logout-btn" onClick={onLogout}>خروج 🚪</button>
        </div>
      </header>

      <main className="instructor-main">
        {/* Block Form */}
        <div className="inst-card">
          <h2 className="inst-card-title">🔒 حجب مادة</h2>
          <p className="inst-card-desc">لما تحجب مادة، الطلاب ما يقدرون يستخدمون AcadAI فيها لحد ما ترفع الحجب.</p>
          <div className="inst-form">
            <input
              className="inst-input"
              placeholder="كود المادة — مثال: AEL101"
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && blockSubject()}
            />
            <input
              className="inst-input"
              placeholder="السبب (اختياري) — مثال: كويز اليوم"
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && blockSubject()}
            />
            <button className="inst-block-btn" onClick={blockSubject} disabled={loading || !subjectInput.trim()}>
              {loading ? "جاري..." : "🔒 حجب المادة"}
            </button>
          </div>
          {msg && <div className={`inst-msg ${msg.type}`}>{msg.text}</div>}
        </div>

        {/* Active restrictions */}
        <div className="inst-card">
          <h2 className="inst-card-title">
            🚫 المواد المحجوبة الآن
            <span className="inst-badge">{active.length}</span>
          </h2>
          {active.length === 0 ? (
            <p className="inst-empty">لا توجد مواد محجوبة حالياً</p>
          ) : (
            <div className="inst-list">
              {active.map(r => (
                <div key={r.id} className="inst-row active">
                  <div className="inst-row-info">
                    <span className="inst-subject-badge">{r.subject_code}</span>
                    {r.reason && <span className="inst-reason">"{r.reason}"</span>}
                  </div>
                  <button className="inst-unblock-btn" onClick={() => unblock(r.id, r.subject_code)}>
                    🔓 رفع الحجب
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past restrictions */}
        {inactive.length > 0 && (
          <div className="inst-card">
            <h2 className="inst-card-title">📋 سجل الحجب السابق</h2>
            <div className="inst-list">
              {inactive.map(r => (
                <div key={r.id} className="inst-row inactive">
                  <span className="inst-subject-badge faded">{r.subject_code}</span>
                  {r.reason && <span className="inst-reason faded">"{r.reason}"</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
