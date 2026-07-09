import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useState, useEffect } from 'react'
import '../EL.css'

const EL = '/english-learning'

function speak(text, lang = 'en-US') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang; u.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const v = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

const SM2_LABELS = [
  { q: 0, label: 'نسيت تماماً', color: '#dc2626' },
  { q: 3, label: 'صعب', color: '#f97316' },
  { q: 4, label: 'جيد', color: '#16a34a' },
  { q: 5, label: 'سهل جداً', color: '#2563eb' },
]

export default function ELLedgerPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const { hardWords, toggleHardWord, reviewWord, getSM2Card, dueWords } = useProgress()
  const [filter, setFilter] = useState('due')
  const [flipped, setFlipped] = useState({})
  const [rated, setRated] = useState({})

  const due = dueWords()
  useEffect(() => {
    if (filter === 'due' && due.length === 0 && hardWords.length > 0) setFilter('all')
  }, [due.length, hardWords.length]) // eslint-disable-line

  const levels = [...new Set(hardWords.map(w => w.level))]
  const filtered = filter === 'all' ? hardWords
    : filter === 'due' ? due
    : hardWords.filter(w => w.level === filter)

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">⭐ كلماتي الصعبة</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-ledger-wrap">
          {hardWords.length === 0 ? (
            <div className="el-ledger-empty">
              <div style={{ fontSize: '3rem' }}>📚</div>
              <p>لم تُضف أي كلمات صعبة بعد.</p>
              <p style={{ color: 'var(--el-muted)', fontSize: '.9rem' }}>
                اضغط ☆ بجانب أي كلمة في درس المفردات لإضافتها هنا.
              </p>
              <button className="el-nav-btn primary" onClick={() => navigate(EL)}>ابدأ التعلم</button>
            </div>
          ) : (
            <>
              <div className="el-ledger-stats">
                <span>⭐ {hardWords.length} كلمة صعبة</span>
                <span style={{ color: 'var(--el-muted)', fontSize: '.8rem' }}>
                  راجعها بانتظام للحفظ الدائم
                </span>
              </div>

              {/* Level filter */}
              <div className="el-ledger-filters">
                {due.length > 0 && (
                  <button className={'el-view-btn' + (filter === 'due' ? ' active' : '')} onClick={() => setFilter('due')} style={{ color: '#f97316', borderColor: '#f97316' }}>
                    ⏰ مستحقة ({due.length})
                  </button>
                )}
                <button className={'el-view-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
                  الكل ({hardWords.length})
                </button>
                {levels.map(lv => (
                  <button key={lv} className={'el-view-btn' + (filter === lv ? ' active' : '')} onClick={() => setFilter(lv)}>
                    {lv} ({hardWords.filter(w => w.level === lv).length})
                  </button>
                ))}
              </div>

              <div className="el-ledger-grid">
                {filtered.map((w, i) => {
                  const card = getSM2Card(w.id)
                  const isDue = !card.nextReview || card.nextReview <= Date.now()
                  const nextDate = card.nextReview ? new Date(card.nextReview).toLocaleDateString('ar-EG') : null
                  return (
                  <div
                    key={w.id}
                    className={'el-flashcard' + (flipped[i] ? ' flipped' : '') + ' hard' + (isDue ? ' sm2-due' : '')}
                    onClick={() => !flipped[i] && setFlipped(f => ({ ...f, [i]: true }))}
                  >
                    <div className="el-fc-inner">
                      <div className="el-fc-front">
                        <div className="el-fc-word">{w.word}</div>
                        <div className="el-fc-ipa">{w.ipa}</div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }} onClick={e => e.stopPropagation()}>
                          <button className="el-tts-btn" onClick={() => speak(w.word, 'en-US')}>🇺🇸</button>
                          <button className="el-tts-btn" onClick={() => speak(w.word, 'en-GB')}>🇬🇧</button>
                        </div>
                        <div className="el-fc-hint">اضغط لرؤية المعنى ↩</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--el-muted)', marginTop: 4 }}>
                          {w.level} · يوم {w.dayId}
                          {!isDue && nextDate && <span style={{ marginRight: 6 }}>· 📅 {nextDate}</span>}
                        </div>
                      </div>
                      <div className="el-fc-back">
                        <div className="el-fc-arabic">{w.arabic}</div>
                        {!rated[w.id] ? (
                          <div className="el-sm2-rate" onClick={e => e.stopPropagation()}>
                            <div className="el-sm2-label">كيف كان؟</div>
                            <div className="el-sm2-btns">
                              {SM2_LABELS.map(({ q, label, color }) => (
                                <button
                                  key={q}
                                  className="el-sm2-btn"
                                  style={{ borderColor: color, color }}
                                  onClick={() => {
                                    reviewWord(w.id, q)
                                    setRated(r => ({ ...r, [w.id]: q }))
                                    setFlipped(f => ({ ...f, [i]: false }))
                                  }}
                                >{label}</button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '.75rem', color: 'var(--el-muted)', marginTop: 10 }}>
                            ✓ تم التقييم
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="el-hard-btn fc active"
                      onClick={e => { e.stopPropagation(); toggleHardWord({ word: w.word, arabic: w.arabic, ipa: w.ipa }, w.level, w.dayId) }}
                      title="إزالة من القائمة"
                    >⭐</button>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
