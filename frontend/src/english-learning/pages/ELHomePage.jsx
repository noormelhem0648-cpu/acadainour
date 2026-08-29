import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LEVELS, getDay } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import { speak } from '../utils/tts'
import '../EL.css'

function usePWAInstall() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem('el_pwa_dismissed')
  )
  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e) }
    const onInstalled = () => { setInstalled(true); setPrompt(null) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  const install = async () => {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setPrompt(null)
    }
  }
  const dismiss = () => {
    localStorage.setItem('el_pwa_dismissed', '1')
    setDismissed(true)
  }
  // Show banner if: not installed, not dismissed, and not already standalone
  const showBanner = !installed && !dismissed
  return { showBanner, hasNativePrompt: !!prompt, install, dismiss }
}

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
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <button className="el-wotd-tts" onClick={() => speak(todayWord.word, 'en-US')} title="American English">🇺🇸 US</button>
          <button className="el-wotd-tts" onClick={() => speak(todayWord.word, 'en-GB')} title="British English">🇬🇧 UK</button>
        </div>
        <button className="el-nav-btn primary" style={{ marginTop: 16, width: '100%' }} onClick={dismiss}>
          حفظت ✓
        </button>
      </div>
    </div>
  )
}

/* ─── Streak Calendar (7 days) ─── */
function StreakCalendar({ streak, onClick }) {
  const history = streak?.history || []
  const today = new Date().toISOString().slice(0, 10)
  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  // Build last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().slice(0, 10)
    return { date: ds, studied: history.includes(ds), isToday: ds === today, dayName: DAY_NAMES[d.getDay()] }
  })

  return (
    <div className="el-streak-section" onClick={onClick} role="button" tabIndex={0} title="عرض تقدّمي الكامل">
      <div className="el-streak-header">
        <div className="el-streak-info">
          <span className="el-streak-fire">🔥</span>
          <span className="el-streak-count">{streak?.current || 0}</span>
          <span className="el-streak-label">يوم متتالي</span>
        </div>
        <div className="el-streak-best">أفضل: {streak?.longest || 0} يوم</div>
      </div>
      <div className="el-streak-7">
        {days.map((d, i) => (
          <div key={i} className={`el-streak-7-day${d.isToday ? ' today' : ''}`}>
            <div className="el-streak-7-label">{d.dayName}</div>
            <div className={`el-streak-7-dot${d.studied ? ' studied' : ''}${d.isToday ? ' today' : ''}`}>
              {d.studied ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Pop Quiz ─── */
function PopQuiz({ onClose, hardWords }) {
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
  const { showBanner, hasNativePrompt, install, dismiss } = usePWAInstall()
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const [showQuiz, setShowQuiz] = useState(() => Math.random() < 0.25)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showWotd, setShowWotd] = useState(true)
  const dueCount = progress.dueWords?.().length || 0

  const socialUnread = (() => {
    try {
      const obj = JSON.parse(localStorage.getItem('el_social_unread') || '{}')
      return Object.values(obj).reduce((s, n) => s + n, 0)
    } catch { return 0 }
  })()

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      {!online && <div className="el-offline-bar">⚠️ أنتِ غير متصلة بالإنترنت — بعض الميزات لن تعمل</div>}
      {/* Word of the Day splash (shows once per day) */}
      {showWotd && <WordOfDaySplash onClose={() => setShowWotd(false)} />}

      {/* Pop quiz (25% chance if has hard words) */}
      {showQuiz && !showWotd && progress.hardWords?.length >= 4 && (
        <PopQuiz onClose={() => setShowQuiz(false)} hardWords={progress.hardWords} />
      )}

      <div className="el-page">
        <header className="el-top-bar">
          <div className="el-top-bar-brand">
            <button className="el-icon-btn" onClick={() => navigate('/')} title="رجوع">←</button>
            <span className="el-brand-dot" />
            <span className="el-brand-name">English with Noura</span>
          </div>
        </header>

        <main className="el-home-main">

          {/* 1 ── Hero */}
          <div className="el-hero-block">
            <h1 className="el-hero-title">
              تعلّم الإنجليزية — <span className="el-hero-accent">خطوة بخطوة</span>
            </h1>
            <p className="el-hero-sub">
              من الصفر المطلق إلى الطلاقة — 6 مستويات × 30 يوماً × 6 مهارات يومياً
            </p>
          </div>

          {/* 2 ── Streak (7 days, full names) — click opens full progress */}
          <StreakCalendar streak={progress.streak} onClick={() => navigate(`${EL}/progress`)} />

          {/* 3 ── Community + Hard words (2 big cards) */}
          <div className="el-home-feature-cards">
            <button className="el-feature-card community" onClick={() => navigate(`${EL}/social`)} style={{ position: 'relative' }}>
              <span className="el-feature-card-icon">👥</span>
              <div>
                <div className="el-feature-card-title">
                  المجتمع
                  {socialUnread > 0 && <span className="el-feature-card-badge">{socialUnread}</span>}
                </div>
                <div className="el-feature-card-sub">تواصل مع الطلاب وأنشئ مجموعات دراسة</div>
              </div>
            </button>
            <button className="el-feature-card hardwords" onClick={() => navigate(`${EL}/ledger`)}>
              <span className="el-feature-card-icon">⭐</span>
              <div>
                <div className="el-feature-card-title">
                  كلماتي الصعبة
                  {progress.hardWords?.length > 0 && (
                    <span className="el-feature-card-badge">{progress.hardWords.length}</span>
                  )}
                </div>
                <div className="el-feature-card-sub">
                  {dueCount > 0 ? `${dueCount} كلمة للمراجعة اليوم` : 'قائمة الكلمات المحفوظة'}
                </div>
              </div>
            </button>
            <button className="el-feature-card ipa" onClick={() => navigate(`${EL}/ipa`)}>
              <span className="el-feature-card-icon">🔤</span>
              <div>
                <div className="el-feature-card-title">دليل IPA</div>
                <div className="el-feature-card-sub">دليل النطق الصوتي الكامل</div>
              </div>
            </button>
          </div>

          {/* 4 ── Levels grid */}
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


          {/* 8 ── Quick strips (errors dashboard) */}
          <div className="el-quick-strips">
            {Object.keys(progress.errors || {}).length > 0 && (
              <button className="el-ledger-strip errors" onClick={() => navigate(`${EL}/errors`)}>
                📊 لوحة الأخطاء ←
              </button>
            )}
          </div>

          {/* 9 ── PWA Install Banner */}
          {showBanner && (
            <div className="el-install-banner">
              <span className="el-install-icon">📲</span>
              <div className="el-install-text">
                <div className="el-install-title">ثبّت التطبيق على هاتفك</div>
                {isIOS
                  ? <div className="el-install-sub">اضغط زر المشاركة ← "Add to Home Screen"</div>
                  : <div className="el-install-sub">يعمل بدون إنترنت — مجاناً تماماً</div>
                }
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {hasNativePrompt && !isIOS && (
                  <button className="el-install-btn" onClick={install}>تثبيت</button>
                )}
                <button className="el-install-dismiss" onClick={dismiss}>✕</button>
              </div>
            </div>
          )}

          {/* 10 ── How it works (collapsible) */}
          <div className="el-how-it-works">
            <button className="el-how-toggle" onClick={() => setShowHowItWorks(o => !o)}>
              <h2 className="el-section-title" style={{ margin: 0 }}>كيف يعمل النظام؟</h2>
              <span className={`el-how-chevron${showHowItWorks ? ' open' : ''}`}>▾</span>
            </button>
            {showHowItWorks && (
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
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
