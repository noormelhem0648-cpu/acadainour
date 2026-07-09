import { useNavigate, useParams } from 'react-router-dom'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getDay, COMPONENTS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'
const BACKEND = 'https://acadai-backend-avvo.onrender.com'

function speak(text, onStart, onEnd) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.85
  if (onStart) u.onstart = onStart
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
}

/* ─── Avatar expressions ─── */
const AVATAR_STATES = {
  idle:      { emoji: '🤖', label: 'جاهز', color: '#c9858a' },
  thinking:  { emoji: '🤔', label: 'يفكر...', color: '#b45309' },
  speaking:  { emoji: '🗣️', label: 'يتحدث', color: '#16a34a' },
  happy:     { emoji: '😊', label: 'ممتاز!', color: '#16a34a' },
  correcting:{ emoji: '✏️', label: 'يُصحّح', color: '#c9858a' },
  listening: { emoji: '👂', label: 'يستمع', color: '#6366f1' },
}

/* ─── Study Buddy Panel ─── */
function StudyBuddy({ companionPrompt, dayContext, avatarState, setAvatarState, messages, setMessages, inputText, setInputText }) {
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setLoading(true)
    setAvatarState('thinking')

    try {
      const systemPrompt = companionPrompt + '\n\nسياق الدرس: ' + dayContext
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          system: systemPrompt
        })
      })
      const data = await res.json()
      const reply = data.response || data.message || 'عذراً، لم أتمكن من الاستجابة.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setAvatarState('speaking')
      speak(reply, null, () => setAvatarState('idle'))
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.' }])
      setAvatarState('idle')
    } finally {
      setLoading(false)
    }
  }, [messages, companionPrompt, dayContext, setMessages, setAvatarState, setInputText])

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('المتصفح لا يدعم التعرف على الصوت'); return }
    if (isListening) { recognitionRef.current?.stop(); return }
    const r = new SpeechRecognition()
    r.lang = 'en-US'
    r.interimResults = false
    r.onstart = () => { setIsListening(true); setAvatarState('listening') }
    r.onresult = e => {
      const t = e.results[0][0].transcript
      setInputText(t)
      setIsListening(false)
      setAvatarState('idle')
      sendMessage(t)
    }
    r.onerror = () => { setIsListening(false); setAvatarState('idle') }
    r.onend = () => { setIsListening(false); setAvatarState('idle') }
    recognitionRef.current = r
    r.start()
  }

  const av = AVATAR_STATES[avatarState] || AVATAR_STATES.idle

  return (
    <div className="el-buddy-panel">
      <div className="el-buddy-avatar-wrap">
        <div className="el-buddy-avatar" style={{ borderColor: av.color }}>
          <span className="el-buddy-emoji">{av.emoji}</span>
          {avatarState === 'thinking' && <div className="el-buddy-pulse" />}
        </div>
        <div className="el-buddy-label" style={{ color: av.color }}>{av.label}</div>
        <div className="el-buddy-name">Noura AI</div>
      </div>

      <div className="el-buddy-messages">
        {messages.length === 0 && (
          <div className="el-buddy-welcome">
            <p>مرحباً! أنا هنا لمساعدتك في درس اليوم.</p>
            <p>اكتب أو تحدث إليّ بالإنجليزية وسأُصحّح وأُرشدك.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`el-buddy-msg ${m.role}`}>
            {m.role === 'assistant' && (
              <button className="el-speak-btn" onClick={() => speak(m.content)} style={{ float: 'left', marginLeft: 4 }}>🔊</button>
            )}
            <span className="el-buddy-msg-text">{m.content}</span>
          </div>
        ))}
        {loading && (
          <div className="el-buddy-msg assistant">
            <span className="el-buddy-typing">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="el-buddy-input-row">
        <input
          className="el-buddy-input"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(inputText)}
          placeholder="اكتب بالإنجليزية أو اضغط 🎤"
          disabled={loading}
        />
        <button
          className={'el-buddy-mic' + (isListening ? ' listening' : '')}
          onClick={startVoice}
          title="تحدث"
        >
          🎤
        </button>
        <button
          className="el-buddy-send"
          onClick={() => sendMessage(inputText)}
          disabled={loading || !inputText.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

export default function ELComponentPage({ darkMode, setDarkMode }) {
  const { levelId, dayId, componentId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const day = getDay(levelId, Number(dayId))
  const compIndex = COMPONENTS.findIndex(c => c.id === componentId)
  const comp = COMPONENTS[compIndex]

  const [buddyMessages, setBuddyMessages] = useState([])
  const [buddyInput, setBuddyInput] = useState('')
  const [avatarState, setAvatarState] = useState('idle')
  const [buddyOpen, setBuddyOpen] = useState(true)

  if (!day || !comp) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Not found.</p></div></div>

  const progressKey = `${levelId}-${dayId}-${componentId}`
  const done = progress.isDone(progressKey)

  const handleDone = () => {
    progress.markDone(progressKey)
    const next = COMPONENTS[compIndex + 1]
    if (next) navigate(`${EL}/level/${levelId}/day/${dayId}/${next.id}`)
    else navigate(`${EL}/level/${levelId}/day/${dayId}`)
  }

  const dayContext = `Level ${levelId}, Day ${dayId}: ${day.title}. Component: ${comp.labelEn}.`

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page el-comp-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}>←</button>
          <span className="el-top-bar-title">{comp.icon} {comp.labelEn}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={'el-icon-btn' + (buddyOpen ? ' active' : '')} onClick={() => setBuddyOpen(b => !b)} title="Study Buddy">🤖</button>
            <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <div className="el-comp-progress-strip">
          {COMPONENTS.map((c, i) => (
            <div
              key={c.id}
              className={'el-strip-dot' + (i === compIndex ? ' active' : progress.isDone(`${levelId}-${dayId}-${c.id}`) ? ' done' : '')}
              onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/${c.id}`)}
              title={c.labelEn}
            />
          ))}
        </div>

        <div className={'el-study-room' + (buddyOpen ? ' buddy-open' : '')}>
          <div className="el-content-panel">
            <div className="el-comp-body">
              {componentId === 'vocab'     && <VocabComp day={day} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
              {componentId === 'grammar'   && <GrammarComp day={day} setBuddyMessages={setBuddyMessages} setAvatarState={setAvatarState} />}
              {componentId === 'reading'   && <ReadingComp day={day} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
              {componentId === 'listening' && <ListeningComp day={day} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
              {componentId === 'shadowing' && <ShadowingComp day={day} />}
              {componentId === 'writing'   && <WritingComp day={day} levelId={levelId} dayId={dayId} navigate={navigate} setBuddyMessages={setBuddyMessages} setBuddyInput={setBuddyInput} setAvatarState={setAvatarState} />}
            </div>

            <div className="el-comp-footer">
              {compIndex > 0 && (
                <button className="el-nav-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/${COMPONENTS[compIndex - 1].id}`)}>
                  ← السابق
                </button>
              )}
              <button className={'el-nav-btn primary' + (done ? ' already-done' : '')} onClick={handleDone}>
                {done ? '✓ مكتمل' : compIndex < COMPONENTS.length - 1 ? 'أكملت ← التالي' : 'أكملت اليوم ✓'}
              </button>
            </div>
          </div>

          {buddyOpen && (
            <StudyBuddy
              companionPrompt={day.writing?.companionPrompt || 'أنت مدرس لغة مساعد.'}
              dayContext={dayContext}
              avatarState={avatarState}
              setAvatarState={setAvatarState}
              messages={buddyMessages}
              setMessages={setBuddyMessages}
              inputText={buddyInput}
              setInputText={setBuddyInput}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Vocabulary ─── */
function VocabComp({ day }) {
  const { vocabulary: v } = day

  return (
    <div className="el-section">
      <div className="el-section-intro">{v.intro}</div>

      <div className="el-vocab-table-wrap">
        <table className="el-vocab-table">
          <thead>
            <tr>
              <th>الكلمة</th>
              <th>🔊</th>
              <th>IPA</th>
              <th>المعنى</th>
              <th>النطق بالعربي</th>
              <th>مثال</th>
              <th>الترجمة</th>
            </tr>
          </thead>
          <tbody>
            {v.words.map((w, i) => (
              <tr key={i}>
                <td><strong className="el-word-highlight">{w.word}</strong></td>
                <td>
                  <button className="el-speak-btn" onClick={() => speak(w.word)} title="استمع للكلمة">🔊</button>
                </td>
                <td><span className="el-ipa">{w.ipa}</span></td>
                <td>{w.arabic}</td>
                <td><span className="el-phonetic">{w.phonetic}</span></td>
                <td>
                  <em>{w.example}</em>
                  <button className="el-speak-btn" onClick={() => speak(w.example)} title="استمع للجملة" style={{ marginRight: 4 }}>🔊</button>
                </td>
                <td className="el-text-muted">{w.exampleAr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="el-challenge-box">
        <div className="el-challenge-title">🎙️ تحدي المحاكاة الصوتية السريعة</div>
        <p className="el-challenge-desc">اضغط على الكلمة لتسمعها، ثم كررها بصوت عالٍ 3 مرات:</p>
        <div className="el-mimic-words">
          {v.mimicChallenge.map((w, i) => (
            <span key={i} className="el-mimic-word" onClick={() => speak(w)}>
              🔊 {w}
            </span>
          ))}
        </div>
        <div className="el-mimic-tip">💡 {v.mimicTip}</div>
      </div>
    </div>
  )
}

/* ─── Role-play Mode ─── */
const ROLEPLAY_SCENARIOS = [
  { icon: '🍽️', title: 'At a Restaurant', prompt: 'You are a waiter at an upscale restaurant. Greet the customer, take their order, and respond naturally. Use today\'s grammar in your responses.' },
  { icon: '💼', title: 'Job Interview', prompt: 'You are a professional interviewer. Ask the candidate questions about their experience and skills. Use formal language and grammar structures from today\'s lesson.' },
  { icon: '🏥', title: 'Doctor\'s Appointment', prompt: 'You are a friendly doctor. Ask the patient about their symptoms, give advice, and use polite formal language throughout.' },
  { icon: '✈️', title: 'Airport Check-in', prompt: 'You are an airline check-in agent. Help the passenger with their booking, ask about luggage, and handle a minor issue politely.' },
  { icon: '📚', title: 'Academic Discussion', prompt: 'You are a professor holding a tutorial. Discuss ideas with the student, challenge their thinking, and use academic language from today\'s lesson.' },
]

function RolePlayMode({ day, setBuddyMessages, setAvatarState }) {
  const [active, setActive] = useState(false)
  const [scenario, setScenario] = useState(null)
  const [exchange, setExchange] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [exchange])

  const startScenario = async (sc) => {
    setScenario(sc)
    setExchange([])
    setActive(true)
    setLoading(true)
    setAvatarState('speaking')
    try {
      const systemPrompt = `${sc.prompt}\n\nAlso naturally incorporate grammar patterns from today's lesson: ${day.grammar?.patterns?.map(p => p.name).join(', ')}. Keep responses short (2-3 sentences). After each exchange, add one brief tip in Arabic about the grammar used, prefixed with "💡 نصيحة:".`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Start the scenario. Say your opening line.' }],
          system: systemPrompt
        })
      })
      const data = await res.json()
      const reply = data.response || data.message || 'Hello! Ready to begin?'
      setExchange([{ role: 'buddy', text: reply }])
      speak(reply, null, () => setAvatarState('listening'))
    } catch { setAvatarState('idle') }
    finally { setLoading(false) }
  }

  const sendLine = async () => {
    if (!input.trim() || loading) return
    const userLine = input
    setInput('')
    const newEx = [...exchange, { role: 'user', text: userLine }]
    setExchange(newEx)
    setLoading(true)
    setAvatarState('thinking')
    try {
      const systemPrompt = `${scenario.prompt}\n\nGrammar from today's lesson: ${day.grammar?.patterns?.map(p => p.name).join(', ')}. Keep responses to 2-3 sentences. After each reply add a one-line tip prefixed "💡 نصيحة:" about grammar or vocabulary used.`
      const msgs = newEx.map(e => ({ role: e.role === 'buddy' ? 'assistant' : 'user', content: e.text }))
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, system: systemPrompt })
      })
      const data = await res.json()
      const reply = data.response || ''
      setExchange(prev => [...prev, { role: 'buddy', text: reply }])
      speak(reply, null, () => setAvatarState('listening'))
    } catch { setAvatarState('idle') }
    finally { setLoading(false) }
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('المتصفح لا يدعم التعرف على الصوت'); return }
    if (listening) { recognitionRef.current?.stop(); return }
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = false
    r.onstart = () => { setListening(true); setAvatarState('listening') }
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false) }
    r.onerror = () => { setListening(false); setAvatarState('idle') }
    r.onend = () => { setListening(false) }
    recognitionRef.current = r
    r.start()
  }

  if (!active) {
    return (
      <div className="el-roleplay-section">
        <div className="el-roleplay-title">🎭 وضع التمثيل اللغوي — Role-play</div>
        <div className="el-roleplay-desc">اختر سيناريو وتحدّث مع المساعد كأنه شخص حقيقي. يستخدم قواعد درس اليوم ويُصحّح نطقك وتراكيبك.</div>
        <div className="el-roleplay-grid">
          {ROLEPLAY_SCENARIOS.map(sc => (
            <button key={sc.title} className="el-roleplay-card" onClick={() => startScenario(sc)}>
              <div className="el-roleplay-icon">{sc.icon}</div>
              <div className="el-roleplay-name">{sc.title}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="el-roleplay-active">
      <div className="el-roleplay-header">
        <span>{scenario.icon} {scenario.title}</span>
        <button className="el-nav-btn" style={{ padding: '4px 12px', fontSize: '.8rem' }} onClick={() => setActive(false)}>✕ إنهاء</button>
      </div>
      <div className="el-roleplay-exchange">
        {exchange.map((e, i) => (
          <div key={i} className={`el-roleplay-line ${e.role}`}>
            {e.role === 'buddy' && <button className="el-speak-btn" onClick={() => speak(e.text)} style={{ marginLeft: 4 }}>🔊</button>}
            <span className="el-roleplay-text">{e.text}</span>
          </div>
        ))}
        {loading && <div className="el-roleplay-line buddy"><span className="el-buddy-typing"><span/><span/><span/></span></div>}
        <div ref={endRef} />
      </div>
      <div className="el-roleplay-input-row">
        <input
          className="el-buddy-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendLine()}
          placeholder="ردّك بالإنجليزية..."
          disabled={loading}
        />
        <button className={'el-buddy-mic' + (listening ? ' listening' : '')} onClick={startVoice}>🎤</button>
        <button className="el-buddy-send" onClick={sendLine} disabled={loading || !input.trim()}>↑</button>
      </div>
    </div>
  )
}

/* ─── Grammar ─── */
function GrammarComp({ day, setBuddyMessages, setAvatarState }) {
  const [shown, setShown] = useState({})
  const [rolePlay, setRolePlay] = useState(false)
  const { grammar: g } = day

  return (
    <div className="el-section">
      {g.patterns.map((p, pi) => (
        <div key={pi} className="el-grammar-block">
          <h3 className="el-grammar-name">{p.name}</h3>
          <div className="el-grammar-explain">{p.explanation}</div>
          <div className="el-formula-box">
            <span className="el-formula-label">الصيغة:</span>
            <code className="el-formula">{p.formula}</code>
          </div>
          <div className="el-examples-list">
            {p.examples.map((ex, i) => (
              <div key={i} className="el-example-item">
                ✦ {ex}
                <button className="el-speak-btn" onClick={() => speak(ex)} style={{ marginRight: 6 }}>🔊</button>
              </div>
            ))}
          </div>
          <div className="el-exercises-title">📝 تمارين — صحّح بنفسك</div>
          {p.exercises.map((ex, i) => (
            <div key={i} className="el-exercise-card">
              <div className="el-exercise-q">❓ {ex.question}</div>
              <button
                className={'el-reveal-btn' + (shown[`${pi}-${i}`] ? ' revealed' : '')}
                onClick={() => setShown(s => ({ ...s, [`${pi}-${i}`]: !s[`${pi}-${i}`] }))}
              >
                {shown[`${pi}-${i}`] ? '🙈 إخفاء' : '👁️ الإجابة'}
              </button>
              {shown[`${pi}-${i}`] && (
                <div className="el-exercise-ans">✅ {ex.answer}</div>
              )}
            </div>
          ))}
        </div>
      ))}

      <button className="el-roleplay-toggle" onClick={() => setRolePlay(r => !r)}>
        🎭 {rolePlay ? 'إخفاء وضع التمثيل' : 'تدرّب بالتمثيل اللغوي'}
      </button>
      {rolePlay && <RolePlayMode day={day} setBuddyMessages={setBuddyMessages} setAvatarState={setAvatarState} />}
    </div>
  )
}

/* ─── Reading ─── */
function ReadingComp({ day }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const { reading: r } = day

  return (
    <div className="el-section">
      <div className="el-reading-passage">
        {r.passage}
        <button className="el-speak-btn" onClick={() => speak(r.passage)} style={{ marginRight: 8, verticalAlign: 'middle' }}>🔊 استمع</button>
      </div>

      <div className="el-breakdown-title">📖 تفكيك سطر بسطر</div>
      <div className="el-breakdown-list">
        {r.breakdown.map((b, i) => (
          <div key={i} className={'el-breakdown-item' + (activeIdx === i ? ' open' : '')}>
            <button className="el-breakdown-sentence" onClick={() => setActiveIdx(activeIdx === i ? null : i)}>
              <span>{b.sentence}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="el-speak-btn" onClick={e => { e.stopPropagation(); speak(b.sentence) }}>🔊</button>
                <span className="el-expand-icon">{activeIdx === i ? '▲' : '▼'}</span>
              </div>
            </button>
            {activeIdx === i && (
              <div className="el-breakdown-detail">
                <div className="el-word-chips">
                  {b.words.map((w, wi) => (
                    <span key={wi} className="el-word-chip" onClick={() => speak(w.w)} style={{ cursor: 'pointer' }}>
                      <span className="el-chip-en">{w.w}</span>
                      <span className="el-chip-ar">{w.ar}</span>
                    </span>
                  ))}
                </div>
                <div className="el-breakdown-meaning">💬 {b.meaning}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Listening ─── */
function ListeningComp({ day }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const { listening: l } = day

  const parts = l.fillText.split('_____')

  return (
    <div className="el-section">
      <div className="el-listening-context">🎬 السياق: {l.context}</div>

      <div className="el-full-text-box">
        <div className="el-full-text-label">النص الكامل:</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div className="el-full-text">{l.text}</div>
          <button className="el-speak-btn" onClick={() => speak(l.text)} title="استمع">🔊</button>
        </div>
      </div>

      <div className="el-dictation-title">✏️ امْلأ الفراغات</div>
      <div className="el-fill-blanks">
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < l.blanks.length && (
              <span className="el-blank-wrap">
                <input
                  className={'el-blank-input' + (checked
                    ? answers[i]?.toLowerCase().trim() === l.blanks[i].blank.toLowerCase()
                      ? ' correct' : ' wrong'
                    : '')}
                  value={answers[i] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                  disabled={checked}
                  placeholder="___"
                />
                {checked && (
                  <span className="el-blank-correct">({l.blanks[i].blank})</span>
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="el-dictation-btns">
        {!checked
          ? <button className="el-nav-btn primary" onClick={() => setChecked(true)}>تحقق من الإجابات</button>
          : <button className="el-nav-btn" onClick={() => { setAnswers({}); setChecked(false) }}>حاول مرة ثانية</button>
        }
      </div>
    </div>
  )
}

/* ─── Shadowing ─── */
function ShadowingComp({ day }) {
  const { shadowing: s } = day

  return (
    <div className="el-section">
      <div className="el-shadowing-chunk-box">
        <div className="el-chunk-label">القالب اللغوي اليوم</div>
        <div className="el-chunk-text">"{s.chunk}"</div>
        <button className="el-speak-btn" onClick={() => speak(s.chunk)} style={{ fontSize: '1.3rem', margin: '8px auto' }}>🔊 استمع</button>
        <div className="el-chunk-native">
          <span className="el-native-label">النطق الأصيل:</span>
          <span className="el-native-form">{s.nativeForm}</span>
        </div>
      </div>

      <div className="el-shadowing-explain">{s.explanation}</div>

      <div className="el-steps-title">🎯 روتين الشادونج — 3 خطوات</div>
      <div className="el-steps-list">
        {s.steps.map((step, i) => (
          <div key={i} className="el-step-item">
            <div className="el-step-num">{i + 1}</div>
            <div className="el-step-text">{step}</div>
          </div>
        ))}
      </div>

      <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" className="el-yt-btn">
        ▶ افتح YouTube للتدريب
      </a>
    </div>
  )
}

/* ─── Live Correction Parser ─── */
function parseCorrectionResponse(text) {
  // Parse lines like: CORRECTION: [original] → [fixed] | Reason: [why]
  const lines = text.split('\n')
  const corrections = []
  for (const line of lines) {
    const match = line.match(/CORRECTION:\s*(.+?)\s*→\s*(.+?)(?:\s*\|\s*Reason:\s*(.+))?$/i)
    if (match) {
      corrections.push({ original: match[1].trim(), fixed: match[2].trim(), reason: match[3]?.trim() || '' })
    }
  }
  return corrections
}

/* ─── Inline Correction Display ─── */
function CorrectionDisplay({ corrections, originalText }) {
  if (!corrections.length) return null
  let highlighted = originalText
  for (const c of corrections) {
    highlighted = highlighted.replace(
      c.original,
      `%%DEL%%${c.original}%%/DEL%%%%INS%%${c.fixed}%%/INS%%`
    )
  }
  const parts = highlighted.split(/(%%DEL%%.*?%%\/DEL%%|%%INS%%.*?%%\/INS%%)/g)
  return (
    <div className="el-correction-display">
      <div className="el-correction-label">✏️ التصحيح بالخط الأحمر</div>
      <div className="el-correction-text">
        {parts.map((p, i) => {
          if (p.startsWith('%%DEL%%')) return <del key={i} className="el-correction-del">{p.replace(/%%DEL%%|%%\/DEL%%/g, '')}</del>
          if (p.startsWith('%%INS%%')) return <ins key={i} className="el-correction-ins">{p.replace(/%%INS%%|%%\/INS%%/g, '')}</ins>
          return <span key={i}>{p}</span>
        })}
      </div>
      {corrections.map((c, i) => (
        <div key={i} className="el-correction-note">
          <span className="el-correction-why">💡 لماذا؟</span> {c.reason}
        </div>
      ))}
    </div>
  )
}

/* ─── Writing & AI Chat ─── */
function WritingComp({ day, levelId, dayId, navigate, setBuddyMessages, setBuddyInput, setAvatarState }) {
  const [responses, setResponses] = useState({})
  const [corrections, setCorrections] = useState({})
  const [checking, setChecking] = useState({})
  const { writing: w } = day

  const sendToBuddy = (text, challengeIdx) => {
    if (!text.trim()) return
    const msg = `تحدي الكتابة ${challengeIdx + 1}:\n${w.challenges[challengeIdx]}\n\nإجابتي:\n${text}`
    setBuddyInput('')
    setBuddyMessages(prev => [...prev, { role: 'user', content: msg }])
  }

  const checkLive = async (text, idx) => {
    if (!text.trim() || checking[idx]) return
    setChecking(c => ({ ...c, [idx]: true }))
    setAvatarState('correcting')
    try {
      const systemPrompt = `أنت مُصحِّح لغوي دقيق. عندما يرسل الطالب جملة أو فقرة إنجليزية، أعد الرد بهذا التنسيق الصارم فقط:

CORRECTION: [الكلمة/العبارة الخاطئة] → [الصواب] | Reason: [شرح قصير بالعربي]

اكتب سطراً واحداً لكل خطأ. إذا لم يوجد خطأ، اكتب: ✅ ممتاز! لا أخطاء في هذه الفقرة.`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          system: systemPrompt
        })
      })
      const data = await res.json()
      const reply = data.response || data.message || ''
      const parsed = parseCorrectionResponse(reply)
      setCorrections(c => ({ ...c, [idx]: { raw: reply, parsed } }))
      setAvatarState(parsed.length ? 'correcting' : 'happy')
      setBuddyMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setAvatarState('idle')
    } finally {
      setChecking(c => ({ ...c, [idx]: false }))
      setTimeout(() => setAvatarState('idle'), 3000)
    }
  }

  return (
    <div className="el-section">
      <div className="el-writing-title">✍️ تحديات الكتابة</div>
      {w.challenges.map((ch, i) => (
        <div key={i} className="el-writing-challenge">
          <div className="el-challenge-q">{i + 1}. {ch}</div>
          <textarea
            className="el-writing-area"
            placeholder="اكتب إجابتك هنا بالإنجليزية..."
            value={responses[i] || ''}
            onChange={e => { setResponses(r => ({ ...r, [i]: e.target.value })); setCorrections(c => ({ ...c, [i]: null })) }}
            rows={5}
          />
          <div className="el-writing-btns">
            <button
              className="el-nav-btn el-check-btn"
              onClick={() => checkLive(responses[i] || '', i)}
              disabled={!responses[i]?.trim() || checking[i]}
            >
              {checking[i] ? '⏳ جاري التصحيح...' : '🖊️ صحّح فوراً'}
            </button>
            <button
              className="el-nav-btn"
              onClick={() => sendToBuddy(responses[i] || '', i)}
              disabled={!responses[i]?.trim()}
            >
              🤖 ناقش مع المساعد
            </button>
          </div>
          {corrections[i] && (
            corrections[i].parsed.length > 0
              ? <CorrectionDisplay corrections={corrections[i].parsed} originalText={responses[i] || ''} />
              : <div className="el-correction-ok">✅ ممتاز! لا أخطاء في هذه الفقرة.</div>
          )}
        </div>
      ))}
    </div>
  )
}
