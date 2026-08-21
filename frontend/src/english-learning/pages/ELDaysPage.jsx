import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ALL_DAYS, A2_ALL_DAYS, B1_ALL_DAYS, B2_ALL_DAYS, C1_ALL_DAYS, C2_ALL_DAYS, LEVELS, COMPONENTS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import { usePlan, isDayLocked, FREE_DAY_LIMIT } from '../hooks/usePlan'
import '../EL.css'
import OrientLockBtn from '../components/OrientLockBtn'

const EL = '/english-learning'

const LEVEL_DAYS = {
  A1: ALL_DAYS,
  A2: A2_ALL_DAYS,
  B1: B1_ALL_DAYS,
  B2: B2_ALL_DAYS,
  C1: C1_ALL_DAYS,
  C2: C2_ALL_DAYS,
}

export default function ELDaysPage({ darkMode, setDarkMode }) {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const { plan } = usePlan()
  const [showLockModal, setShowLockModal] = useState(false)
  const level = LEVELS.find(l => l.id === levelId)
  const days = LEVEL_DAYS[levelId] || []

  if (!level) return <div className={`el-app${darkMode ? ' el-dark' : ''}`}><div className="el-page"><p style={{ padding: 32 }}>Level not found.</p></div></div>

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">{level.name}</span>
          <OrientLockBtn />
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-days-hero">
          <div className="el-days-hero-badge">{levelId}</div>
          <h2 className="el-days-hero-title">{level.description}</h2>
          <div className="el-days-legend">
            {COMPONENTS.map(c => (
              <span key={c.id} className="el-legend-pill">{c.icon} {c.labelEn}</span>
            ))}
          </div>
        </div>

        <div className="el-days-grid">
          {days.map(day => {
            const dp = progress.dayProgress(levelId, day.id)
            const allDone = dp.done === dp.total
            const started = dp.done > 0
            const locked = isDayLocked(day.id, plan)
            return (
              <button
                key={day.id}
                className={'el-day-card' + (allDone ? ' done' : started ? ' started' : '') + (locked ? ' locked' : '')}
                onClick={() => locked ? setShowLockModal(true) : navigate(`${EL}/level/${levelId}/day/${day.id}`)}
              >
                <div className="el-day-num">Day {day.id}</div>
                <div className="el-day-title">{day.title}</div>
                <div className="el-day-title-ar">{day.titleAr}</div>
                {locked ? (
                  <div className="el-day-locked-badge">🔒 Premium</div>
                ) : (
                  <div className="el-day-prog-row">
                    <div className="el-day-prog-bar">
                      <div className="el-day-prog-fill" style={{ width: dp.pct + '%' }} />
                    </div>
                    <span className="el-day-prog-txt">{dp.done}/{dp.total}</span>
                  </div>
                )}
                {allDone && <div className="el-day-done-badge">✓</div>}
              </button>
            )
          })}
        </div>
      </div>

      {showLockModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowLockModal(false)} role="dialog" aria-modal="true">
          <div className="quiz-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🔒</div>
            <h3>هذا الدرس لـ Premium</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--el-muted, #888)', margin: '8px 0 18px' }}>
              أول {FREE_DAY_LIMIT} أيام من كل مستوى مجانية. باقي الأيام تحتاج اشتراك Premium.
            </p>
            <div className="quiz-modal-actions">
              <button className="quiz-modal-btn primary" onClick={() => navigate('/')}>💎 ترقية لـ Premium</button>
              <button className="quiz-modal-btn cancel" onClick={() => setShowLockModal(false)}>لاحقاً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
