import { useNavigate } from 'react-router-dom'
import { API_BASE as BACKEND } from '../../config'
import { readSSEStream } from '../utils/stream'
import { useEffect, useRef, useState } from 'react'
import { LEVELS } from '../data/curriculum'
import { useProgress, ALL_BADGES, XP_VALUES } from '../hooks/useProgress'
import '../EL.css'


/* ── Vocab Growth Chart ── */
function VocabGrowthChart({ darkMode }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const isDark = darkMode
    ctx.clearRect(0, 0, W, H)

    // Collect words learned per day from SM-2 data
    const smData = JSON.parse(localStorage.getItem('english_sm2') || '{}')
    const byDate = {}
    Object.values(smData).forEach(w => {
      if (w.lastReview) {
        const d = new Date(w.lastReview).toISOString().slice(0, 10)
        byDate[d] = (byDate[d] || 0) + 1
      }
    })
    const dates = Object.keys(byDate).sort().slice(-14)
    if (dates.length === 0) {
      ctx.fillStyle = isDark ? '#9BA8C8' : '#6B7280'
      ctx.font = '14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('لا بيانات بعد — ابدأي المراجعة!', W / 2, H / 2)
      return
    }
    // Cumulative
    let cum = 0
    const points = dates.map(d => { cum += byDate[d]; return cum })
    const maxVal = Math.max(...points, 1)
    const padL = 36, padR = 16, padT = 16, padB = 28
    const chartW = W - padL - padR, chartH = H - padT - padB

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH
      ctx.beginPath()
      ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y)
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'
      ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = isDark ? '#6B7280' : '#9CA3AF'
      ctx.font = '10px system-ui'; ctx.textAlign = 'right'
      ctx.fillText(Math.round(maxVal * i / 4), padL - 4, y + 4)
    }

    // Area fill
    const xStep = chartW / Math.max(points.length - 1, 1)
    const toX = i => padL + i * xStep
    const toY = v => padT + chartH - (v / maxVal) * chartH

    ctx.beginPath()
    points.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(points.length - 1), padT + chartH)
    ctx.lineTo(padL, padT + chartH)
    ctx.closePath()
    ctx.fillStyle = 'rgba(10,184,136,.15)'; ctx.fill()

    // Line
    ctx.beginPath()
    points.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.strokeStyle = '#0AB888'; ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'; ctx.stroke()

    // Dots + labels
    ctx.textAlign = 'center'
    points.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(toX(i), toY(v), 4, 0, Math.PI * 2)
      ctx.fillStyle = '#0AB888'; ctx.fill()
      ctx.strokeStyle = isDark ? '#111' : '#fff'; ctx.lineWidth = 2; ctx.stroke()
      if (i % Math.ceil(dates.length / 5) === 0 || i === dates.length - 1) {
        ctx.fillStyle = isDark ? '#9BA8C8' : '#6B7280'
        ctx.font = '9px system-ui'
        ctx.fillText(dates[i].slice(5), toX(i), padT + chartH + 14)
      }
    })
  }, [darkMode])

  return <canvas ref={canvasRef} width={460} height={180} className="el-vocgrowth-canvas" />
}

/* ── Level Completion Certificate ── */
function LevelCertificate({ levelId, onClose }) {
  const levelNames = { A1: 'المبتدئ', A2: 'الأساسي', B1: 'المتوسط', B2: 'فوق المتوسط', C1: 'المتقدم', C2: 'الإتقان' }
  return (
    <div className="el-cert-backdrop" onClick={onClose}>
      <div className="el-cert-modal" onClick={e => e.stopPropagation()}>
        <div className="el-cert-icon">🏆</div>
        <div className="el-cert-level">{levelId}</div>
        <div className="el-cert-title">مبروك! أكملتِ المستوى</div>
        <div className="el-cert-body">
          لقد أكملتِ مستوى <strong>{levelId} — {levelNames[levelId] || ''}</strong> بنجاح!<br />
          استمري في التقدم نحو المستوى التالي 🚀
        </div>
        <button className="el-nav-btn primary" onClick={onClose}>شكراً! ✓</button>
      </div>
    </div>
  )
}

