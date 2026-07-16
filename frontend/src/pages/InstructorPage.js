import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE as API_URL } from '../config'

export default function InstructorPage({ darkMode, setDarkMode, user, token, onLogout }) {
  const navigate = useNavigate();
  const [restrictions, setRestrictions] = useState([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
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
        body: JSON.stringify({
          subject_code: subjectInput.trim().toUpperCase(),
          reason: reasonInput.trim(),
          start_time: startInput || null,
          end_time: endInput || null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setMsg({ type: "success", text: d.scheduled ? `⏰ تمت جدولة حجب ${subjectInput.toUpperCase()}` : `✅ تم حجب ${subjectInput.toUpperCase()}` });
        setSubjectInput(""); setReasonInput(""); setStartInput(""); setEndInput("");
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
  const scheduled = restrictions.filter(r => r.scheduled);
  const inactive = restrictions.filter(r => !r.active && !r.scheduled);
  const fmt = (s) => { try { return new Date(s + "Z").toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }); } catch { return s; } };

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
          <button className="inst-try-btn" onClick={() => navigate("/years")}>🎓 جرّب كطالب</button>
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
          <p className="inst-card-desc">احجب فوراً، أو <b>جدول</b> الحجب لوقت لاحق (مثلاً يبدأ بكرا الساعة 9). اترك الأوقات فاضية = حجب فوري ومفتوح.</p>
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
            <label className="inst-dt-label">من (اختياري):</label>
            <input className="inst-input" type="datetime-local" value={startInput} onChange={e => setStartInput(e.target.value)} />
            <label className="inst-dt-label">إلى (اختياري):</label>
            <input className="inst-input" type="datetime-local" value={endInput} onChange={e => setEndInput(e.target.value)} />
            <button className="inst-block-btn" onClick={blockSubject} disabled={loading || !subjectInput.trim()}>
              {loading ? "جاري..." : "🔒 حجب / جدولة"}
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

        {/* Scheduled (future) restrictions */}
        {scheduled.length > 0 && (
          <div className="inst-card">
            <h2 className="inst-card-title">
              ⏰ حجب مجدول (لسا ما بدأ)
              <span className="inst-badge">{scheduled.length}</span>
            </h2>
            <div className="inst-list">
              {scheduled.map(r => (
                <div key={r.id} className="inst-row active" style={{ borderColor: "#f0ad4e", background: "#fffaf0" }}>
                  <div className="inst-row-info">
                    <span className="inst-subject-badge" style={{ background: "#f0ad4e" }}>{r.subject_code}</span>
                    <span className="inst-reason">من {fmt(r.start_time)} إلى {fmt(r.end_time)}</span>
                    {r.reason && <span className="inst-reason">"{r.reason}"</span>}
                  </div>
                  <button className="inst-unblock-btn" onClick={() => unblock(r.id, r.subject_code)}>
                    🗑️ إلغاء
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
