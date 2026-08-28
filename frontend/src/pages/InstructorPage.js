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
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [planMsg, setPlanMsg] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsMsg, setPaymentsMsg] = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchRestrictions = async () => {
    try {
      const res = await fetch(`${API_URL}/restrictions`, { headers });
      if (res.ok) setRestrictions(await res.json());
    } catch {}
  };

  const fetchAnalytics = async (days = analyticsDays) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/summary?days=${days}`, { headers });
      if (res.ok) setAnalytics(await res.json());
    } catch {}
    setAnalyticsLoading(false);
  };

  const searchUsers = async (q = userSearch) => {
    setUserSearchLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users?search=${encodeURIComponent(q)}`, { headers });
      if (res.ok) setUserResults(await res.json());
    } catch {}
    setUserSearchLoading(false);
  };

  const setUserPlan = async (id, plan) => {
    setPlanMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/plan`, {
        method: "PATCH", headers, body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setUserResults(rows => rows.map(u => u.id === id ? { ...u, plan } : u));
        setPlanMsg({ type: "success", text: plan === "premium" ? "✅ تمت الترقية لـ Premium" : "تم الإرجاع لـ Free" });
      } else {
        setPlanMsg({ type: "error", text: "خطأ بالتحديث" });
      }
    } catch { setPlanMsg({ type: "error", text: "خطأ بالاتصال" }); }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments?status=pending`, { headers });
      if (res.ok) setPayments(await res.json());
    } catch {}
    setPaymentsLoading(false);
  };

  const reviewPayment = async (id, action) => {
    setPaymentsMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/payments/${id}`, {
        method: "PATCH", headers, body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPayments(rows => rows.filter(p => p.id !== id));
        setPaymentsMsg({ type: "success", text: action === "approve" ? "✅ تمت الموافقة والترقية لـ Premium" : "تم الرفض" });
      } else {
        setPaymentsMsg({ type: "error", text: "خطأ بالمراجعة" });
      }
    } catch { setPaymentsMsg({ type: "error", text: "خطأ بالاتصال" }); }
  };

  useEffect(() => { fetchRestrictions(); fetchAnalytics(); searchUsers(""); fetchPayments(); }, []); // eslint-disable-line

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
          <button className="inst-logout-btn" onClick={onLogout}>خروج 🚪</button>
        </div>
      </header>

      <main className="instructor-main">
        {/* Analytics Dashboard */}
        <div className="inst-card">
          <h2 className="inst-card-title">
            📊 الاستخدام
            <div style={{ display: "flex", gap: 6, marginRight: "auto" }}>
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  className="inst-unblock-btn"
                  style={{ padding: "3px 10px", fontSize: ".78rem", opacity: analyticsDays === d ? 1 : .55 }}
                  onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}
                >{d} يوم</button>
              ))}
            </div>
          </h2>
          {analyticsLoading && !analytics ? (
            <p className="inst-empty">جاري التحميل...</p>
          ) : !analytics || analytics.total_events === 0 ? (
            <p className="inst-empty">لا يوجد استخدام مسجّل بعد خلال هذه الفترة</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "10px 0 16px" }}>
                <div style={{ flex: "1 1 140px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>جلسات نشطة</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{analytics.unique_sessions}</div>
                </div>
                <div style={{ flex: "1 1 140px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>مستخدمين مسجّلين</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{analytics.unique_logged_in_users}</div>
                </div>
                <div style={{ flex: "1 1 140px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>إجمالي الأحداث</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{analytics.total_events}</div>
                </div>
              </div>

              {analytics.daily_active_sessions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 6 }}>نشاط يومي (جلسات فريدة)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, borderBottom: "1px solid var(--border)" }}>
                    {analytics.daily_active_sessions.map(d => {
                      const max = Math.max(...analytics.daily_active_sessions.map(x => x.active_sessions), 1);
                      const h = Math.max(4, Math.round((d.active_sessions / max) * 56));
                      return (
                        <div key={d.date} title={`${d.date}: ${d.active_sessions}`}
                          style={{ flex: 1, height: h, background: "var(--accent, #6366f1)", borderRadius: "3px 3px 0 0", minWidth: 8 }} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "var(--text-muted)", marginTop: 4 }}>
                    <span>{analytics.daily_active_sessions[0]?.date}</span>
                    <span>{analytics.daily_active_sessions[analytics.daily_active_sessions.length - 1]?.date}</span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 6 }}>🏆 أكثر الأحداث</div>
                  {analytics.top_events.map(e => (
                    <div key={e.event_name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".82rem", borderBottom: "1px solid var(--border)" }}>
                      <span>{e.event_name}</span>
                      <span style={{ fontWeight: 700 }}>{e.count}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 6 }}>📄 أكثر الصفحات زيارة</div>
                  {analytics.top_pages.map(p => (
                    <div key={p.path} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".82rem", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ direction: "ltr", textAlign: "right" }}>{p.path}</span>
                      <span style={{ fontWeight: 700 }}>{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pending payment proofs */}
        <div className="inst-card">
          <h2 className="inst-card-title">
            📥 طلبات دفع بانتظار المراجعة
            <span className="inst-badge">{payments.length}</span>
          </h2>
          {paymentsMsg && <div className={`inst-msg ${paymentsMsg.type}`}>{paymentsMsg.text}</div>}
          {paymentsLoading ? (
            <p className="inst-empty">جاري التحميل...</p>
          ) : payments.length === 0 ? (
            <p className="inst-empty">لا توجد طلبات دفع قيد المراجعة</p>
          ) : (
            <div className="inst-list">
              {payments.map(p => (
                <div key={p.id} className="inst-row active" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <img
                      src={`data:image/png;base64,${p.image_data}`}
                      alt="إثبات الدفع"
                      style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => window.open(`data:image/png;base64,${p.image_data}`, "_blank")}
                    />
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700 }}>{p.user_name}</div>
                      <div style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>{p.user_email}</div>
                      <div style={{ fontSize: ".8rem", marginTop: 4 }}>
                        {p.amount} — {p.method} — طلب: <strong>{p.plan_requested}</strong>
                      </div>
                      {p.note && <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: 2 }}>"{p.note}"</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="inst-block-btn" style={{ flex: 1 }} onClick={() => reviewPayment(p.id, "approve")}>✅ موافقة وترقية</button>
                    <button className="inst-unblock-btn" style={{ flex: 1 }} onClick={() => reviewPayment(p.id, "reject")}>❌ رفض</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscriptions / Plan management */}
        <div className="inst-card">
          <h2 className="inst-card-title">💳 الاشتراكات</h2>
          <p className="inst-card-desc">
            ما في بوابة دفع إلكترونية لسا — استلمي الدفع يدوياً (تحويل بنكي، كليك، أو نقداً)، وبعدها رقّي حساب الطالب هون.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              className="inst-input"
              placeholder="ابحث بالاسم أو الإيميل..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchUsers()}
              style={{ flex: 1 }}
            />
            <button className="inst-block-btn" onClick={() => searchUsers()} disabled={userSearchLoading}>
              {userSearchLoading ? "..." : "🔍 بحث"}
            </button>
          </div>
          {planMsg && <div className={`inst-msg ${planMsg.type}`}>{planMsg.text}</div>}
          {userResults.length === 0 ? (
            <p className="inst-empty">لا يوجد مستخدمين</p>
          ) : (
            <div className="inst-list">
              {userResults.map(u => (
                <div key={u.id} className="inst-row active">
                  <div className="inst-row-info">
                    <span className="inst-subject-badge" style={{ background: u.plan === "premium" ? "#f0ad4e" : "#94a3b8" }}>
                      {u.plan === "premium" ? "💎 Premium" : "Free"}
                    </span>
                    <span className="inst-reason">{u.name} — {u.email}</span>
                    <span className="inst-reason" style={{ opacity: .6 }}>({u.daily_count} رسالة اليوم)</span>
                    {u.plan === "premium" && u.premium_expires_at && (
                      <span className="inst-reason" style={{ opacity: .6, fontSize: ".75rem" }}>
                        ينتهي: {new Date(u.premium_expires_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <button
                    className="inst-unblock-btn"
                    onClick={() => setUserPlan(u.id, u.plan === "premium" ? "free" : "premium")}
                  >
                    {u.plan === "premium" ? "إرجاع لـ Free" : "💎 رقّي لـ Premium"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