const EL = '/english-learning'

/* ── Radar Chart (Canvas) ── */
function RadarChart({ skills, darkMode }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) / 2 - 36
    const labels = ['المفردات', 'القواعد', 'القراءة', 'الاستماع', 'الشادونج', 'الكتابة']
    const keys = ['vocab', 'grammar', 'reading', 'listening', 'shadowing', 'writing']
    const n = keys.length
    const isDark = darkMode

    ctx.clearRect(0, 0, W, H)

    const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2

    // Background webs
    for (let ring = 1; ring <= 4; ring++) {
      const rr = r * (ring / 4)
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const a = angle(i)
        const x = cx + rr * Math.cos(a)
        const y = cy + rr * Math.sin(a)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      ctx.stroke()
      if (ring < 4) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
        ctx.fill()
      }
    }

    // Spokes
    for (let i = 0; i < n; i++) {
      const a = angle(i)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Data polygon
    const vals = keys.map(k => (skills[k] || 0) / 100)
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const a = angle(i)
      const rv = r * vals[i]
      const x = cx + rv * Math.cos(a), y = cy + rv * Math.sin(a)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(10, 184, 136, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#0AB888'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Data points
    for (let i = 0; i < n; i++) {
      const a = angle(i)
      const rv = r * vals[i]
      const x = cx + rv * Math.cos(a), y = cy + rv * Math.sin(a)
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#0AB888'
      ctx.fill()
      ctx.strokeStyle = isDark ? '#141929' : '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 12px system-ui'
    ctx.fillStyle = isDark ? '#9BA8C8' : '#4B5563'
    for (let i = 0; i < n; i++) {
      const a = angle(i)
      const rr = r + 22
      const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a)
      ctx.fillText(labels[i], x, y)
      // Percentage
      ctx.font = 'bold 11px system-ui'
      ctx.fillStyle = '#0AB888'
      ctx.fillText((skills[keys[i]] || 0) + '%', x, y + 14)
      ctx.font = 'bold 12px system-ui'
      ctx.fillStyle = isDark ? '#9BA8C8' : '#4B5563'
    }
  }, [skills, darkMode])

  return <canvas ref={canvasRef} width={280} height={280} className="el-radar-canvas" />
}

