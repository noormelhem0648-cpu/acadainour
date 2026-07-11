import { useNavigate, useParams } from 'react-router-dom'
import { getDay, COMPONENTS, LEVELS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

function HardWordsWarmup({ progress, navigate }) {
  const due = progress.dueWords?.() || []
  const preview = due.slice(0, 5)
  if (preview.length === 0) return null
  return (
    <div className="el-warmup-section">
      <div className="el-warmup-title">🔥 مراجعة سريعة قبل البدء ({due.length} كلمة مستحقة)</div>
      <div className="el-warmup-words">
        {preview.map(w => (
          <div key={w.id} className="el-warmup-chip">
            <span className="el-warmup-chip-word">{w.word}</span>
            <span className="el-warmup-chip-ar">{w.arabic}</span>
          </div>
        ))}
      </div>
      <button className="el-warmup-go" onClick={() => navigate(`${EL}/review`)}>
        ابدأ جلسة المراجعة الكاملة ←
      </button>
    </div>
  )
}

export default function ELDayPage({ darkMode, setDarkMode }) {
  const { levelId, dayId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const level = LEVELS.find(l => l.id === levelId)
  const day = getDay(levelId, Number(dayId))

  if (!day) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Day not found.</p></div></div>

  const dp = progress.dayProgress(levelId, Number(dayId))

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(`${EL}/level/${levelId}`)}>←</button>
          <span className="el-top-bar-title">Day {day.id} — {levelId}</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-day-hero">
          <div className="el-day-hero-num">Day {day.id} / {level?.totalDays || 30}</div>
          <h2 className="el-day-hero-title">{day.title}</h2>
          <p className="el-day-hero-ar">{day.titleAr}</p>
          <p className="el-day-hero-sub">{day.subtitle}</p>
          <div className="el-day-overall-prog">
            <div className="el-day-overall-bar">
              <div className="el-day-overall-fill" style={{ width: dp.pct + '%' }} />
            </div>
            <span>{dp.done} / {dp.total} مكونات مكتملة</span>
          </div>
        </div>

        <HardWordsWarmup progress={progress} navigate={navigate} />

        <div className="el-components-list">
          {COMPONENTS.map(comp => {
            const done = progress.isDone(`${levelId}-${dayId}-${comp.id}`)
            return (
              <button
                key={comp.id}
                className={'el-comp-card' + (done ? ' el-comp-done' : '')}
                onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/${comp.id}`)}
              >
                <div className="el-comp-icon">{comp.icon}</div>
                <div className="el-comp-info">
                  <div className="el-comp-label">{comp.label}</div>
                  <div className="el-comp-label-en">{comp.labelEn}</div>
                </div>
                <div>
                  {done ? <span className="el-comp-check">✓</span> : <span className="el-comp-arrow">›</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Extra Activities */}
        <div className="el-day-extras">
          <div className="el-day-extras-title">⚡ أنشطة إضافية</div>
          <div className="el-day-extras-row">
            <button className="el-extra-btn speed" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/speed`)}>
              ⚡ Speed Round
              <span className="el-extra-sub">60 ثانية — اختبر نفسك</span>
            </button>
            <button className="el-extra-btn roleplay" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/roleplay`)}>
              🎭 Role-Play
              <span className="el-extra-sub">محادثة بكلمات اليوم</span>
            </button>
          </div>
        </div>

        <div className="el-day-nav-row">
          {Number(dayId) > 1 && (
            <button className="el-nav-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${Number(dayId) - 1}`)}>
              ← اليوم {Number(dayId) - 1}
            </button>
          )}
          {Number(dayId) < (level?.totalDays || 30) && (
            <button className="el-nav-btn primary" onClick={() => navigate(`${EL}/level/${levelId}/day/${Number(dayId) + 1}`)}>
              اليوم {Number(dayId) + 1} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
