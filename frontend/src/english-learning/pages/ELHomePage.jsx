import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LEVELS, getDay } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

const EL = '/english-learning'

/* ─── Word of the Day Splash ─── */
function WordOfDaySplash({ onClose }) {
  const TODAY_KEY = 'el_wotd_' + new Date().toISOString().slice(0, 10)
  const seen = localStorage.getItem(TODAY_KEY)
  const [visible, setVisible] = useState(!seen)

  const wordPools = [
    { word: 'Perseverance', ipa: '/ˌpɜːrsɪˈvɪərəns/', arabic: 'المثابرة', example: 'Success requires perseverance and hard work.', exampleAr: 'النجاح يحتاج مثابرة وعمل جاد.' },
    { word: 'Eloquent', ipa: '/ˈeləkwənt/', arabic: 'فصيح / بليغ', example: 'She gave an eloquent speech.', exampleAr: 'ألقت خطاباً بليغاً.' },
    { word: 'Ambiguous', ipa: '/æmˈbɪɡjuəs/', arabic: 'غامض / ملتبس', example: 'The contract clause was ambiguous.', exampleAr: 'بند العقد كان غامضاً.' },
    { word: 'Meticulous', ipa: '/məˈtɪkjuləs/', arabic: 'دقيق / شديد الاهتمام', example: 'She was meticulous in her research.', exampleAr: 'كانت دقيقة في بحثها.' },
    { word: 'Resilient', ipa: '/rɪˈzɪliənt/', arabic: 'مرن / صامد', example: 'Children are remarkably resilient.', exampleAr: 'الأطفال مرونتهم مذهلة.' },
    { word: 'Pragmatic', ipa: '/præɡˈmætɪk/', arabic: 'براغماتي / عملي', example: 'We need a pragmatic approach.', exampleAr: 'نحتاج نهجاً عملياً.' },
    { word: 'Ephemeral', ipa: '/ɪˈfemərəl/', arabic: 'عابر / زائل', example: 'Fame can be ephemeral.', exampleAr: 'الشهرة يمكن أن تكون عابرة.' },
  ]

  const todayWord = wordPools[new Date().getDate() % wordPools.length]

  const dismiss = () => {
    localStorage.setItem(TODAY_KEY, '1')
    setVisible(false)
    onClose()
  }

  if (!visible) return null

  return (
    <div className="el-wotd-backdrop" onClick={dismiss}>
      <div className="el-wotd-card" onClick={e => e.stopPropagation()}>
        <div className="el-wotd-tag">☀️ كلمة اليوم</div>
        <div className="el-wotd-word">{todayWord.word}</div>
        <div className="el-wotd-ipa">{todayWord.ipa}</div>
        <div className="el-wotd-arabic">{todayWord.arabic}</div>
        <div className="el-wotd-example">"{todayWord.example}"</div>
        <div className="el-wotd-example-ar">{todayWord.exampleAr}</div>
        <button
          className="el-wotd-tts"
          onClick={() => {
            window.speechSynthesis?.cancel()
            const u = new SpeechSynthesisUtterance(todayWord.word)
            u.lang = 'en-US'; u.rate = 0.8
            window.speechSynthesis?.speak(u)
          }}
        >
          🔊 استمع
        </button>
        <button className="el-nav-btn primary" style={{ marginTop: 16, width: '100%' }} onClick={dismiss}>
          حفظت ✓
        </button>
      </div>
    </div>
  )
}