export default function ELProgressPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const progress = useProgress()
  const skills = progress.skillProgress()
  const earnedBadges = progress.getEarnedBadges()
  const MS_PER_DAY = 86_400_000
  const weeklyXP = (progress.xpData.history || [])
    .filter(h => Date.now() - h.date < 7 * MS_PER_DAY)
    .reduce((s, h) => s + h.amount, 0)

  const totalSections = 6 * 30 * 6 + 35 * 6 // all levels × days × components
  const doneSections = Object.values(progress.isDone).filter(Boolean).length

  // Check for 100% completed level
  const [certLevel, setCertLevel] = useState(() => {
    const shown = JSON.parse(localStorage.getItem('el_cert_shown') || '{}')
    for (const lvl of LEVELS) {
      const lp = progress.levelProgress(lvl.id, lvl.totalDays)
      if (lp.pct === 100 && !shown[lvl.id]) return lvl.id
    }
    return null
  })
  const dismissCert = () => {
    if (certLevel) {
      const shown = JSON.parse(localStorage.getItem('el_cert_shown') || '{}')
      shown[certLevel] = true
      localStorage.setItem('el_cert_shown', JSON.stringify(shown))
      setCertLevel(null)
    }
  }

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      {certLevel && <LevelCertificate levelId={certLevel} onClose={dismissCert} />}
      <div className="el-page">

        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">📊 تقدمي الكامل</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-progress-page">

          {/* XP Summary */}
          <div className="el-xp-summary">
            <div className="el-xp-total">
              <div className="el-xp-num">{progress.xpData.total || 0}</div>
              <div className="el-xp-label">نقطة XP إجمالية</div>
            </div>
            <div className="el-xp-divider" />
            <div className="el-xp-week">
              <div className="el-xp-num accent">{weeklyXP}</div>
              <div className="el-xp-label">نقطة هذا الأسبوع</div>
            </div>
            <div className="el-xp-divider" />
            <div className="el-xp-streak">
              <div className="el-xp-num" style={{ color: '#f59e0b' }}>🔥 {progress.streak.current || 0}</div>
              <div className="el-xp-label">أيام متتالية</div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="el-prog-overall">
            <div className="el-prog-overall-label">التقدم الكلي</div>
            <div className="el-prog-bar-big">
              <div className="el-prog-bar-fill" style={{ width: Math.round(doneSections / totalSections * 100) + '%' }} />
            </div>
            <div className="el-prog-overall-pct">{Math.round(doneSections / totalSections * 100)}%</div>
          </div>

          {/* Radar Chart */}
          <div className="el-radar-section">
            <h3 className="el-section-title">🕸️ خريطة المهارات</h3>
            <div className="el-radar-wrap">
              <RadarChart skills={skills} darkMode={darkMode} />
            </div>
          </div>

          {/* Level cards */}
          <h3 className="el-section-title">📚 تقدم المستويات</h3>
          <div className="el-prog-levels">
            {LEVELS.map(lvl => {
              const lp = progress.levelProgress(lvl.id, lvl.totalDays)
              return (
                <div key={lvl.id} className="el-prog-level-card">
                  <div className="el-prog-level-top">
                    <span className="el-prog-level-id">{lvl.id}</span>
                    <span className="el-prog-level-name">{lvl.name}</span>
                    <span className="el-prog-level-pct">{lp.pct}%</span>
                  </div>
                  <div className="el-prog-bar">
                    <div className="el-prog-bar-fill" style={{ width: lp.pct + '%' }} />
                  </div>
                  <div className="el-prog-level-done">{lp.done} / {lp.total} أقسام مكتملة</div>
                </div>
              )
            })}
          </div>

          {/* Badges */}
          <h3 className="el-section-title">🏅 الأوسمة</h3>
          <div className="el-badges-grid">
            {ALL_BADGES.map(badge => {
              const earned = earnedBadges.some(b => b.id === badge.id)
              return (
                <div key={badge.id} className={`el-badge-card${earned ? ' earned' : ' locked'}`}>
                  <div className="el-badge-icon">{earned ? badge.icon : '🔒'}</div>
                  <div className="el-badge-name">{badge.name}</div>
                  <div className="el-badge-desc">{badge.desc}</div>
                </div>
              )
            })}
          </div>

          {/* XP history chart */}
          <h3 className="el-section-title">📈 نشاط آخر 7 أيام</h3>
          <div className="el-xp-chart">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i))
              const dateStr = d.toISOString().slice(0, 10)
              const dayXP = (progress.xpData.history || [])
                .filter(h => new Date(h.date).toISOString().slice(0, 10) === dateStr)
                .reduce((s, h) => s + h.amount, 0)
              const maxH = 80
              const h = dayXP > 0 ? Math.max(8, Math.min(maxH, dayXP / 2)) : 4
              return (
                <div key={i} className="el-xp-bar-wrap">
                  <div className="el-xp-bar-amount">{dayXP || ''}</div>
                  <div className="el-xp-bar" style={{ height: h + 'px', background: dayXP > 0 ? '#0AB888' : 'var(--border)' }} />
                  <div className="el-xp-bar-day">{['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'][(d.getDay())]}</div>
                </div>
              )
            })}
          </div>

          {/* Vocab Growth Chart */}
          <div className="el-vocgrowth-section">
            <h3 className="el-section-title">📈 نمو مفرداتك المراجَعة</h3>
            <VocabGrowthChart darkMode={darkMode} />
          </div>

          {/* Weekly AI Report */}
          <WeeklyReport xpData={progress.xpData} streak={progress.streak} skills={skills} earnedBadges={earnedBadges} weeklyXP={weeklyXP} />

          <button className="el-nav-btn" style={{ marginTop: 32 }} onClick={() => navigate(EL)}>
            ← الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Weekly AI Report Card ─── */
