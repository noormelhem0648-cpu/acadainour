import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../../config'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export default function ELAccountPage({ darkMode, setDarkMode, onLogout }) {
  const navigate = useNavigate()
  const progress = useProgress()

  const user  = (() => { try { return JSON.parse(localStorage.getItem('noura_user')) } catch { return null } })()
  const token = localStorage.getItem('noura_token') || ''

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // Edit name
  const [editName, setEditName] = useState(false)
  const [newName, setNewName]   = useState('')
  const [savingName, setSavingName] = useState(false)

  // Change password
  const [showPwd, setShowPwd]     = useState(false)
  const [curPwd, setCurPwd]       = useState('')
  const [newPwd, setNewPwd]       = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  // Delete account
  const [showDelete, setShowDelete]   = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deletePwd, setDeletePwd]     = useState('')
  const [deleting, setDeleting]       = useState(false)

  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // Load profile from server
  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(d => { setProfile(d); setNewName(d.name) })
      .catch(() => {
        // Fallback to localStorage if backend offline
        if (user) { setProfile(user); setNewName(user.name || '') }
      })
      .finally(() => setLoading(false))
  }, [token]) // eslint-disable-line

  const saveName = async () => {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).detail)
      const updated = await res.json()
      setProfile(updated)
      // Sync localStorage
      const stored = JSON.parse(localStorage.getItem('noura_user') || '{}')
      localStorage.setItem('noura_user', JSON.stringify({ ...stored, name: updated.name }))
      setEditName(false)
      showToast('تم تحديث الاسم ✅')
    } catch (e) { showToast(e.message, false) }
    setSavingName(false)
  }

  const savePassword = async () => {
    if (!curPwd || !newPwd) return showToast('أدخل كلمة المرور الحالية والجديدة', false)
    if (newPwd.length < 6) return showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', false)
    if (newPwd !== confirmPwd) return showToast('كلمتا المرور غير متطابقتين', false)
    setSavingPwd(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me/password`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      })
      if (!res.ok) throw new Error((await res.json()).detail)
      setCurPwd(''); setNewPwd(''); setConfirmPwd('')
      setShowPwd(false)
      showToast('تم تغيير كلمة المرور ✅')
    } catch (e) { showToast(e.message, false) }
    setSavingPwd(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('noura_token')
    localStorage.removeItem('noura_user')
    if (onLogout) onLogout()
    else window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    if (!deleteEmail || !deletePwd) return showToast('أدخل الإيميل وكلمة المرور', false)
    if (deleteEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase())
      return showToast('الإيميل غير صحيح', false)
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'DELETE',
        headers: authHeaders(token),
        body: JSON.stringify({ current_password: deletePwd }),
      })
      if (!res.ok) throw new Error((await res.json()).detail)
      // Clear everything locally
      localStorage.clear()
      window.location.href = '/'
    } catch (e) { showToast(e.message || 'فشل حذف الحساب', false) }
    setDeleting(false)
  }

  // ── Stats from progress ──────────────────────────────────────
  const xp        = progress.xpData?.total || 0
  const streak    = progress.streak?.current || 0
  const hardCount = progress.hardWords?.length || 0
  const dueCount  = progress.dueWords?.().length || 0
  const earnedBadges = progress.getEarnedBadges()

  // Member since formatting
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Avatar initials
  const name = profile?.name || user?.name || '?'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b']
  const avatarColor = colors[(name.charCodeAt(0) || 0) % colors.length]

  if (loading) return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--el-muted)', fontSize: '1rem' }}>جار التحميل...</div>
      </div>
    </div>
  )

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      {/* Toast */}
      {toast && (
        <div className={`el-acct-toast${toast.ok ? '' : ' error'}`}>{toast.msg}</div>
      )}

      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">⚙️ إعدادات الحساب</span>
        </header>

        <div className="el-acct-page">

          {/* ── Avatar + name card ── */}
          <div className="el-acct-hero">
            <div className="el-acct-avatar" style={{ background: avatarColor }}>{initials}</div>
            <div className="el-acct-hero-info">
              {editName ? (
                <div className="el-acct-edit-name-row">
                  <input
                    className="el-acct-name-input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                  />
                  <button className="el-acct-save-btn" onClick={saveName} disabled={savingName}>
                    {savingName ? '...' : '✓ حفظ'}
                  </button>
                  <button className="el-acct-cancel-btn" onClick={() => { setEditName(false); setNewName(profile?.name || '') }}>✕</button>
                </div>
              ) : (
                <div className="el-acct-name-row">
                  <h2 className="el-acct-name">{profile?.name}</h2>
                  <button className="el-acct-edit-btn" onClick={() => setEditName(true)}>✏️ تعديل</button>
                </div>
              )}
              <div className="el-acct-email">{profile?.email}</div>
              <div className="el-acct-role">
                {profile?.role === 'instructor' ? '👨‍🏫 مدرب' : '🎓 طالب'}
                {memberSince && <span className="el-acct-since"> · انضم {memberSince}</span>}
              </div>
            </div>
          </div>

          {/* ── Security ── */}
          <div className="el-acct-section">
            <div className="el-acct-section-title">🔒 الأمان</div>

            {!showPwd ? (
              <button className="el-acct-action-btn" onClick={() => setShowPwd(true)}>
                🔑 تغيير كلمة المرور
              </button>
            ) : (
              <div className="el-acct-pwd-form">
                <input
                  type="password"
                  className="el-acct-input"
                  placeholder="كلمة المرور الحالية"
                  value={curPwd}
                  onChange={e => setCurPwd(e.target.value)}
                />
                <input
                  type="password"
                  className="el-acct-input"
                  placeholder="كلمة المرور الجديدة (6 أحرف+)"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                />
                <input
                  type="password"
                  className="el-acct-input"
                  placeholder="تأكيد كلمة المرور الجديدة"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                />
                <div className="el-acct-pwd-actions">
                  <button className="el-acct-save-btn" onClick={savePassword} disabled={savingPwd}>
                    {savingPwd ? 'جار الحفظ...' : '✓ تحديث كلمة المرور'}
                  </button>
                  <button className="el-acct-cancel-btn" onClick={() => { setShowPwd(false); setCurPwd(''); setNewPwd(''); setConfirmPwd('') }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Data ── */}
          <div className="el-acct-section">
            <div className="el-acct-section-title">💾 بياناتك</div>
            <button
              className="el-acct-action-btn"
              onClick={() => {
                const data = {
                  xp: progress.xpData,
                  hardWords: progress.hardWords,
                  streak: progress.streak,
                  badges: progress.badges,
                  exportDate: new Date().toISOString(),
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'acadai-data.json'; a.click()
                URL.revokeObjectURL(url)
              }}
            >
              ⬇️ تصدير بياناتك (JSON)
            </button>
            <button
              className="el-acct-action-btn danger"
              onClick={() => {
                if (window.confirm('هل أنت متأكد؟ سيتم حذف كل بيانات التقدم المحلية!')) {
                  ['english_xp','english_streak','english_hard_words','english_badges',
                   'english_notebook','english_errors','english_progress','english_sm2']
                    .forEach(k => localStorage.removeItem(k))
                  showToast('تم حذف البيانات المحلية')
                  window.location.reload()
                }
              }}
            >
              🗑️ حذف بيانات التقدم المحلية
            </button>
          </div>

          {/* ── Links ── */}
          <div className="el-acct-section">
            <div className="el-acct-section-title">🔗 روابط</div>
            <div className="el-acct-links">
              <button className="el-acct-link-btn" onClick={() => navigate(`${EL}/progress`)}>📊 لوحة التقدم</button>
              <button className="el-acct-link-btn" onClick={() => navigate(`${EL}/social`)}>👥 المجتمع</button>
              <button className="el-acct-link-btn" onClick={() => navigate('/privacy')}>🔏 سياسة الخصوصية</button>
            </div>
          </div>

          {/* ── Delete account ── */}
          <div className="el-acct-section">
            <div className="el-acct-section-title" style={{ color: '#ef4444' }}>⚠️ منطقة الخطر</div>
            {!showDelete ? (
              <button className="el-acct-action-btn danger" onClick={() => setShowDelete(true)}>
                🗑️ حذف الحساب نهائياً
              </button>
            ) : (
              <div className="el-acct-delete-form">
                <div className="el-acct-delete-warning">
                  سيتم حذف حسابك وجميع بياناتك نهائياً ولا يمكن التراجع عن هذا الإجراء.
                </div>
                <input
                  type="email"
                  className="el-acct-input"
                  placeholder="أدخل إيميلك للتأكيد"
                  value={deleteEmail}
                  onChange={e => setDeleteEmail(e.target.value)}
                  dir="ltr"
                />
                <input
                  type="password"
                  className="el-acct-input"
                  placeholder="أدخل كلمة المرور"
                  value={deletePwd}
                  onChange={e => setDeletePwd(e.target.value)}
                />
                <div className="el-acct-pwd-actions">
                  <button
                    className="el-acct-action-btn danger"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? 'جار الحذف...' : '🗑️ تأكيد حذف الحساب'}
                  </button>
                  <button className="el-acct-cancel-btn" onClick={() => { setShowDelete(false); setDeleteEmail(''); setDeletePwd('') }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Logout ── */}
          <button className="el-acct-logout-btn" onClick={handleLogout}>
            🚪 تسجيل الخروج
          </button>

          <div className="el-acct-version">AcadAI v2.0 · English with Noura</div>
        </div>
      </div>
    </div>
  )
}
