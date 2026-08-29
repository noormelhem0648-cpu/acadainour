import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'
import OrientLockBtn from '../components/OrientLockBtn'


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
  const skills = useMemo(() => progress.skillProgress(), [progress])

  const totalSections = 5 * 30 * 6 + 35 * 6 // levels 1-5 (30 days each) + level 6 (35 days) × 6 components
  const doneSections = Object.values(
    JSON.parse(localStorage.getItem('english_progress') || '{}')
  ).filter(Boolean).length

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
          <OrientLockBtn />
        </header>

        <div className="el-progress-page">

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

          <button className="el-nav-btn" style={{ marginTop: 32 }} onClick={() => navigate(EL)}>
            ← الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}
