import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDay } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

function shuffle(arr) { return [...arr].sort(() => Math.random() - .5) }

export default function ELSpeedRoundPage({ darkMode, setDarkMode }) {
  const { levelId, dayId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const day = getDay(levelId, Number(dayId))

  const [phase, setPhase] = useState('intro') // intro | countdown | game | result
  const [words, setWords] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [options, setOptions] = useState([])
  const [chosen, setChosen] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [countdown, setCountdown] = useState(3)
  const [results, setResults] = useState([])
  const [feedback, setFeedback] = useState(null) // {correct, word}
  const timerRef = useRef(null)

  // Load best score
  const BEST_KEY = `speed_best_${levelId}_${dayId}`
  const bestScore = parseInt(localStorage.getItem(BEST_KEY) || '0')

  const loadWords = useCallback(() => {
    if (!day) return []
    const pool = shuffle(day.vocabulary.words).slice(0, 10)
    return pool
  }, [day])

  const buildOptions = useCallback((word, allWords) => {
    const wrong = shuffle(allWords.filter(w => w.word !== word.word)).slice(0, 3)
    return shuffle([word, ...wrong])
  }, [])

  const startCountdown = () => {
    const ws = loadWords()
    setWords(ws)
    setCurrentIdx(0)
    setScore(0)
    setResults([])
    setPhase('countdown')
    setCountdown(3)
  }

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('game')
      setTimeLeft(60)
      setOptions(buildOptions(words[0], words))
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, words, buildOptions])

  // Timer effect
  useEffect(() => {
    if (phase !== 'game') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          endGame()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const endGame = useCallback(() => {
    clearInterval(timerRef.current)
    setPhase('result')
    progress.addXP?.('speedRound', { score })
    if (score > bestScore) localStorage.setItem(BEST_KEY, String(score))
  }, [score, bestScore, BEST_KEY, progress])

  const answer = useCallback((opt) => {
    if (chosen || phase !== 'game') return
    const correct = opt.word === words[currentIdx].word
    setChosen(opt.word)
    const newScore = correct ? score + 1 : score
    if (correct) setScore(newScore)
    setResults(r => [...r, { word: words[currentIdx], correct, chosen: opt.arabic }])
    setFeedback({ correct, word: words[currentIdx] })

    setTimeout(() => {
      setFeedback(null)
      setChosen(null)
      const nextIdx = currentIdx + 1
      if (nextIdx >= words.length) {
        setScore(newScore)
        endGame()
      } else {
        setCurrentIdx(nextIdx)
        setOptions(buildOptions(words[nextIdx], words))
      }
    }, correct ? 400 : 900)
  }, [chosen, phase, words, currentIdx, score, endGame, buildOptions])

  if (!day) return <div className="el-app"><p style={{ padding: 32 }}>Not found.</p></div>

  const timerPct = (timeLeft / 60) * 100
  const timerColor = timeLeft > 30 ? '#10b981' : timeLeft > 10 ? '#f59e0b' : '#ef4444'

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page el-speed-page">

        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}>←</button>
          <span className="el-top-bar-title">⚡ Speed Round</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="el-speed-intro">
            <div className="el-speed-intro-card">
              <div className="el-speed-big-icon">⚡</div>
              <h2 className="el-speed-title">Speed Round</h2>
              <p className="el-speed-desc">10 كلمات × 60 ثانية — ما تختار المعنى الصحيح بالعربي!</p>
              <div className="el-speed-rules">
                <div className="el-speed-rule">🎯 اختر المعنى العربي الصحيح</div>
                <div className="el-speed-rule">⚡ كل إجابة صحيحة = نقطة</div>
                <div className="el-speed-rule">🏆 أفضل نتيجة: {bestScore} نقطة</div>
              </div>
              <div className="el-speed-day-tag">
                📅 كلمات اليوم {dayId}: {day.title}
              </div>
              <button className="el-nav-btn primary el-speed-start-btn" onClick={startCountdown}>
                🚀 ابدأ الآن
              </button>
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === 'countdown' && (
          <div className="el-speed-countdown">
            <div className="el-speed-countdown-num">{countdown > 0 ? countdown : '🚀'}</div>
            <div className="el-speed-countdown-label">{countdown > 0 ? 'استعد...' : 'انطلق!'}</div>
          </div>
        )}

        {/* GAME */}
        {phase === 'game' && words[currentIdx] && (
          <div className="el-speed-game">
            {/* Timer bar */}
            <div className="el-speed-timer-wrap">
              <div className="el-speed-timer-bar">
                <div className="el-speed-timer-fill" style={{ width: timerPct + '%', background: timerColor }} />
              </div>
              <div className="el-speed-timer-text" style={{ color: timerColor }}>{timeLeft}s</div>
            </div>

            {/* Score & progress */}
            <div className="el-speed-hud">
              <div className="el-speed-score">⭐ {score}</div>
              <div className="el-speed-progress">{currentIdx + 1} / {words.length}</div>
            </div>

            {/* Word card */}
            <div className="el-speed-word-card">
              <div className="el-speed-word">{words[currentIdx].word}</div>
              <div className="el-speed-ipa">{words[currentIdx].ipa}</div>
              <div className="el-speed-phonetic">{words[currentIdx].phonetic}</div>
            </div>

            {/* Feedback flash */}
            {feedback && (
              <div className={`el-speed-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
                {feedback.correct ? '✓ صح!' : `✗ ${words[currentIdx].arabic}`}
              </div>
            )}

            {/* Options */}
            <div className="el-speed-options">
              {options.map((opt, i) => (
                <button
                  key={i}
                  className={
                    'el-speed-opt' +
                    (chosen
                      ? opt.word === words[currentIdx].word ? ' correct'
                        : opt.word === chosen ? ' wrong' : ' dim'
                      : '')
                  }
                  onClick={() => answer(opt)}
                  disabled={!!chosen}
                >
                  {opt.arabic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div className="el-speed-result">
            <div className="el-speed-result-card">
              <div className="el-speed-result-icon">
                {score >= 8 ? '🏆' : score >= 5 ? '🌟' : '💪'}
              </div>
              <h2 className="el-speed-result-title">
                {score >= 8 ? 'رائع! أنت بطل السرعة!' : score >= 5 ? 'ممتاز! مستوى عالٍ!' : 'جيد! كرر أكثر!'}
              </h2>

              <div className="el-speed-result-stats">
                <div className="el-speed-result-stat">
                  <div className="el-speed-stat-num">{score}/10</div>
                  <div className="el-speed-stat-label">النتيجة</div>
                </div>
                <div className="el-speed-result-stat">
                  <div className="el-speed-stat-num" style={{ color: score > bestScore ? '#10b981' : 'inherit' }}>
                    {Math.max(score, bestScore)}
                  </div>
                  <div className="el-speed-stat-label">{score > bestScore ? '🎉 رقم قياسي جديد!' : 'أفضل نتيجة'}</div>
                </div>
              </div>

              {/* Per-word results */}
              <div className="el-speed-word-results">
                {results.map((r, i) => (
                  <div key={i} className={`el-speed-word-result ${r.correct ? 'correct' : 'wrong'}`}>
                    <span className="el-swr-word">{r.word.word}</span>
                    <span className="el-swr-arrow">{r.correct ? '✓' : '✗'}</span>
                    <span className="el-swr-arabic">{r.word.arabic}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="el-nav-btn" onClick={startCountdown}>🔄 مرة ثانية</button>
                <button className="el-nav-btn primary" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}>← العودة</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
