import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE as API_URL } from '../config'
import { track } from '../utils/analytics'

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
  useEffect(() => {
    const h = e => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', h);
      window.removeEventListener('appinstalled', onInstalled);
    };
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

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [myPlan, setMyPlan] = useState("free");
  const [myPayments, setMyPayments] = useState([]);
  const [proofImage, setProofImage] = useState(null); // { data: base64, preview: dataURL }
  const [proofMethod, setProofMethod] = useState("Bank Transfer");
  const [proofNote, setProofNote] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [cardCheckoutLoading, setCardCheckoutLoading] = useState(false);
  const [upgradeBanner, setUpgradeBanner] = useState(null); // "success" | "failed" | null

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/keys/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHasKey(!!d.has_key)).catch(() => setHasKey(false));
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMyPlan(d.plan || "free")).catch(() => {});
  }, [token]);

  // Handle the redirect back from MyFatoorah's hosted checkout page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get("upgrade");
    if (!upgrade) return;
    setUpgradeBanner(upgrade);
    window.history.replaceState({}, "", window.location.pathname);
    if (upgrade === "success" && token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setMyPlan(d.plan || "free")).catch(() => {});
    }
  }, [token]);

  const startCardCheckout = async () => {
    setCardCheckoutLoading(true);
    setSubmitStatus(null);
    try {
      const res = await fetch(`${API_URL}/payments/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok && d.invoice_url) {
        window.location.href = d.invoice_url;
      } else {
        setSubmitStatus({ type: "error", text: d.detail || "الدفع بالبطاقة غير متاح حالياً" });
        setCardCheckoutLoading(false);
      }
    } catch {
      setSubmitStatus({ type: "error", text: "خطأ بالاتصال" });
      setCardCheckoutLoading(false);
    }
  };

  const openUpgradeModal = () => {
    setShowUpgradeModal(true);
    setSubmitStatus(null);
    if (!paymentInfo) {
      fetch(`${API_URL}/payments/info`).then(r => r.json()).then(setPaymentInfo).catch(() => {});
    }
    fetch(`${API_URL}/payments/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMyPayments(Array.isArray(d) ? d : []))
      .catch(() => setMyPayments([]));
  };

  const handleProofFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setSubmitStatus({ type: "error", text: "الصورة كبيرة جداً (حد أقصى 3MB)" }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      const base64 = dataURL.split(",")[1] || "";
      setProofImage({ data: base64, preview: dataURL });
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async () => {
    if (!proofImage) { setSubmitStatus({ type: "error", text: "ارفعي صورة إثبات التحويل أولاً" }); return; }
    setSubmitStatus({ type: "loading" });
    try {
      const res = await fetch(`${API_URL}/payments/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_requested: "premium",
          amount: paymentInfo?.price || "3 JOD",
          method: proofMethod,
          note: proofNote,
          image_data: proofImage.data,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setSubmitStatus({ type: "success", text: "✅ تم إرسال الإثبات! راح تتم مراجعته وترقية حسابك خلال وقت قصير." });
        track("payment_proof_submitted");
        setProofImage(null); setProofNote("");
        fetch(`${API_URL}/payments/mine`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => setMyPayments(Array.isArray(d) ? d : []))
          .catch(() => {});
      } else {
        setSubmitStatus({ type: "error", text: d.detail || "صار خطأ" });
      }
    } catch { setSubmitStatus({ type: "error", text: "خطأ بالاتصال" }); }
  };

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
        {token && (
          <button
            className={"header-action-btn" + (myPlan === "premium" ? " key-active" : "")}
            onClick={openUpgradeModal}
            title={myPlan === "premium" ? "حسابك Premium ✓" : "ترقية لـ Premium"}
          >{myPlan === "premium" ? "💎" : "⬆️"}</button>
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

      {upgradeBanner && (
        <div
          style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 300,
            background: upgradeBanner === "success" ? "#e8f5e9" : "#fdecea",
            color: upgradeBanner === "success" ? "#2e7d32" : "#c62828",
            padding: "12px 20px", borderRadius: 12, fontSize: "0.9rem", fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)", maxWidth: "90%", textAlign: "center",
          }}
        >
          {upgradeBanner === "success" ? "🎉 تمت الترقية لـ Premium بنجاح!" : "❌ لم تتم عملية الدفع — جربي مرة ثانية"}
          <button
            onClick={() => setUpgradeBanner(null)}
            style={{ marginRight: 10, background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "inherit" }}
          >✕</button>
        </div>
      )}

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

      {showUpgradeModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowUpgradeModal(false)} role="dialog" aria-modal="true">
          <div className="quiz-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>💎 ترقية لـ Premium</h3>

            {myPlan === "premium" ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>حسابك Premium بالفعل — استمتعي! 🎉</p>
                <button className="quiz-modal-btn cancel" style={{ marginTop: 12 }} onClick={() => setShowUpgradeModal(false)}>إغلاق</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 14px" }}>
                  السعر: <strong>{paymentInfo?.price || "3 JOD / شهرياً"}</strong> — رسائل غير محدودة تقريباً بدل الحد اليومي المجاني.
                </p>

                {Array.isArray(myPayments) && myPayments.some(p => p.status === "pending") && (
                  <div style={{ background: "#fff8e1", color: "#b8860b", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", marginBottom: 12 }}>
                    ⏳ عندك طلب دفع قيد المراجعة حالياً.
                  </div>
                )}

                {paymentInfo?.card_checkout_available && (
                  <button
                    className="quiz-modal-btn primary"
                    style={{ width: "100%", marginBottom: 14 }}
                    onClick={startCardCheckout}
                    disabled={cardCheckoutLoading}
                  >
                    {cardCheckoutLoading ? "جاري التحويل لصفحة الدفع..." : "💳 ادفعي بالبطاقة (فيزا/ماستركارد)"}
                  </button>
                )}

                <details style={{ marginBottom: 14 }}>
                  <summary style={{ fontSize: "0.82rem", color: "var(--text-muted)", cursor: "pointer" }}>
                    أو حوّلي بنكياً وارفعي إثبات يدوياً
                  </summary>
                  <div style={{ background: "var(--bg-secondary, #f4f4f4)", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", marginTop: 10, lineHeight: 1.8 }}>
                    <div><strong>حوّلي إلى:</strong> {paymentInfo?.instructions?.bank_name || "بنك الاتحاد"}</div>
                    {paymentInfo?.instructions?.account_holder && <div><strong>اسم صاحب الحساب:</strong> {paymentInfo.instructions.account_holder}</div>}
                    {paymentInfo?.instructions?.iban && <div><strong>رقم الحساب / IBAN:</strong> {paymentInfo.instructions.iban}</div>}
                    <div style={{ marginTop: 6, opacity: 0.8 }}>{paymentInfo?.instructions?.note || "بعد التحويل، ارفعي صورة سكرين شوت من عملية التحويل تحت."}</div>
                  </div>
                </details>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofFile}
                  style={{ marginBottom: 10, fontSize: "0.82rem", width: "100%" }}
                />
                {proofImage && (
                  <img src={proofImage.preview} alt="إثبات التحويل" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, marginBottom: 10, display: "block" }} />
                )}

                <select
                  className="quiz-topic-input"
                  value={proofMethod}
                  onChange={e => setProofMethod(e.target.value)}
                  style={{ marginBottom: 10 }}
                >
                  <option value="Bank Transfer">تحويل بنكي</option>
                  <option value="Cliq">Cliq</option>
                  <option value="Cash">نقداً</option>
                </select>

                <input
                  className="quiz-topic-input"
                  placeholder="ملاحظة (اختياري)"
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                  style={{ marginBottom: 10 }}
                />

                {submitStatus && submitStatus.type !== "loading" && (
                  <div style={{
                    marginBottom: 10, padding: "8px 12px", borderRadius: 8, fontSize: "0.83rem",
                    background: submitStatus.type === "success" ? "#e8f5e9" : "#fdecea",
                    color: submitStatus.type === "success" ? "#2e7d32" : "#c62828",
                  }}>
                    {submitStatus.text}
                  </div>
                )}

                <div className="quiz-modal-actions">
                  <button className="quiz-modal-btn primary" onClick={submitProof} disabled={submitStatus?.type === "loading" || !proofImage}>
                    {submitStatus?.type === "loading" ? "جاري الإرسال..." : "📤 إرسال إثبات الدفع"}
                  </button>
                  <button className="quiz-modal-btn cancel" onClick={() => setShowUpgradeModal(false)}>إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
