import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { speak } from '../utils/tts'
import '../EL.css'

const EL = '/english-learning'

export default function ELReviewPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const progress = useProgress()
  const due = progress.dueWords()

  const [phase, setPhase] = useState('intro') // intro | session | done
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionResults, setSessionResults] = useState([])

  const card = due[idx]
  const total = due.length

  const rate = useCallback((quality) => {
    progress.reviewWord(card.id, quality)
    progress.addXP?.('flashcardCorrect')
    setSessionResults(r => [...r, { word: card, quality }])
    setFlipped(false)
    if (idx + 1 >= total) {
      setPhase('done')
    } else {
      setIdx(i => i + 1)
    }
  }, [card, idx, total, progress])

  const restart = () => {
    setIdx(0)
    setFlipped(false)
    setSessionResults([])
    setPhase(progress.dueWords().length > 0 ? 'session' : 'done')
  }

  const qualityLabels = [
    { q: 0, label: 'ما عرفتها', color: '#ef4444', emoji: '❌' },
    { q: 2, label: 'صعبة',      color: '#f97316', emoji: '😰' },
    { q: 3, label: 'تذكرتها',   color: '#f59e0b', emoji: '🤔' },
    { q: 4, label: 'سهلة',      color: '#22c55e', emoji: '✅' },
    { q: 5, label: 'مثالية',    color: '#10b981', emoji: '🎯' },
  ]

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">🔁 مراجعة SM-2 اليومية</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-review-page">

          {/* INTRO */}
          {phase === 'intro' && (
            <div className="el-review-intro">
              {due.length === 0 ? (
                <div className="el-review-empty">
                  <div className="el-review-empty-icon">🎉</div>
                  <h2>لا مراجعات اليوم!</h2>
                  <p>أضيفي كلمات لقائمة الصعبة ⭐ لتبدأ المراجعة الذكية</p>
                  <button className="el-nav-btn primary" onClick={() => navigate(EL)}>← العودة للرئيسية</button>
                </div>
              ) : (
                <div className="el-review-intro-card">
                  <div className="el-review-intro-icon">🧠</div>
                  <h2>جلسة مراجعة اليوم</h2>
                  <p className="el-review-intro-desc">
                    لديك <strong>{due.length}</strong> كلمة مستحقة للمراجعة بناءً على خوارزمية SM-2
                  </p>
                  <div className="el-review-tip">
                    💡 قيّمي كل كلمة بصدق — الخوارزمية تُعيد جدولة الكلمات الصعبة أسرع
                  </div>
                  <div className="el-review-stats-row">
                    <div className="el-review-stat">
                      <div className="el-review-stat-num">{due.length}</div>
                      <div className="el-review-stat-label">مستحقة الآن</div>
                    </div>
                    <div className="el-review-stat">
                      <div className="el-review-stat-num">{progress.hardWords.length}</div>
                      <div className="el-review-stat-label">إجمالي الصعبة</div>
                    </div>
                  </div>
                  <button className="el-nav-btn primary el-review-start-btn" onClick={() => setPhase('session')}>
                    ابدأ المراجعة →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SESSION */}
          {phase === 'session' && card && (
            <div className="el-review-session">
              {/* Progress bar */}
              <div className="el-review-progress-wrap">
                <div className="el-review-progress-bar">
                  <div className="el-review-progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
                </div>
                <span className="el-review-progress-label">{idx + 1} / {total}</span>
              </div>

              {/* Card */}
              <div
                className={`el-review-card${flipped ? ' flipped' : ''}`}
                onClick={() => !flipped && setFlipped(true)}
              >
                <div className="el-review-card-inner">
                  {/* Front */}
                  <div className="el-review-front">
                    <div className="el-review-level-tag">{card.level} · Day {card.dayId}</div>
                    <div className="el-review-word">{card.word}</div>
                    <div className="el-review-ipa">{card.ipa}</div>
                    <button
                      className="el-speak-btn"
                      style={{ fontSize: '1.4rem', marginTop: 12 }}
                      onClick={e => { e.stopPropagation(); speak(card.word) }}
                    >🔊</button>
                    <div className="el-review-tap-hint">اضغط للكشف ↩</div>
                  </div>
                  {/* Back */}
                  <div className="el-review-back">
                    <div className="el-review-word-back">{card.word}</div>
                    <div className="el-review-arabic">{card.arabic}</div>
                    <button
                      className="el-speak-btn"
                      style={{ fontSize: '1.1rem', marginTop: 8 }}
                      onClick={e => { e.stopPropagation(); speak(card.word) }}
                    >🔊</button>
                  </div>
                </div>
              </div>

              {/* Rating buttons — only after flip */}
              {flipped && (
                <div className="el-review-rating">
                  <div className="el-review-rating-label">كيف كانت هذه الكلمة؟</div>
                  <div className="el-review-rating-btns">
                    {qualityLabels.map(({ q, label, color, emoji }) => (
                      <button
                        key={q}
                        className="el-review-rate-btn"
                        style={{ borderColor: color, color }}
                        onClick={() => rate(q)}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {phase === 'done' && (
            <div className="el-review-done">
              <div className="el-review-done-icon">🎉</div>
              <h2>انتهيتِ!</h2>
              <p>راجعتِ {sessionResults.length} كلمة في هذه الجلسة</p>

              <div className="el-review-results-grid">
                {sessionResults.map((r, i) => {
                  const ql = qualityLabels.find(x => x.q === r.quality) || qualityLabels[0]
                  return (
                    <div key={i} className="el-review-result-row">
                      <span className="el-review-result-word">{r.word.word}</span>
                      <span className="el-review-result-arabic">{r.word.arabic}</span>
                      <span style={{ color: ql.color }}>{ql.emoji}</span>
                    </div>
                  )
                })}
              </div>

              <div className="el-review-done-score">
                ✅ عرفتِ: {sessionResults.filter(r => r.quality >= 3).length} / {sessionResults.length}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="el-nav-btn" onClick={restart}>🔄 مرة أخرى</button>
                <button className="el-nav-btn primary" onClick={() => navigate(EL)}>← الرئيسية</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