function WeeklyReport({ xpData, streak, skills, earnedBadges, weeklyXP }) {
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const topSkill = Object.entries(skills).sort((a, b) => b[1] - a[1])[0]
  const weakSkill = Object.entries(skills).sort((a, b) => a[1] - b[1])[0]

  const skillNames = { vocab: 'المفردات', grammar: 'القواعد', reading: 'القراءة', listening: 'الاستماع', shadowing: 'الشادونج', writing: 'الكتابة' }

  const generate = async () => {
    setLoading(true)
    try {
      const context = `Student weekly stats:
- XP this week: ${weeklyXP} points
- Current streak: ${streak?.current || 0} days
- Strongest skill: ${skillNames[topSkill?.[0]]} (${topSkill?.[1]}%)
- Weakest skill: ${skillNames[weakSkill?.[0]]} (${weakSkill?.[1]}%)
- Badges earned: ${earnedBadges.length}`

      const token = localStorage.getItem('noura_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const systemPrompt = `أنت مدرب لغة إنجليزية شخصي. بناءً على إحصائيات الطالب الأسبوعية، اكتب تقريراً شخصياً دافئاً وتحفيزياً باللغة العربية في 3-4 جمل قصيرة: ابدأ بتقييم أداء الأسبوع، سلّط الضوء على نقطة قوة، اقترح تركيزاً للأسبوع القادم، ثم اختم بجملة تحفيزية. الأسلوب شخصي وحار.`
      const res = await fetch(`${BACKEND}/english-tutor/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: context, history: [], subject_info: systemPrompt })
      })
      if (!res.ok) throw new Error('server')
      const text = await readSSEStream(res.body.getReader())
      setReport(text || '')
      setGenerated(true)
    } catch { setReport('تعذّر إنشاء التقرير. تحقق من الاتصال.'); setGenerated(true) }
    finally { setLoading(false) }
  }

  return (
    <div className="el-weekly-report">
      <h3 className="el-section-title">📋 تقريرك الأسبوعي من AI</h3>
      <div className="el-weekly-stats-row">
        <div className="el-weekly-stat">
          <div className="el-weekly-stat-num">{weeklyXP}</div>
          <div className="el-weekly-stat-label">نقطة XP هذا الأسبوع</div>
        </div>
        <div className="el-weekly-stat">
          <div className="el-weekly-stat-num">🔥 {streak?.current || 0}</div>
          <div className="el-weekly-stat-label">يوم متتالي</div>
        </div>
        <div className="el-weekly-stat">
          <div className="el-weekly-stat-num">{topSkill?.[1] || 0}%</div>
          <div className="el-weekly-stat-label">أقوى مهارة: {skillNames[topSkill?.[0]]}</div>
        </div>
      </div>
      {!generated && (
        <button className="el-nav-btn primary" style={{ width: '100%', marginTop: 12 }} onClick={generate} disabled={loading}>
          {loading ? '⏳ يُحلّل أداءك...' : '🤖 اطلب تقريرك الشخصي'}
        </button>
      )}
      {generated && report && (
        <div className="el-weekly-report-text">
          <div className="el-weekly-report-icon">📝</div>
          <div style={{ lineHeight: 1.8 }}>{report}</div>
          <button className="el-nav-btn" style={{ marginTop: 12, fontSize: '.82rem' }} onClick={() => { setGenerated(false); setReport('') }}>
            🔄 تقرير جديد
          </button>
        </div>
      )}
    </div>
  )
}