/* ─── Streak Calendar ─── */
function StreakCalendar({ streak }) {
  const history = streak?.history || []
  const today = new Date().toISOString().slice(0, 10)

  // Build last 35 days grid
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (34 - i))
    const ds = d.toISOString().slice(0, 10)
    return { date: ds, studied: history.includes(ds), isToday: ds === today }
  })

  const weekLabels = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

  return (
    <div className="el-streak-section">
      <div className="el-streak-header">
        <div className="el-streak-info">
          <span className="el-streak-fire">🔥</span>
          <span className="el-streak-count">{streak?.current || 0}</span>
          <span className="el-streak-label">يوم متتالي</span>
        </div>
        <div className="el-streak-best">
          أفضل: {streak?.longest || 0} يوم
        </div>
      </div>
      <div className="el-streak-grid">
        {weekLabels.map(l => <div key={l} className="el-streak-week-label">{l}</div>)}
        {days.map((d, i) => (
          <div
            key={i}
            className={`el-streak-dot${d.studied ? ' studied' : ''}${d.isToday ? ' today' : ''}`}
            title={d.date}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Daily Challenge ─── */
function DailyChallenge({ onClose }) {
  const DAY = new Date().getDay()
  const challenges = [
    { icon: '📝', title: 'تحدي الكتابة', desc: 'اكتب 3 جمل تصف يومك بالإنجليزي', action: 'ابدأ التحدي' },
    { icon: '🎯', title: 'تحدي المفردات', desc: 'استخدم كلمة جديدة في محادثة حقيقية اليوم', action: 'ابدأ التحدي' },
    { icon: '🎧', title: 'تحدي الاستماع', desc: 'استمع لـ 5 دقائق بالإنجليزية (podcast/YouTube)', action: 'اقترح محتوى' },
    { icon: '🗣️', title: 'تحدي الكلام', desc: 'تحدث بالإنجليزية مع AI 10 جولات متواصلة', action: 'ابدأ المحادثة' },
    { icon: '📖', title: 'تحدي القراءة', desc: 'اقرأ فقرة إنجليزية وترجمها بكلامك', action: 'ابدأ التحدي' },
    { icon: '⚡', title: 'تحدي السرعة', desc: 'أنجز Speed Round بنتيجة 7/10 أو أعلى', action: 'العب الآن' },
    { icon: '🏋️', title: 'يوم المراجعة', desc: 'راجع أصعب 5 كلمات في قائمة الكلمات الصعبة', action: 'راجع الآن' },
  ]
  const today = challenges[DAY]

  const DONE_KEY = 'el_challenge_' + new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState(!!localStorage.getItem(DONE_KEY))

  const markDone = () => {
    localStorage.setItem(DONE_KEY, '1')
    setDone(true)
  }

  return (
    <div className="el-challenge-card">
      <div className="el-challenge-icon">{today.icon}</div>
      <div className="el-challenge-body">
        <div className="el-challenge-tag">تحدي اليوم ⚡</div>
        <div className="el-challenge-title">{today.title}</div>
        <div className="el-challenge-desc">{today.desc}</div>
      </div>
      {done
        ? <div className="el-challenge-done">✓ مكتمل!</div>
        : <button className="el-challenge-btn" onClick={markDone}>{today.action}</button>
      }
    </div>
  )
}

/* ─── Pop Quiz ─── */
function PopQuiz({ onClose }) {
  const { hardWords } = useProgress()
  const [q, setQ] = useState(null)
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    const pool = hardWords.length >= 4 ? hardWords : []
    if (pool.length < 4) return
    const shuffle = arr => [...arr].sort(() => Math.random() - .5)
    const shuffled = shuffle(pool)
    const correct = shuffled[0]
    const options = shuffle([correct, ...shuffled.slice(1, 4)])
    setQ({ correct, options })
  }, [hardWords])

  if (!q) return null

  const answer = (opt) => setChosen(opt.word)
  const isCorrect = chosen === q.correct.word

  return (
    <div className="el-quiz-backdrop">
      <div className="el-quiz-modal">
        <div className="el-quiz-badge">⚡ اختبار مفاجئ!</div>
        <div className="el-quiz-q">ما معنى هذه الكلمة؟</div>
        <div className="el-quiz-word">{q.correct.word}</div>
        <div className="el-quiz-ipa">{q.correct.ipa}</div>
        <div className="el-quiz-options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={'el-quiz-opt' + (chosen ? (opt.word === q.correct.word ? ' correct' : opt.word === chosen ? ' wrong' : ' dim') : '')}
              onClick={() => !chosen && answer(opt)}
            >
              {opt.arabic}
            </button>
          ))}
        </div>
        {chosen && (
          <div className={`el-quiz-result ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? '🎉 ممتاز! إجابتك صحيحة.' : `❌ الصواب: ${q.correct.arabic}`}
            <button className="el-nav-btn primary" style={{ marginTop: 12 }} onClick={onClose}>متابعة →</button>
          </div>
        )}
        {!chosen && <button className="el-quiz-skip" onClick={onClose}>تخطّ</button>}
      </div>
    </div>
  )
}

/* ─── Main Home Page ─── */
export default function ELHomePage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const progress = useProgress()
  const online = useOnlineStatus()
  const [showQuiz, setShowQuiz] = useState(() => Math.random() < 0.25)
  const [showWotd, setShowWotd] = useState(true)
  const dueCount = progress.dueWords?.().length || 0

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      {!online && <div className="el-offline-bar">⚠️ أنتِ غير متصلة بالإنترنت — بعض الميزات لن تعمل</div>}
      {/* Word of the Day splash (shows once per day) */}
      {showWotd && <WordOfDaySplash onClose={() => setShowWotd(false)} />}

      {/* Pop quiz (25% chance if has hard words) */}
      {showQuiz && !showWotd && progress.hardWords?.length >= 4 && (
        <PopQuiz onClose={() => setShowQuiz(false)} />
      )}

      <div className="el-page">
        <header className="el-top-bar">
          <div className="el-top-bar-brand">
            <button className="el-icon-btn" onClick={() => navigate('/')} title="رجوع">←</button>
            <span className="el-brand-dot" />
            <span className="el-brand-name">English with Noura</span>
          </div>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="el-home-main">

          {/* Quick access strips */}
          <div className="el-quick-strips">
            {progress.hardWords?.length > 0 && (
              <button className="el-ledger-strip" onClick={() => navigate(`${EL}/ledger`)}>
                ⭐ كلماتي الصعبة ({progress.hardWords.length}) ←
              </button>
            )}
            {Object.keys(progress.errors || {}).length > 0 && (
              <button className="el-ledger-strip errors" onClick={() => navigate(`${EL}/errors`)}>
                📊 لوحة الأخطاء ←
              </button>
            )}
          </div>

          {/* Streak Calendar */}
          <StreakCalendar streak={progress.streak} />

          {/* XP + Badge summary */}
          <div className="el-home-stats-row">
            <div className="el-home-stat" onClick={() => navigate(`${EL}/progress`)}>
              <span className="el-home-stat-icon">⭐</span>
              <span className="el-home-stat-num">{progress.xpData?.total || 0}</span>
              <span className="el-home-stat-label">XP</span>
            </div>
            <div className="el-home-stat" onClick={() => navigate(`${EL}/progress`)}>
              <span className="el-home-stat-icon">🏅</span>
              <span className="el-home-stat-num">{progress.getEarnedBadges().length}</span>
              <span className="el-home-stat-label">أوسمة</span>
            </div>
            <div className="el-home-stat" onClick={() => navigate(`${EL}/notebook`)}>
              <span className="el-home-stat-icon">📓</span>
              <span className="el-home-stat-num">{Object.keys(progress.notebook || {}).length}</span>
              <span className="el-home-stat-label">ملاحظات</span>
            </div>
          </div>

          {/* Daily Challenge */}
          <DailyChallenge />

          {/* Tool buttons */}
          <div className="el-home-tools">
            <button className="el-tool-btn" onClick={() => navigate(`${EL}/progress`)}>
              <span className="el-tool-icon">📊</span>
              <span>تقدمي</span>
            </button>
            <button className="el-tool-btn" onClick={() => navigate(`${EL}/notebook`)}>
              <span className="el-tool-icon">📓</span>
              <span>مذكرتي</span>
            </button>
            <button className="el-tool-btn" onClick={() => navigate(`${EL}/ipa`)}>
              <span className="el-tool-icon">🔤</span>
              <span>دليل IPA</span>
            </button>
            <button className="el-tool-btn" onClick={() => navigate(`${EL}/ledger`)}>
              <span className="el-tool-icon">⭐</span>
              <span>كلمات صعبة</span>
            </button>
            <div className="el-tool-btn-wrap">
              <button className="el-tool-btn" onClick={() => navigate(`${EL}/review`)}>
                <span className="el-tool-icon">🔁</span>
                <span>مراجعة</span>
              </button>
              {dueCount > 0 && <span className="el-review-badge">{dueCount}</span>}
            </div>
          </div>

          {/* Hero */}
          <div className="el-hero-block">
            <div className="el-hero-badge">🎓 مجاناً تماماً</div>
            <h1 className="el-hero-title">
              تعلّم الإنجليزية<br />
              <span className="el-hero-accent">خطوة بخطوة</span>
            </h1>
            <p className="el-hero-sub">
              من الصفر المطلق إلى الطلاقة — 6 مستويات × 30 يوماً × 6 مهارات يومياً
            </p>
          </div>

          {/* Levels grid */}
          <div className="el-levels-grid">
            {LEVELS.map(lvl => {
              const lp = progress.levelProgress(lvl.id, lvl.totalDays)
              return (
                <button
                  key={lvl.id}
                  className={'el-level-card' + (lvl.available ? '' : ' locked')}
                  onClick={() => lvl.available && navigate(`${EL}/level/${lvl.id}`)}
                  disabled={!lvl.available}
                >
                  <div className="el-level-badge">{lvl.id}</div>
                  <div>
                    <div className="el-level-name">{lvl.name}</div>
                    <div className="el-level-name-ar">{lvl.nameAr}</div>
                    <div className="el-level-desc">{lvl.description}</div>
                  </div>
                  {lvl.available ? (
                    <div className="el-level-progress-wrap">
                      <div className="el-level-prog-bar">
                        <div className="el-level-prog-fill" style={{ width: lp.pct + '%' }} />
                      </div>
                      <span className="el-level-prog-pct">{lp.pct}%</span>
                    </div>
                  ) : (
                    <div className="el-level-lock">🔒 قريباً</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* How it works */}
          <div className="el-how-it-works">
            <h2 className="el-section-title">كيف يعمل النظام؟</h2>
            <div className="el-how-grid">
              {[
                { icon: '🔤', title: 'مفردات + نطق', desc: 'كل يوم 20 كلمة مع IPA ودليل النطق العربي' },
                { icon: '📐', title: 'قواعد تفاعلية', desc: 'شرح بالعربية + تمارين تصحّح فيها بنفسك' },
                { icon: '📖', title: 'قراءة مفككة', desc: 'نص قصير مع تحليل كلمة بكلمة وترجمة' },
                { icon: '🎧', title: 'استماع وإملاء', desc: 'حوارات واقعية مع تمارين فراغات تفاعلية' },
                { icon: '🎙️', title: 'شادونج YouTube', desc: 'تقنية الشادونج مع فيديو حقيقي للتدريب' },
                { icon: '✍️', title: 'كتابة + AI رفيق', desc: 'تحديات كتابة + محادثة حية مع AI مخصص' },
              ].map(h => (
                <div key={h.icon} className="el-how-card">
                  <div className="el-how-icon">{h.icon}</div>
                  <div className="el-how-title">{h.title}</div>
                  <div className="el-how-desc">{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
