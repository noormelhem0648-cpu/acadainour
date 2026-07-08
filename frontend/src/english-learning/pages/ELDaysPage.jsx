import { useNavigate, useParams } from 'react-router-dom'
import { ALL_DAYS, LEVELS, COMPONENTS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

export default function ELDaysPage({ darkMode, setDarkMode }) {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const level = LEVELS.find(l => l.id === levelId)
  const days = levelId === 'A1' ? ALL_DAYS : []

  if (!level) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Level not found.</p></div></div>

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">{level.name}</span>
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
            return (
              <button
                key={day.id}
                className={'el-day-card' + (allDone ? ' done' : started ? ' started' : '')}
                onClick={() => navigate(`${EL}/level/${levelId}/day/${day.id}`)}
              >
                <div className="el-day-num">Day {day.id}</div>
                <div className="el-day-title">{day.title}</div>
                <div className="el-day-title-ar">{day.titleAr}</div>
                <div className="el-day-prog-row">
                  <div className="el-day-prog-bar">
                    <div className="el-day-prog-fill" style={{ width: dp.pct + '%' }} />
                  </div>
                  <span className="el-day-prog-txt">{dp.done}/{dp.total}</span>
                </div>
                {allDone && <div className="el-day-done-badge">✓</div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
