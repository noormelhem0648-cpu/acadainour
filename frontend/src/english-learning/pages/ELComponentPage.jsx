import { useNavigate, useParams } from 'react-router-dom'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getDay, COMPONENTS } from '../data/curriculum'
import { useProgress, XP_VALUES } from '../hooks/useProgress'
import WordLookupProvider from '../components/WordLookup'
import '../EL.css'

const EL = '/english-learning'
const BACKEND = 'https://acadai-backend-avvo.onrender.com'

const authHeaders = () => {
  const t = localStorage.getItem('acadai_token')
  return t
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
    : { 'Content-Type': 'application/json' }
}

/* ─── AI one-shot call via streaming endpoint ─── */
async function aiAsk(userMessage, systemPrompt, history = []) {
  const res = await fetch(`${BACKEND}/english-tutor/stream`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message: userMessage,
      history: history.map(m => ({ role: m.role, content: m.content })),
      subject_info: systemPrompt
    })
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const chunk = line.slice(6)
        if (chunk === '[DONE]') break
        full += chunk
      }
    }
  }
  return full
}

/* ─── TTS: dual accent (US / GB) with visual state ─── */
let _ttsActive = null   // tracks the currently-playing utterance key

function speak(text, onStart, onEnd, lang = 'en-US') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  _ttsActive = null

  const u = new SpeechSynthesisUtterance(text)
  u.lang  = lang
  u.rate  = lang === 'en-GB' ? 0.82 : 0.85

  // pick a matching voice when available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    lang === 'en-GB'
      ? v.lang === 'en-GB' || v.name.toLowerCase().includes('british') || v.name.includes('UK')
      : v.lang === 'en-US' || v.name.toLowerCase().includes('american') || v.name.includes('US')
  )
  if (preferred) u.voice = preferred

  _ttsActive = text
  if (onStart) u.onstart = onStart
  u.onend = () => { _ttsActive = null; if (onEnd) onEnd() }
  u.onerror = () => { _ttsActive = null; if (onEnd) onEnd() }
  window.speechSynthesis.speak(u)
}

/* hook for components: returns [playingKey, triggerSpeak] */
function useTTS() {
  const [playingKey, setPlayingKey] = useState(null)
  const trigger = (text, lang = 'en-US', key) => {
    const k = key || `${lang}:${text.slice(0, 30)}`
    if (playingKey === k) { window.speechSynthesis.cancel(); setPlayingKey(null); return }
    setPlayingKey(k)
    speak(text, null, () => setPlayingKey(null), lang)
  }
  return [playingKey, trigger]
}

/* small TTS button: shows 🔊 idle / ⏳ loading / ⏹ playing */
function TTSBtn({ text, lang = 'en-US', ttsKey, playingKey, trigger, label }) {
  const k = ttsKey || `${lang}:${text?.slice(0, 30)}`
  const isPlaying = playingKey === k
  return (
    <button
      className={`el-tts-btn${isPlaying ? ' playing' : ''}`}
      onClick={() => trigger(text, lang, k)}
      title={lang === 'en-GB' ? 'British English' : 'American English'}
    >
      {isPlaying ? '⏹' : label || (lang === 'en-GB' ? 'UK 🔊' : 'US 🔊')}
    </button>
  )
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
    const history = [...messages, userMsg]
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInputText('')
    setLoading(true)
    setAvatarState('thinking')

    try {
      const subject_info = companionPrompt + '\n\nسياق الدرس: ' + dayContext + '\n\nIMPORTANT RULE: If the student asks you to solve their homework, exam, or assignment for them, refuse clearly and offer to help them understand and think through it instead. Say: "I can\'t solve it for you, but I can help you understand and guide you step by step!"'
      const res = await fetch(`${BACKEND}/english-tutor/stream`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          message: text,
          history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
          subject_info
        })
      })
      if (!res.ok) throw new Error('server')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6)
            if (chunk === '[DONE]') break
            full += chunk
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'assistant', content: full }
              return copy
            })
          }
        }
      }
      setAvatarState('idle')
    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: 'تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.' }
        return copy
      })
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
              <div style={{ float: 'left', marginLeft: 4, display: 'flex', gap: 3 }}>
                <button className="el-speak-btn" onClick={() => speak(m.content)} title="استمعي">🔊</button>
                <button className="el-speak-btn" onClick={() => window.speechSynthesis.cancel()} title="أوقف">⏹</button>
              </div>
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

  // pre-load browser voices so TTSBtn can pick the right accent immediately
  useEffect(() => {
    if (!window.speechSynthesis) return
    if (window.speechSynthesis.getVoices().length > 0) return
    const load = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])
  const compIndex = COMPONENTS.findIndex(c => c.id === componentId)
  const comp = COMPONENTS[compIndex]

  const [buddyMessages, setBuddyMessages] = useState([])
  const [buddyInput, setBuddyInput] = useState('')
  const [avatarState, setAvatarState] = useState('idle')
  const [buddyOpen, setBuddyOpen] = useState(true)
  const [showXP, setShowXP] = useState(false)

  if (!day || !comp) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Not found.</p></div></div>

  const progressKey = `${levelId}-${dayId}-${componentId}`
  const done = progress.isDone(progressKey)

  const handleDone = () => {
    if (!done) {
      setShowXP(true)
      setTimeout(() => {
        progress.markDone(progressKey)
        progress.addXP?.(componentId)
        const next = COMPONENTS[compIndex + 1]
        if (next) navigate(`${EL}/level/${levelId}/day/${dayId}/${next.id}`)
        else navigate(`${EL}/level/${levelId}/day/${dayId}`)
      }, 1200)
    } else {
      const next = COMPONENTS[compIndex + 1]
      if (next) navigate(`${EL}/level/${levelId}/day/${dayId}/${next.id}`)
      else navigate(`${EL}/level/${levelId}/day/${dayId}`)
    }
  }

  const dayContext = `Level ${levelId}, Day ${dayId}: ${day.title}. Component: ${comp.labelEn}.`

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <WordLookupProvider>
      {showXP && <XPPopAnimation amount={XP_VALUES[componentId] || 15} onDone={() => setShowXP(false)} />}
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
              {componentId === 'vocab'     && <VocabComp day={day} levelId={levelId} dayId={dayId} progress={progress} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
              {componentId === 'grammar'   && <GrammarComp day={day} levelId={levelId} setBuddyMessages={setBuddyMessages} setAvatarState={setAvatarState} />}
              {componentId === 'reading'   && <ReadingComp day={day} levelId={levelId} dayId={dayId} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
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
              <button
                className="el-later-btn"
                onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}
                title="حفظ التقدم والعودة لاحقاً"
              >
                ⏸ أكمل لاحقاً
              </button>
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
      </WordLookupProvider>
    </div>
  )
}

/* ─── Vocabulary ─── */
function VocabComp({ day, levelId, dayId, progress }) {
  const { vocabulary: v } = day
  const [playingKey, trigger] = useTTS()
  const [viewMode, setViewMode] = useState('table')   // 'table' | 'cards'
  const [flipped, setFlipped] = useState({})
  const [revealCount, setRevealCount] = useState(5)   // step-by-step reveal
  const total = v.words.length
  const showAll = revealCount >= total

  const toggleFlip = (i) => setFlipped(f => ({ ...f, [i]: !f[i] }))

  return (
    <div className="el-section">
      <div className="el-section-intro">{v.intro}</div>

      {/* view toggle */}
      <div className="el-vocab-view-toggle">
        <button className={'el-view-btn' + (viewMode === 'table' ? ' active' : '')} onClick={() => setViewMode('table')}>📋 جدول</button>
        <button className={'el-view-btn' + (viewMode === 'cards' ? ' active' : '')} onClick={() => setViewMode('cards')}>🃏 بطاقات</button>
        <span className="el-hard-count">
          ⭐ {v.words.filter((w,i) => progress.isHardWord(w.word, levelId, dayId)).length} / {v.words.length} صعبة
        </span>
      </div>

      {/* accent legend */}
      <div className="el-tts-legend">
        <span>US = American English</span>
        <span>UK = British English</span>
        <span style={{ opacity: .6, fontSize: '0.8rem' }}>اضغط مرة ثانية لإيقاف الصوت ⏹</span>
      </div>

      {viewMode === 'table' && (
        <div className="el-vocab-table-wrap">
          <table className="el-vocab-table">
            <thead>
              <tr>
                <th>الكلمة</th>
                <th>US / UK</th>
                <th>IPA</th>
                <th>المعنى</th>
                <th>النطق بالعربي</th>
                <th>مثال</th>
                <th>الترجمة</th>
                <th>⭐</th>
              </tr>
            </thead>
            <tbody>
              {v.words.slice(0, revealCount).map((w, i) => {
                const hard = progress.isHardWord(w.word, levelId, dayId)
                return (
                  <tr key={i} className={hard ? 'el-row-hard' : ''}>
                    <td><strong className="el-word-highlight">{w.word}</strong></td>
                    <td>
                      <div className="el-tts-pair">
                        <TTSBtn text={w.word} lang="en-US" ttsKey={`us-word-${i}`} playingKey={playingKey} trigger={trigger} />
                        <TTSBtn text={w.word} lang="en-GB" ttsKey={`gb-word-${i}`} playingKey={playingKey} trigger={trigger} />
                      </div>
                    </td>
                    <td><span className="el-ipa">{w.ipa}</span></td>
                    <td>{w.arabic}</td>
                    <td><span className="el-phonetic">{w.phonetic}</span></td>
                    <td>
                      <em>{w.example}</em>
                      <div className="el-tts-pair" style={{ marginTop: 4 }}>
                        <TTSBtn text={w.example} lang="en-US" ttsKey={`us-ex-${i}`} playingKey={playingKey} trigger={trigger} label="US جملة" />
                        <TTSBtn text={w.example} lang="en-GB" ttsKey={`gb-ex-${i}`} playingKey={playingKey} trigger={trigger} label="UK جملة" />
                      </div>
                    </td>
                    <td className="el-text-muted">{w.exampleAr}</td>
                    <td>
                      <button
                        className={'el-hard-btn' + (hard ? ' active' : '')}
                        onClick={() => progress.toggleHardWord(w, levelId, dayId)}
                        title={hard ? 'إزالة من قائمة الصعب' : 'أضف للكلمات الصعبة'}
                      >{hard ? '⭐' : '☆'}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!showAll && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <button className="el-nav-btn primary" onClick={() => setRevealCount(c => Math.min(c + 5, total))}>
                التالي ({Math.min(revealCount, total)} / {total}) ↓
              </button>
              <button className="el-nav-btn" style={{ marginRight: 8 }} onClick={() => setRevealCount(total)}>
                عرض الكل
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="el-flashcard-grid">
          <p className="el-cards-hint">اضغط على البطاقة لتقليبها · ⭐ لتحديد الصعبة</p>
          {v.words.slice(0, revealCount).map((w, i) => {
            const hard = progress.isHardWord(w.word, levelId, dayId)
            return (
              <div key={i} className={'el-flashcard' + (flipped[i] ? ' flipped' : '') + (hard ? ' hard' : '') + ' el-fade-in'} onClick={() => toggleFlip(i)}>
                <div className="el-fc-inner">
                  {/* Front */}
                  <div className="el-fc-front">
                    <div className="el-fc-word">{w.word}</div>
                    <div className="el-fc-ipa">{w.ipa}</div>
                    <div className="el-tts-pair" style={{ justifyContent: 'center', marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <TTSBtn text={w.word} lang="en-US" ttsKey={`fc-us-${i}`} playingKey={playingKey} trigger={trigger} />
                      <TTSBtn text={w.word} lang="en-GB" ttsKey={`fc-gb-${i}`} playingKey={playingKey} trigger={trigger} />
                    </div>
                    <div className="el-fc-hint">اضغط للمعنى ↩</div>
                  </div>
                  {/* Back */}
                  <div className="el-fc-back">
                    <div className="el-fc-arabic">{w.arabic}</div>
                    <div className="el-fc-phonetic">{w.phonetic}</div>
                    <div className="el-tts-pair" style={{ justifyContent: 'center', margin: '6px 0' }} onClick={e => e.stopPropagation()}>
                      <TTSBtn text={w.word} lang="en-US" ttsKey={`fc-back-us-${i}`} playingKey={playingKey} trigger={trigger} />
                      <TTSBtn text={w.word} lang="en-GB" ttsKey={`fc-back-gb-${i}`} playingKey={playingKey} trigger={trigger} />
                    </div>
                    <div className="el-fc-example">{w.example}</div>
                    <div className="el-fc-example-ar">{w.exampleAr}</div>
                  </div>
                </div>
                <button
                  className={'el-hard-btn fc' + (hard ? ' active' : '')}
                  onClick={e => { e.stopPropagation(); progress.toggleHardWord(w, levelId, dayId) }}
                  title={hard ? 'إزالة' : 'صعبة'}
                >{hard ? '⭐' : '☆'}</button>
              </div>
            )
          })}
          {!showAll && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '8px 0' }}>
              <button className="el-nav-btn primary" onClick={() => setRevealCount(c => Math.min(c + 5, total))}>
                عرض 5 كلمات أكثر ({Math.min(revealCount, total)} / {total}) ↓
              </button>
            </div>
          )}
        </div>
      )}

      {/* Teacher Corner + new features */}
      <TeacherCorner words={v.words} dayTitle={day.title} />
      <FillGapExercise words={v.words} allLearnedWords={progress.hardWords} />
      <VocabStoryGen words={v.words} dayTitle={day.title} levelId={levelId} allLearnedWords={progress.hardWords} />
    </div>
  )
}

/* ─── Teacher Corner: Ask the Teacher about vocabulary ─── */
function TeacherCorner({ words, dayTitle }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const wordList = words.map((w, i) => `${i + 1}. ${w.word} (${w.arabic}) — ${w.ipa}`).join('\n')

  const systemPrompt = `أنت أستاذ لغة إنجليزية متمرس ومتخصص. درس اليوم: "${dayTitle}". كلمات الدرس: ${wordList}

أسلوب الرد:
- اشرح بالعربية بشكل تفصيلي ومفيد
- استخدم هذا الهيكل دائماً:

**📌 الشرح:**
[شرح مفصّل للنقطة المطلوبة]

**📖 أمثلة:**
[مثال إنجليزي أول] — [معناه بالعربي]
[مثال إنجليزي ثاني] — [معناه بالعربي]

**💡 ملاحظة مهمة:**
[نصيحة أو قاعدة مهمة]

**⚠️ أخطاء شائعة:**
[خطأ شائع] ✗ / [الصواب] ✓

- إذا سُئلت عن كلمة: أعطِ المعنى، النطق، الجذر، المرادفات، والأضداد
- إذا سُئلت عن قاعدة: اشرح متى تُستخدم، والصيغ المختلفة
- لا تختصر على حساب الفائدة
- لا تضف مقدمات أو خواتيم زائدة`

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const aiReply = await aiAsk(userMsg.content, systemPrompt, msgs)
      setMsgs(prev => [...prev, { role: 'assistant', content: aiReply || '...' }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'تعذّر الاتصال. تحقق من الإنترنت.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="el-teacher-corner">
      <button className="el-teacher-toggle" onClick={() => setOpen(o => !o)}>
        👨‍🏫 {open ? 'أغلق زاوية الأستاذ' : 'اسأل الأستاذ عن أي كلمة'}
      </button>
      {open && (
        <div className="el-teacher-chat">
          <div className="el-teacher-header">
            <span>👨‍🏫 الأستاذ</span>
            <span style={{ fontSize: '.75rem', color: 'var(--el-muted)' }}>يعرف كل كلمات درس اليوم</span>
          </div>
          {msgs.length === 0 && (
            <div className="el-teacher-suggestions">
              {['ما معنى أول كلمة؟', 'كيف أحفظ الكلمات؟', 'هل يمكنك شرح كلمة صعبة؟'].map(q => (
                <button key={q} className="el-suggestion-chip" onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="el-teacher-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`el-tc-msg ${m.role}`}>
                {m.role === 'assistant' && <span className="el-tc-avatar">👨‍🏫</span>}
                <span className="el-tc-text">
                  {m.role === 'assistant'
                    ? m.content.split('\n').filter(l => l.trim()).map((line, li) => {
                        const isHeader = /^\*\*[📌📖💡⚠️]/.test(line.trim())
                        const isBullet = /^[-•*]\s/.test(line.trim())
                        const clean = line
                          .replace(/^[-•*]\s/, '')
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          .trim()
                        if (isHeader) return (
                          <div key={li} style={{ fontWeight:700, color:'var(--el-accent)', marginTop:10, marginBottom:4, fontSize:'.9rem' }}>{clean}</div>
                        )
                        if (isBullet) return (
                          <div key={li} style={{ display:'flex', gap:6, marginBottom:4 }}><span style={{color:'var(--el-accent)',fontWeight:700,flexShrink:0}}>•</span><span>{clean}</span></div>
                        )
                        return <div key={li} style={{ marginBottom:4 }}>{clean}</div>
                      })
                    : m.content}
                </span>
              </div>
            ))}
            {loading && <div className="el-tc-msg assistant"><span className="el-tc-avatar">👨‍🏫</span><span className="el-buddy-typing"><span/><span/><span/></span></div>}
            <div ref={endRef} />
          </div>
          <div className="el-teacher-input-row">
            <input
              className="el-buddy-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="اسأل عن أي كلمة من الدرس..."
              disabled={loading}
            />
            <button className="el-buddy-send" onClick={send} disabled={loading || !input.trim()}>↑</button>
          </div>
        </div>
      )}
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
      const reply = await aiAsk('Start the scenario. Say your opening line.', systemPrompt) || 'Hello! Ready to begin?'
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
      const systemPrompt = `${scenario.prompt}

Grammar patterns: ${day.grammar?.patterns?.map(p => p.name).join(', ')}.
Keep your dialogue response to 1-2 sentences max.

After your dialogue response, on a NEW LINE, check the student's last message for grammar/vocabulary errors.
Use EXACTLY this format (no extra text):
REPLY: your dialogue response here
ERROR: the wrong word or phrase the student used (or "none" if correct)
FIX: the correct version
NOTE: one short Arabic explanation`
      const roleHist = newEx.slice(0,-1).map(e => ({ role: e.role === 'buddy' ? 'assistant' : 'user', content: e.text }))
      const raw = await aiAsk(userLine, systemPrompt, roleHist) || ''
      // Parse structured response
      const replyMatch = raw.match(/REPLY:\s*(.+?)(?=\nERROR:|$)/s)
      const errorMatch = raw.match(/ERROR:\s*(.+?)(?=\nFIX:|$)/s)
      const fixMatch   = raw.match(/FIX:\s*(.+?)(?=\nNOTE:|$)/s)
      const noteMatch  = raw.match(/NOTE:\s*(.+?)$/s)
      const replyText = replyMatch ? replyMatch[1].trim() : raw
      const correction = errorMatch && errorMatch[1].trim().toLowerCase() !== 'none'
        ? { error: errorMatch[1].trim(), fix: fixMatch?.[1].trim() || '', note: noteMatch?.[1].trim() || '' }
        : null
      setExchange(prev => [...prev, { role: 'buddy', text: replyText, correction }])
      speak(replyText, null, () => setAvatarState('listening'))
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
          <div key={i}>
            <div className={`el-roleplay-line ${e.role}`}>
              {e.role === 'buddy' && (
                <>
                  <button className="el-speak-btn" onClick={() => speak(e.text)} style={{ marginLeft: 4 }}>🔊</button>
                  <button className="el-speak-btn" onClick={() => window.speechSynthesis.cancel()} style={{ marginLeft: 2 }}>⏹</button>
                </>
              )}
              <span className="el-roleplay-text">{e.text}</span>
            </div>
            {e.role === 'buddy' && e.correction && (
              <div className="el-rp-correction-wrap">
                <div className="el-rp-correction-error">❌ {e.correction.error}</div>
                <div className="el-rp-correction-fix">✅ {e.correction.fix}</div>
                {e.correction.note && <div className="el-rp-correction-note">{e.correction.note}</div>}
              </div>
            )}
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

/* ─── Drag-and-Drop sentence builder ─── */
function DragSentence({ question, answer }) {
  const match = question.match(/\(([^)]+)\)/)
  const words = match ? match[1].split(/\s*\/\s*/).map(w => w.trim()).filter(Boolean) : []
  const [shuffled] = useState(() => [...words].sort(() => Math.random() - .5))
  const [bank, setBank] = useState(shuffled)
  const [placed, setPlaced] = useState([])
  const [result, setResult] = useState(null)

  const moveToPlaced = (word, idx) => {
    if (result) return
    setBank(b => b.filter((_, i) => i !== idx))
    setPlaced(p => [...p, word])
    setResult(null)
  }
  const moveToBank = (word, idx) => {
    if (result) return
    setPlaced(p => p.filter((_, i) => i !== idx))
    setBank(b => [...b, word])
    setResult(null)
  }
  const check = () => {
    const sentence = placed.join(' ')
    const correct = answer.replace(/[.!?,]$/, '').trim().toLowerCase()
    setResult(sentence.toLowerCase() === correct ? 'correct' : 'wrong')
  }
  const reset = () => { setBank(shuffled); setPlaced([]); setResult(null) }

  return (
    <div className="el-drag-exercise">
      <div className="el-drag-label">🔀 رتّب الكلمات لتكوين جملة صحيحة:</div>
      <div
        className={'el-drag-drop-zone' + (result === 'correct' ? ' correct' : result === 'wrong' ? ' wrong' : '')}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const d = JSON.parse(e.dataTransfer.getData('text/plain'))
          if (d.from === 'bank') moveToPlaced(d.word, d.idx)
        }}
      >
        {placed.length === 0
          ? <span className="el-drag-placeholder">اسحب الكلمات هنا أو اضغط عليها...</span>
          : placed.map((w, i) => (
            <span
              key={i} className="el-drag-chip placed"
              draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ word: w, from: 'placed', idx: i }))}
              onClick={() => moveToBank(w, i)}
            >{w}</span>
          ))
        }
      </div>
      <div
        className="el-drag-bank"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const d = JSON.parse(e.dataTransfer.getData('text/plain'))
          if (d.from === 'placed') moveToBank(d.word, d.idx)
        }}
      >
        {bank.map((w, i) => (
          <span
            key={i} className="el-drag-chip"
            draggable
            onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ word: w, from: 'bank', idx: i }))}
            onClick={() => moveToPlaced(w, i)}
          >{w}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="el-nav-btn primary" onClick={check} disabled={!placed.length || !!result}>تحقق ✓</button>
        <button className="el-nav-btn" onClick={reset}>إعادة 🔄</button>
      </div>
      {result === 'correct' && <div className="el-drag-result correct">🎉 ممتاز! الجملة صحيحة.</div>}
      {result === 'wrong' && <div className="el-drag-result wrong">❌ ليس الترتيب الصحيح.<div className="el-exercise-ans" style={{ marginTop: 6 }}>✅ {answer}</div></div>}
    </div>
  )
}

/* ─── Grammar Pattern with AI expansion ─── */
function GrammarPattern({ p, pi, day }) {
  const [expanded, setExpanded] = useState(false)
  const [expandedText, setExpandedText] = useState('')
  const [expandLoading, setExpandLoading] = useState(false)

  const expand = async () => {
    if (expandedText) { setExpanded(e => !e); return }
    setExpanded(true)
    setExpandLoading(true)
    const prompt = `اشرح قاعدة "${p.name}" في اللغة الإنجليزية بشكل تفصيلي كامل. اتبع هذا الهيكل بالضبط:

**📌 ما هي القاعدة؟**
[شرح مفصّل بالعربية — لا يقل عن 50 كلمة]

**🕐 متى نستخدمها؟**
[متى وكيف نستخدم هذه القاعدة]

**🔑 الكلمات الدلالية:**
[كلمات تدل على استخدام هذه القاعدة]

**✅ المثبت (Affirmative):**
[صيغة] → [مثال]
[مثال آخر]

**❌ النفي (Negative):**
[صيغة] → [مثال]

**❓ السؤال (Question):**
[صيغة] → [مثال]

**🔍 أسئلة WH:**
[مثال]

**⚠️ أخطاء شائعة:**
✗ [خطأ] → ✓ [الصواب]
✗ [خطأ] → ✓ [الصواب]

**💡 نصائح:**
[نصيحة مهمة]`

    try {
      const text = await aiAsk(prompt, `أنت معلم لغة إنجليزية محترف. درس اليوم: ${day.title}. اشرح القاعدة بشكل تعليمي مفصّل.`)
      setExpandedText(text)
    } catch {
      setExpandedText('تعذّر تحميل الشرح التفصيلي.')
    }
    setExpandLoading(false)
  }

  const renderMarkdown = (text) => text.split('\n').filter(l => l.trim()).map((line, li) => {
    const isHeader = /^\*\*[📌🕐🔑✅❌❓🔍⚠️💡]/.test(line.trim())
    const isBullet = /^[-•*✗✓]\s/.test(line.trim())
    const clean = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim()
    if (isHeader) return <div key={li} style={{ fontWeight:700, color:'var(--el-accent)', marginTop:12, marginBottom:4, fontSize:'.9rem', borderBottom:'1px solid var(--el-border)', paddingBottom:2 }}>{clean}</div>
    if (isBullet) return <div key={li} style={{ display:'flex', gap:6, marginBottom:3, paddingRight:8 }}><span style={{flexShrink:0,color:'var(--el-muted)'}}>•</span><span>{clean}</span></div>
    return <div key={li} style={{ marginBottom:4 }}>{clean}</div>
  })

  return (
    <div className="el-grammar-block">
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
      <button
        className="el-nav-btn"
        style={{ marginTop: 10, fontSize: '.82rem', background: expanded ? 'var(--el-bg3)' : undefined }}
        onClick={expand}
        disabled={expandLoading}
      >
        {expandLoading ? '⏳ يحمّل الشرح...' : expanded ? '🔼 إخفاء الشرح التفصيلي' : '📚 شرح تفصيلي + جميع الصيغ'}
      </button>
      {expanded && expandedText && (
        <div className="el-grammar-expanded" style={{ marginTop: 10, padding: '12px 14px', background: 'var(--el-bg3)', borderRadius: 10, fontSize: '.87rem', lineHeight: 1.7 }}>
          {renderMarkdown(expandedText)}
        </div>
      )}
    </div>
  )
}

/* ─── Grammar ─── */
function GrammarComp({ day, levelId, setBuddyMessages, setAvatarState }) {
  const [shown, setShown] = useState({})
  const { grammar: g } = day

  return (
    <div className="el-section">
      {g.patterns.map((p, pi) => (
        <GrammarPattern key={pi} p={p} pi={pi} day={day} />
      ))}
      {g.patterns.map((p, pi) => (
        <div key={`ex-${pi}`} className="el-grammar-block" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div className="el-exercises-title">📝 تمارين — صحّح بنفسك</div>
          {p.exercises.map((ex, i) => {
            const isDrag = /رتّب/.test(ex.question) && /\(/.test(ex.question)
            return (
              <div key={i} className="el-exercise-card">
                {isDrag ? (
                  <DragSentence question={ex.question} answer={ex.answer} />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <GrammarPatternFlashcards patterns={g.patterns} />
      <GrammarDetective day={day} levelId={levelId} />
    </div>
  )
}

/* ─── Highlighted Text renderer ─── */
function HighlightedText({ text, highlights }) {
  if (!highlights.length) return <>{text}</>
  // merge overlapping, sort by start
  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  const parts = []
  let cursor = 0
  for (const h of sorted) {
    if (h.start > cursor) parts.push({ text: text.slice(cursor, h.start), color: null })
    if (h.end > cursor) {
      parts.push({ text: text.slice(Math.max(h.start, cursor), h.end), color: h.color })
      cursor = h.end
    }
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), color: null })
  return (
    <>
      {parts.map((p, i) =>
        p.color
          ? <mark key={i} style={{ background: HIGHLIGHT_COLORS[p.color]?.bg, borderRadius: 3, padding: '0 1px' }}>{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </>
  )
}

/* ─── Word Lookup Popup (double-click anywhere in Reading) ─── */
function WordLookupPopup({ word, rect, vocabWords, onClose }) {
  const [playingKey, trigger] = useTTS()
  const clean = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
  const match = vocabWords?.find(w => w.word.toLowerCase().includes(clean) || clean.includes(w.word.toLowerCase().split(' ')[0]))

  useEffect(() => {
    const close = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  if (!clean) return null

  return (
    <div className="el-lookup-backdrop" onClick={onClose}>
      <div
        className="el-lookup-popup"
        style={{ top: Math.min(rect.bottom + 8, window.innerHeight - 220), left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)) }}
        onClick={e => e.stopPropagation()}
      >
        <button className="el-lookup-close" onClick={onClose}>✕</button>
        <div className="el-lookup-word">{match?.word || word}</div>
        {match ? (
          <>
            <div className="el-lookup-ipa">{match.ipa}</div>
            <div className="el-lookup-arabic">{match.arabic}</div>
            <div className="el-lookup-phonetic">نطق: {match.phonetic}</div>
            <div className="el-tts-pair" style={{ margin: '6px 0' }}>
              <TTSBtn text={match.word} lang="en-US" ttsKey="lu-us" playingKey={playingKey} trigger={trigger} label="US 🔊" />
              <TTSBtn text={match.word} lang="en-GB" ttsKey="lu-gb" playingKey={playingKey} trigger={trigger} label="UK 🔊" />
            </div>
            <div className="el-lookup-example">{match.example}</div>
          </>
        ) : (
          <>
            <div className="el-lookup-arabic" style={{ color: 'var(--el-muted)', fontSize: '.85rem' }}>الكلمة ليست في قاموس اليوم</div>
            <div className="el-tts-pair" style={{ margin: '6px 0' }}>
              <TTSBtn text={word} lang="en-US" ttsKey="lu-us" playingKey={playingKey} trigger={trigger} label="US نطق" />
              <TTSBtn text={word} lang="en-GB" ttsKey="lu-gb" playingKey={playingKey} trigger={trigger} label="UK نطق" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fef08a', label: '⭐ مهم',    dark: '#854d0e' },
  red:    { bg: '#fecaca', label: '❗ صعب',    dark: '#991b1b' },
  green:  { bg: '#bbf7d0', label: '✅ قاعدة',  dark: '#14532d' },
}

/* ─── RSVP Speed Reader ─── */
function RSVPReader({ text, onClose }) {
  const words = text.split(/\s+/).filter(Boolean)
  const [idx, setIdx] = useState(0)
  const [wpm, setWpm] = useState(250)
  const [running, setRunning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setIdx(i => {
          if (i >= words.length - 1) { setRunning(false); return i }
          return i + 1
        })
      }, Math.round(60000 / wpm))
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running, wpm, words.length])

  const word = words[idx] || ''
  const pct = Math.round((idx / (words.length - 1)) * 100)

  // highlight middle letter
  const mid = Math.floor(word.length / 2)
  const before = word.slice(0, mid)
  const pivot = word[mid] || ''
  const after = word.slice(mid + 1)

  return (
    <div className="el-rsvp-overlay">
      <div className="el-rsvp-box">
        <div className="el-rsvp-progress-bar"><div style={{ width: pct + '%' }} /></div>
        <div className="el-rsvp-word">
          <span className="el-rsvp-before">{before}</span>
          <span className="el-rsvp-pivot">{pivot}</span>
          <span className="el-rsvp-after">{after}</span>
        </div>
        <div className="el-rsvp-counter">{idx + 1} / {words.length}</div>
        <div className="el-rsvp-controls">
          <input type="range" min="100" max="600" step="25" value={wpm}
            onChange={e => setWpm(Number(e.target.value))} />
          <span>{wpm} wpm</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
          <button className="el-nav-btn" onClick={() => setIdx(0)}>⏮</button>
          <button className="el-nav-btn primary" onClick={() => setRunning(r => !r)}>
            {running ? '⏸ إيقاف' : idx >= words.length - 1 ? '🔄 إعادة' : '▶ تشغيل'}
          </button>
          <button className="el-nav-btn" onClick={onClose}>✕ إغلاق</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Reading ─── */
function ReadingComp({ day, levelId, dayId }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const [playingKey, trigger] = useTTS()
  const [lookup, setLookup] = useState(null)
  const [hlColor, setHlColor] = useState('yellow')
  const [rsvp, setRsvp] = useState(false)
  const passageRef = useRef(null)
  const sectionRef = useRef(null)
  const [scrollPct, setScrollPct] = useState(0)
  const { reading: r } = day
  const hlKey = `hl-${levelId}-${dayId}`

  const [highlights, setHighlights] = useState(() => {
    try { return JSON.parse(localStorage.getItem(hlKey) || '[]') } catch { return [] }
  })
  const saveHL = (arr) => { setHighlights(arr); localStorage.setItem(hlKey, JSON.stringify(arr)) }

  // reading progress bar
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const pct = scrollHeight <= clientHeight ? 100 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      setScrollPct(pct)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const handleDoubleClick = useCallback(e => {
    const sel = window.getSelection()
    const word = sel?.toString().trim() || ''
    if (!word || word.split(' ').length > 4) return
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setLookup({ word, rect })
  }, [])

  return (
    <div className="el-section el-reading-section" ref={sectionRef}>
      {/* thin progress bar */}
      <div className="el-reading-prog-bar"><div style={{ width: scrollPct + '%' }} /></div>

      {rsvp && <RSVPReader text={r.passage} onClose={() => setRsvp(false)} />}

      {lookup && (
        <WordLookupPopup
          word={lookup.word}
          rect={lookup.rect}
          vocabWords={day.vocabulary?.words}
          onClose={() => setLookup(null)}
        />
      )}
      {/* Highlight toolbar */}
      <div className="el-hl-toolbar">
        <span className="el-hl-label">🖊️ تظليل:</span>
        {Object.entries(HIGHLIGHT_COLORS).map(([k, v]) => (
          <button
            key={k}
            className={'el-hl-color-btn' + (hlColor === k ? ' active' : '')}
            style={{ '--hl-bg': v.bg }}
            onClick={() => setHlColor(k)}
            title={v.label}
          >{v.label}</button>
        ))}
        {highlights.length > 0 && (
          <button className="el-hl-clear" onClick={() => saveHL([])}>🗑️ مسح التظليل</button>
        )}
        <button className="el-hl-clear" style={{ marginRight: 'auto' }} onClick={() => setRsvp(true)}>
          ⚡ قراءة سريعة RSVP
        </button>
      </div>

      <div className="el-lookup-hint">💡 انقر مزدوجاً للبحث · حدّد نصاً وسيُظلَّل تلقائياً</div>
      <div
        className="el-reading-passage"
        ref={passageRef}
        onDoubleClick={handleDoubleClick}
        onMouseUp={() => {
          const sel = window.getSelection()
          const txt = sel?.toString().trim()
          if (!txt || txt.length < 2) return
          const passage = r.passage
          const idx = passage.indexOf(txt)
          if (idx === -1) return
          const newHL = [...highlights, { start: idx, end: idx + txt.length, color: hlColor }]
          saveHL(newHL)
          sel.removeAllRanges()
        }}
      >
        <HighlightedText text={r.passage} highlights={highlights} />
        <div className="el-tts-pair" style={{ marginTop: 10 }}>
          <TTSBtn text={r.passage} lang="en-US" ttsKey="passage-us" playingKey={playingKey} trigger={trigger} label="US استمع" />
          <TTSBtn text={r.passage} lang="en-GB" ttsKey="passage-gb" playingKey={playingKey} trigger={trigger} label="UK استمع" />
        </div>
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
      <ReadingComprehensionQuiz passage={r.passage} />
      <ReadingBookmarks />
    </div>
  )
}

/* ─── Listening Speed Control ─── */
function ListeningSpeedControl({ text }) {
  const [rate, setRate] = useState(1)
  const [playing, setPlaying] = useState(false)
  const speeds = [0.6, 0.75, 1, 1.1, 1.25]
  const labels = ['0.6x', '0.75x', '1x', '1.1x', '1.25x']

  const play = (r) => {
    window.speechSynthesis.cancel()
    if (playing) { setPlaying(false); return }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = r
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    setPlaying(true)
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="el-speed-control-wrap">
      <div className="el-speed-control-label">🎚️ سرعة الاستماع:</div>
      <div className="el-speed-control-btns">
        {speeds.map((s, i) => (
          <button key={s} className={`el-speed-ctrl-btn${rate === s ? ' active' : ''}`} onClick={() => setRate(s)}>{labels[i]}</button>
        ))}
      </div>
      <button className={`el-nav-btn${playing ? ' primary' : ''}`} style={{ marginTop: 8 }} onClick={() => play(rate)}>
        {playing ? '⏹ أوقف' : '▶ استمع'}
      </button>
    </div>
  )
}

/* ─── Listening ─── */
function ListeningComp({ day }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [score, setScore]     = useState(null)
  const [playingKey, trigger] = useTTS()
  const { listening: l } = day

  // split on either '___' or '_____' (flexible)
  const parts = l.fillText.split(/_{3,}/)

  const checkAnswers = () => {
    let correct = 0
    l.blanks.forEach((b, i) => {
      if (answers[i]?.toLowerCase().trim() === b.blank.toLowerCase()) correct++
    })
    setScore({ correct, total: l.blanks.length, pct: Math.round((correct / l.blanks.length) * 100) })
    setChecked(true)
  }

  const retry = () => { setAnswers({}); setChecked(false); setScore(null) }

  return (
    <div className="el-section">
      <div className="el-listening-context">🎬 السياق: {l.context}</div>

      <div className="el-full-text-box">
        <div className="el-full-text-label">النص الكامل — استمع أولاً:</div>
        <div className="el-full-text">{l.text}</div>
        <ListeningSpeedControl text={l.text} />
      </div>

      <div className="el-dictation-title">✏️ امْلأ الفراغات</div>
      <div className="el-fill-blanks">
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < l.blanks.length && (() => {
              const isCorrect = checked && answers[i]?.toLowerCase().trim() === l.blanks[i].blank.toLowerCase()
              const isWrong   = checked && !isCorrect
              return (
                <span className="el-blank-wrap">
                  <input
                    className={'el-blank-input' + (isCorrect ? ' correct' : isWrong ? ' wrong' : '')}
                    value={answers[i] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { const next = document.querySelectorAll('.el-blank-input')[i+1]; next?.focus() } }}
                    disabled={checked}
                    placeholder="___"
                    size={Math.max(6, (l.blanks[i].blank.length + 2))}
                  />
                  {isCorrect && <span className="el-blank-icon">✅</span>}
                  {isWrong   && <span className="el-blank-icon">❌ <em className="el-blank-correct">{l.blanks[i].blank}</em></span>}
                </span>
              )
            })()}
          </span>
        ))}
      </div>

      {score && (
        <div className={`el-score-banner ${score.pct === 100 ? 'perfect' : score.pct >= 70 ? 'good' : 'retry'}`}>
          {score.pct === 100
            ? `🎉 ممتاز! أجبت على كل الفراغات بشكل صحيح (${score.total}/${score.total})`
            : score.pct >= 70
              ? `👍 جيد جداً — ${score.correct}/${score.total} صحيحة (${score.pct}%)`
              : `💪 ${score.correct}/${score.total} صحيحة — راجع الفراغات الحمراء وحاول مجدداً`
          }
        </div>
      )}

      <div className="el-dictation-btns">
        {!checked
          ? <button className="el-nav-btn primary" onClick={checkAnswers}
              disabled={Object.keys(answers).length === 0}>
              ✅ تحقق من الإجابات
            </button>
          : <button className="el-nav-btn" onClick={retry}>🔄 حاول مرة ثانية</button>
        }
      </div>

      {score && <AILiveReaction score={score} />}
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

      <DialoguePartner day={day} />
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
  const progress = useProgress()
  const draftBase = `${levelId}-${dayId}-writing`

  // load saved drafts on mount
  const [responses, setResponses] = useState(() => {
    const saved = {}
    day.writing?.challenges?.forEach((_, i) => {
      const v = progress.loadDraft(`${draftBase}-${i}`)
      if (v) saved[i] = v
    })
    return saved
  })
  const [corrections, setCorrections] = useState({})
  const [checking, setChecking] = useState({})
  const [savedAt, setSavedAt] = useState({})
  const debounceRefs = useRef({})
  const { writing: w } = day

  const handleWritingChange = (i, value) => {
    setResponses(r => ({ ...r, [i]: value }))
    setCorrections(c => ({ ...c, [i]: null }))
    // debounce: save after 3s of inactivity
    clearTimeout(debounceRefs.current[i])
    debounceRefs.current[i] = setTimeout(() => {
      progress.saveDraft(`${draftBase}-${i}`, value)
      setSavedAt(s => ({ ...s, [i]: new Date().toLocaleTimeString('ar') }))
    }, 3000)
  }

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
      const reply = await aiAsk(text, systemPrompt)
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
      <WritingPromptCard dayTitle={day.title} />
      <div className="el-writing-title">✍️ تحديات الكتابة</div>
      {w.challenges.map((ch, i) => (
        <div key={i} className="el-writing-challenge">
          <div className="el-challenge-q">{i + 1}. {ch}</div>
          <textarea
            className="el-writing-area"
            placeholder="اكتب إجابتك هنا بالإنجليزية..."
            value={responses[i] || ''}
            onChange={e => handleWritingChange(i, e.target.value)}
            rows={5}
          />
          <div className="el-draft-status">
            {savedAt[i]
              ? `💾 حُفظ تلقائياً ${savedAt[i]}`
              : responses[i] ? '⏳ سيُحفظ خلال 3 ثوانٍ...' : ''}
          </div>
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
          {corrections[i] && <WritingUpgrade text={responses[i] || ''} />}
        </div>
      ))}
    </div>
  )
}

/* ─── Grammar Detective ─── */
function GrammarDetective({ day }) {
  const [open, setOpen] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(3)
  const [sentences, setSentences] = useState([])
  const [clicked, setClicked] = useState({})
  const [revealed, setRevealed] = useState({})
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  const LEVELS = [
    { key: 'easy', label: '🟢 سهل' },
    { key: 'medium', label: '🟡 متوسط' },
    { key: 'hard', label: '🔴 صعب' },
  ]

  const generate = async () => {
    setLoading(true)
    setSentences([])
    setClicked({})
    setRevealed({})
    setGenerated(false)
    setError('')
    const patterns = day.grammar?.patterns?.map(p => p.name).join(', ') || 'general grammar'
    const vocab = day.vocabulary?.words?.slice(0, 8).map(w => w.word).join(', ') || ''
    const diffDesc = difficulty === 'easy'
      ? 'simple mistakes: subject-verb agreement or basic tense errors'
      : difficulty === 'medium'
      ? 'intermediate mistakes: wrong tense form, misused preposition, or article error'
      : 'advanced mistakes: subtle conditional or perfect tense confusion'
    const prompt = `Generate exactly ${count} English sentences, each with ONE grammar mistake.
Difficulty: ${diffDesc}.
Topic: ${patterns}. ${vocab ? `Use some of: ${vocab}.` : ''}

Use EXACTLY this format for each sentence (repeat the block ${count} times):
SENTENCE: [the sentence with the mistake]
ERROR: [wrong word or phrase]
FIX: [correct version]
HINT: [شرح عربي قصير]
---`
    try {
      const raw = await aiAsk(prompt, 'Output only the labeled blocks. No intro, no numbering, no extra text.')
      // Parse line-based format
      const blocks = raw.split('---').map(b => b.trim()).filter(Boolean)
      const parsed = blocks.map(block => {
        const get = (label) => {
          const m = block.match(new RegExp(`${label}:\\s*(.+)`, 'i'))
          return m ? m[1].trim() : ''
        }
        return { text: get('SENTENCE'), error: get('ERROR'), fix: get('FIX'), hint: get('HINT') }
      }).filter(s => s.text && s.error)
      if (parsed.length > 0) {
        setSentences(parsed.slice(0, count))
        setGenerated(true)
      } else {
        setError('لم تُولَّد جمل — حاولي مرة ثانية')
      }
    } catch (e) {
      setError('خطأ في الاتصال: ' + (e?.message || 'unknown'))
    }
    setLoading(false)
  }

  const handleWord = (sIdx, wIdx, word, sentence) => {
    const key = `${sIdx}_${wIdx}`
    if (clicked[key]) return
    const cleanWord = word.toLowerCase().replace(/[.,!?'"]/g, '')
    const errorWords = sentence.error.toLowerCase().split(/\s+/).map(w => w.replace(/[.,!?'"]/g, ''))
    const isError = errorWords.some(ew => cleanWord === ew || cleanWord.includes(ew) || ew.includes(cleanWord))
    setClicked(c => ({ ...c, [key]: isError ? 'right' : 'wrong' }))
  }

  return (
    <div className="el-detective-section" style={{ marginTop: 20 }}>
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        🔍 {open ? 'إغلاق Grammar Detective' : 'Grammar Detective — اكتشف الأخطاء المخفية'}
      </button>
      {open && (
        <>
          <div className="el-detective-settings">
            <div className="el-detective-row">
              <span className="el-detective-label">المستوى:</span>
              {LEVELS.map(l => (
                <button key={l.key}
                  className={`el-family-chip${difficulty === l.key ? ' active' : ''}`}
                  onClick={() => setDifficulty(l.key)}>{l.label}</button>
              ))}
            </div>
            <div className="el-detective-row">
              <span className="el-detective-label">عدد الجمل:</span>
              {[2, 3, 5, 7].map(n => (
                <button key={n}
                  className={`el-family-chip${count === n ? ' active' : ''}`}
                  onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
            <button className="el-nav-btn primary" style={{ marginTop: 8 }} onClick={generate} disabled={loading}>
              {loading ? '⏳ جارٍ التوليد...' : '✨ توليد تمرين جديد'}
            </button>
          </div>
          {error && <div style={{ color: '#dc2626', fontSize: '.83rem', marginBottom: 10, padding: '6px 10px', background: '#fef2f2', borderRadius: 8 }}>⚠️ {error}</div>}
          {generated && sentences.length > 0 && (
            <>
              <div className="el-detective-desc">اضغط على الكلمة الخاطئة في كل جملة:</div>
              {sentences.map((s, sIdx) => {
                const words = s.text.split(' ')
                const foundAll = Object.entries(clicked).some(([k, v]) => k.startsWith(`${sIdx}_`) && v === 'right')
                return (
                  <div key={sIdx} className="el-detective-sentence">
                    <div className="el-detective-text">
                      {words.map((w, wIdx) => {
                        const key = `${sIdx}_${wIdx}`
                        const st = clicked[key]
                        return (
                          <span key={wIdx}>
                            <span
                              className={`el-detective-word${st === 'right' ? ' clicked-right' : st === 'wrong' ? ' clicked-wrong' : ''}`}
                              onClick={() => handleWord(sIdx, wIdx, w, s)}
                            >{w}</span>{' '}
                          </span>
                        )
                      })}
                    </div>
                    {foundAll ? (
                      <div className="el-detective-result found">
                        ✅ الصواب: <strong>{s.fix}</strong> — {s.hint}
                      </div>
                    ) : (
                      <button className="el-nav-btn" style={{ marginTop: 8, padding: '4px 12px', fontSize: '.78rem' }}
                        onClick={() => setRevealed(r => ({ ...r, [sIdx]: true }))}>
                        {revealed[sIdx] ? `💡 الخطأ: "${s.error}" → "${s.fix}" — ${s.hint}` : '💡 أرني الخطأ'}
                      </button>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  )
}


/* ─── Writing Upgrade (3 levels) ─── */
function WritingUpgrade({ text }) {
  const [level, setLevel] = useState(null)
  const [result, setResult] = useState({})
  const [loading, setLoading] = useState(false)

  const upgrade = async (lvl) => {
    setLevel(lvl)
    if (result[lvl]) return
    setLoading(true)
    try {
      const prompts = {
        b1: 'Improve this text to B1 level: clearer vocabulary, simple improvements. Show ONLY the improved text.',
        b2: 'Rewrite this text at B2 level: professional vocabulary, varied sentence structure. Show ONLY the improved text.',
        c2: 'Rewrite this text at C2/native level: sophisticated, academic, polished. Show ONLY the improved text.'
      }
      const upgraded = await aiAsk(`${prompts[lvl]}\n\nText: "${text}"`, 'You are a professional English writing coach.')
      setResult(r => ({ ...r, [lvl]: upgraded || text }))
    } catch { setResult(r => ({ ...r, [lvl]: 'تعذّر الاتصال.' })) }
    finally { setLoading(false) }
  }

  return (
    <div className="el-upgrade-section">
      <div className="el-upgrade-title">✨ ارتقِ بكتابتك — 3 مستويات</div>
      <div className="el-upgrade-levels">
        {[['b1','B1 — تحسين بسيط'],['b2','B2 — احترافي'],['c2','C2 — أكاديمي']].map(([k,lbl]) => (
          <button key={k} className={`el-upgrade-lvl-btn${level === k ? ' active' : ''}`} onClick={() => upgrade(k)}>{lbl}</button>
        ))}
      </div>
      {loading && level && !result[level] && <div style={{ textAlign: 'center', color: 'var(--el-muted)', padding: 10 }}>⏳ يُحسّن النص...</div>}
      {level && result[level] && (
        <div>
          <div className="el-upgrade-label">📝 النص المُحسَّن ({level.toUpperCase()}):</div>
          <div className="el-upgrade-result">{result[level]}</div>
        </div>
      )}
    </div>
  )
}

/* ─── AI Live Reaction after Listening score ─── */
function AILiveReaction({ score }) {
  const reactions = [
    { min: 100, emoji: '🎉', text: 'واو! نتيجة مثالية! أنت تستمع بأذن موسيقار!', color: '#dcfce7', border: '#16a34a' },
    { min: 70,  emoji: '😊', text: 'أحسنت! أداء ممتاز — فقط بعض الكلمات تحتاج مزيداً من التركيز.', color: '#dbeafe', border: '#3b82f6' },
    { min: 40,  emoji: '💪', text: 'جيد! الاستماع مهارة تتطور — استمع مرة أخرى للمقاطع الصعبة.', color: '#fef3c7', border: '#f59e0b' },
    { min: 0,   emoji: '🤗', text: 'لا بأس! كل خطأ درس. استمع مرة ثانية ببطء وركّز على البداية.', color: '#fee2e2', border: '#ef4444' },
  ]
  const r = reactions.find(rx => score.pct >= rx.min) || reactions[reactions.length - 1]
  return (
    <div className="el-reaction-box" style={{ background: r.color, borderColor: r.border }}>
      <div className="el-reaction-emoji">{r.emoji}</div>
      <div className="el-reaction-text">{r.text}</div>
    </div>
  )
}

/* ─── Vocabulary Story Generator ─── */
const LEVEL_LANG = {
  1: { cefr: 'A1', desc: 'Use VERY simple English only. Short sentences. Basic vocabulary. No complex words.' },
  2: { cefr: 'A2', desc: 'Use simple everyday English. Short clear sentences. Common words only.' },
  3: { cefr: 'B1', desc: 'Use intermediate English. Normal sentences. Avoid academic or rare vocabulary.' },
  4: { cefr: 'B2', desc: 'Use upper-intermediate English. Some complex sentences allowed.' },
  5: { cefr: 'C1', desc: 'Use advanced English with rich vocabulary and complex structures.' },
  6: { cefr: 'C2', desc: 'Use sophisticated English. Complex arguments, nuanced language.' },
}

function VocabStoryGen({ words, dayTitle, levelId, allLearnedWords = [] }) {
  const [open, setOpen] = useState(false)
  const [genre, setGenre] = useState('حوار حياة يومية')
  const [lines, setLines] = useState([])   // [{speaker, text}]
  const [loading, setLoading] = useState(false)
  const [usedWords, setUsedWords] = useState([])

  const genres = ['حوار حياة يومية', 'قصة مغامرة', 'تقرير إخباري', 'قصة رومانسية']
  const isDialogue = genre === 'حوار حياة يومية' || genre === 'قصة رومانسية'

  const generate = async () => {
    setLoading(true)
    setLines([])
    setUsedWords([])
    const wordList = words.slice(0, 10).map(w => w.word).join(', ')
    try {
      const lvl = LEVEL_LANG[Number(levelId)] || LEVEL_LANG[3]
      const prompt = isDialogue
        ? `Write a short dialogue (6-8 exchanges) between two people named Sarah and Mark. Use these English words naturally: ${wordList}. Format EXACTLY like this, one line per turn:\nSarah: ...\nMark: ...\nSarah: ...\nNo extra text before or after.`
        : `Write a short ${genre} (5-7 sentences) using these English words naturally: ${wordList}. Format as a dialogue between a narrator and characters when possible. Each paragraph on its own line. English only.`
      const raw = await aiAsk(prompt,
        `You are a creative English writer for language learners at CEFR level ${lvl.cefr}. ${lvl.desc} Topic: ${dayTitle}. Use ALL given words. Follow the format exactly.`)
      if (!raw) { setLines([{ speaker: '', text: 'الخادم لم يُرجع نصاً. جربي مرة أخرى.' }]); return }
      // Parse lines
      const parsed = raw.split('\n').filter(l => l.trim()).map(l => {
        const m = l.match(/^([A-Za-z؀-ۿ]+):\s*(.+)$/)
        return m ? { speaker: m[1], text: m[2] } : { speaker: '', text: l.trim() }
      })
      setLines(parsed)
      const allText = raw.toLowerCase()
      setUsedWords(words.filter(w => allText.includes(w.word.toLowerCase())).map(w => w.word))
    } catch (e) {
      setLines([{ speaker: '', text: 'تعذّر إنشاء القصة. (' + (e?.message || '') + ')' }])
    } finally { setLoading(false) }
  }

  const highlightLine = (text) => {
    if (!usedWords.length) return text
    const escaped = usedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
    return text.split(pattern).map((part, i) =>
      usedWords.some(w => w.toLowerCase() === part.toLowerCase())
        ? <strong key={i} className="el-story-highlight">{part}</strong>
        : <span key={i}>{part}</span>
    )
  }

  const SPEAKER_COLORS = { Sarah: '#c9858a', Mark: '#3b82f6', Narrator: '#16a34a' }

  return (
    <div className="el-story-section">
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        📖 {open ? 'إغلاق مولّد القصص' : 'Vocabulary Story Generator — تعلّم الكلمات بمحادثة'}
      </button>
      {open && (
        <>
          <div className="el-story-title">اختر نوع القصة:</div>
          <div className="el-story-settings">
            {genres.map(g => (
              <button key={g} className={`el-story-setting-btn${genre === g ? ' active' : ''}`} onClick={() => setGenre(g)}>{g}</button>
            ))}
          </div>
          <button className="el-nav-btn primary" onClick={generate} disabled={loading}>
            {loading ? '⏳ يكتب...' : '✨ اكتب لي قصة'}
          </button>
          {lines.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 8, margin: '10px 0 4px' }}>
                <button className="el-speak-btn" style={{ fontSize: '.85rem', padding: '4px 12px', borderRadius: 8 }}
                  onClick={() => {
                    window.speechSynthesis.cancel()
                    const fullText = lines.map(l => l.speaker ? `${l.speaker}: ${l.text}` : l.text).join('. ')
                    const u = new SpeechSynthesisUtterance(fullText)
                    u.lang = 'en-US'; u.rate = 0.85
                    window.speechSynthesis.speak(u)
                  }}>🔊 اقرأ القصة</button>
                <button className="el-speak-btn" style={{ fontSize: '.85rem', padding: '4px 12px', borderRadius: 8 }}
                  onClick={() => window.speechSynthesis.cancel()}>⏹ أوقف</button>
              </div>
              <div className="el-story-dialogue">
                {lines.map((l, i) => (
                  <div key={i} className={`el-story-line${l.speaker ? ' has-speaker' : ''}`}
                    style={{ '--speaker-color': SPEAKER_COLORS[l.speaker] || '#6366f1' }}>
                    {l.speaker && <span className="el-story-speaker">{l.speaker}</span>}
                    <span className="el-story-line-text">{highlightLine(l.text)}</span>
                    <button className="el-speak-btn" style={{ marginRight: 6, flexShrink: 0 }}
                      onClick={() => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(l.text); u.lang='en-US'; u.rate=0.85; window.speechSynthesis.speak(u) }}>🔊</button>
                  </div>
                ))}
              </div>
              {usedWords.length > 0 && (
                <div className="el-story-words-used">
                  ✅ الكلمات المستخدمة: {usedWords.map((w, i) => <strong key={i}>{w}{i < usedWords.length-1 ? '، ' : ''}</strong>)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Fill-the-Gap Exercise ─── */
function FillGapExercise({ words, allLearnedWords = [] }) {
  const [open, setOpen] = useState(false)
  const [useAll, setUseAll] = useState(false)
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const pool = useAll && allLearnedWords.length >= 4 ? allLearnedWords : words

  const sentences = pool.filter(w => w.example && w.example.toLowerCase().includes(w.word.toLowerCase())).slice(0, 6).map(w => ({
    sentence: w.example.replace(new RegExp(`\\b${w.word}\\b`, 'i'), '_____'),
    answer: w.word, arabic: w.arabic
  }))

  const score = sentences.filter((s, i) => (answers[i] || '').trim().toLowerCase() === s.answer.toLowerCase()).length

  return (
    <div className="el-fillgap-section">
      <button className="el-roleplay-toggle" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#15803d', marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        {open ? 'اغلق التمرين' : 'Fill-the-Gap — اكمل الفراغ من كلمات اليوم'}
      </button>
      {open && (
        <>
          {allLearnedWords.length >= 4 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button className={`el-family-chip${!useAll ? ' active' : ''}`} onClick={() => { setUseAll(false); setAnswers({}); setChecked(false) }}>كلمات اليوم</button>
              <button className={`el-family-chip${useAll ? ' active' : ''}`} onClick={() => { setUseAll(true); setAnswers({}); setChecked(false) }}>كل كلماتي ({allLearnedWords.length})</button>
            </div>
          )}
          {sentences.map((s, i) => {
            const correct = (answers[i] || '').trim().toLowerCase() === s.answer.toLowerCase()
            const parts = s.sentence.split('_____')
            return (
              <div key={i} className="el-fillgap-item">
                <div className="el-fillgap-sentence">
                  {parts[0]}
                  <input
                    className={`el-fillgap-input${checked ? (correct ? ' correct' : ' wrong') : ''}`}
                    value={answers[i] || ''} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                    disabled={checked} placeholder="..." style={{ width: 120 }}
                  />
                  {parts[1]}
                </div>
                {checked && !correct && <div className="el-fillgap-hint">الصواب: <strong>{s.answer}</strong> ({s.arabic})</div>}
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!checked
              ? <button className="el-nav-btn primary" onClick={() => setChecked(true)} disabled={!Object.keys(answers).length}>تحقق</button>
              : <><div className="el-fillgap-score">{score === sentences.length ? 'ممتاز! كل الاجابات صحيحة' : `${score} / ${sentences.length} صحيحة`}</div><button className="el-nav-btn" onClick={() => { setAnswers({}); setChecked(false) }}>مرة اخرى</button></>
            }
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Dialogue Partner (Shadowing) ─── */
function DialoguePartner({ day }) {
  const [open, setOpen] = useState(false)
  const [currentLine, setCurrentLine] = useState(0)
  const [playingKey, trigger] = useTTS()
  const { shadowing: s } = day
  const lines = [
    { role: 'A', text: s.chunk, isStudent: false },
    { role: 'B', text: s.nativeForm, isStudent: true },
    { role: 'A', text: s.steps?.[0] || 'Listen carefully and repeat.', isStudent: false },
    { role: 'B', text: s.chunk, isStudent: true },
  ]
  const advance = () => {
    if (currentLine < lines.length - 1) setCurrentLine(c => c + 1)
    else setCurrentLine(0)
  }
  return (
    <div className="el-dialogue-section">
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        🎙️ {open ? 'إغلاق Dialogue Partner' : 'Dialogue Partner — اقرأ دورك بصوت عالٍ'}
      </button>
      {open && (
        <>
          <div style={{ fontSize: '.85rem', color: 'var(--el-muted)', marginBottom: 12 }}>
            الدور B (الأخضر) هو دورك — اقرأه بصوت عالٍ. الدور A يُشغّل تلقائياً.
          </div>
          <div className="el-dialogue-script">
            {lines.map((line, i) => (
              <div key={i} className={`el-dialogue-line${line.isStudent ? ' student-role' : ''}`}>
                <div className="el-dialogue-role">{line.role}</div>
                <div className="el-dialogue-text">{line.text}</div>
                {!line.isStudent && (
                  <button className="el-speak-btn" onClick={() => trigger(line.text, 'en-US', `dial-${i}`)}>
                    {playingKey === `dial-${i}` ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="el-tts-pair" style={{ justifyContent: 'center', marginTop: 10 }}>
            <button className="el-nav-btn" onClick={() => { setCurrentLine(0); trigger(lines[0].text, 'en-US', 'dial-0') }}>🔄 أعد من البداية</button>
            <button className="el-nav-btn primary" onClick={advance}>التالي →</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: '.8rem', color: 'var(--el-accent)' }}>
            السطر الحالي: {currentLine + 1} / {lines.length}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Grammar Pattern Flashcards ─── */
function GrammarPatternFlashcards({ patterns }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  if (!patterns || !patterns.length) return null
  const card = patterns[idx % patterns.length]

  return (
    <div className="el-gflash-section">
      <button className="el-roleplay-toggle" style={{ background:'#ede9fe', borderColor:'#a78bfa', color:'#5b21b6', marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        {open ? 'اغلق بطاقات القواعد' : 'Grammar Flashcards — احفظ القاعدة بالبطاقة'}
      </button>
      {open && (
        <div className="el-gflash-wrap">
          <div className={`el-gflash-card${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
            <div className="el-gflash-inner">
              <div className="el-gflash-front">
                <div className="el-gflash-name">{card.name}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--el-muted)', marginTop: 8 }}>اضغط لرؤية الصيغة</div>
              </div>
              <div className="el-gflash-back">
                <div className="el-gflash-formula">{card.formula}</div>
                <div className="el-gflash-ex">{card.examples?.[0]}</div>
              </div>
            </div>
          </div>
          <div className="el-gflash-nav">
            <button className="el-nav-btn" onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }}>←</button>
            <span>{(idx % patterns.length) + 1} / {patterns.length}</span>
            <button className="el-nav-btn" onClick={() => { setIdx(i => i + 1); setFlipped(false) }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Writing Prompt Generator ─── */
function WritingPromptCard({ dayTitle }) {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const wpRaw = await aiAsk(`Topic: "${dayTitle}". Write 3 writing prompts as JSON: [{"level":"B1","prompt":"..."},{"level":"B2","prompt":"..."},{"level":"C2","prompt":"..."}]. JSON only.`, 'Reply ONLY with a JSON array.')
      const txt = (wpRaw || '[]').replace(/```json|```/g,'').trim()
      try { setPrompts(JSON.parse(txt)) } catch { setPrompts([
        { level: 'B1', prompt: `Write 3 sentences about ${dayTitle}.` },
        { level: 'B2', prompt: `Write a short paragraph discussing ${dayTitle}.` },
        { level: 'C2', prompt: `Write a critical analysis of ${dayTitle} using academic language.` }
      ]) }
    } catch { } finally { setLoading(false) }
  }

  const colors = { B1:'#22c55e', B2:'#3b82f6', C2:'#8b5cf6' }

  return (
    <div className="el-wprompt-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '.88rem' }}>افكار للكتابة</div>
        <button className="el-nav-btn" style={{ fontSize: '.78rem', padding: '4px 10px' }} onClick={generate} disabled={loading}>
          {loading ? '...' : 'افكار جديدة'}
        </button>
      </div>
      {prompts.map((p, i) => (
        <div key={i} className="el-wprompt-card" style={{ borderColor: colors[p.level] || '#ccc' }}>
          <span className="el-wprompt-level" style={{ background: colors[p.level] || '#ccc' }}>{p.level}</span>
          <span className="el-wprompt-text">{p.prompt}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Reading Comprehension Quiz ─── */
function ReadingComprehensionQuiz({ passage }) {
  const [open, setOpen] = useState(false)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (questions.length) { setOpen(true); return }
    setLoading(true)
    try {
      const qRaw = await aiAsk(`Passage: "${passage.slice(0, 600)}"\n\nCreate 4 MCQ questions as JSON: [{"q":"...","options":["a","b","c","d"],"correct":0,"explanation":"Arabic explanation"}]. JSON only.`, 'Reply ONLY with a valid JSON array.')
      const txt = (qRaw || '[]').replace(/```json|```/g,'').trim()
      try { setQuestions(JSON.parse(txt)) } catch { setQuestions([]) }
      setOpen(true)
    } catch { } finally { setLoading(false) }
  }

  const score = questions.filter((q, i) => answers[i] === q.correct).length

  return (
    <div style={{ marginTop: 16 }}>
      <button className="el-nav-btn primary" onClick={generate} disabled={loading}>
        {loading ? 'يولد الاسئلة...' : 'اختبار فهم المقروء (AI)'}
      </button>
      {open && questions.length > 0 && (
        <div className="el-rcquiz-wrap">
          {questions.map((q, i) => (
            <div key={i} className="el-rcquiz-q">
              <div className="el-rcquiz-qtext">{i+1}. {q.q}</div>
              <div className="el-rcquiz-options">
                {(q.options || []).map((opt, oi) => {
                  const isCorrect = checked && oi === q.correct
                  const isWrong = checked && answers[i] === oi && oi !== q.correct
                  return (
                    <button key={oi}
                      className={`el-rcquiz-opt${isCorrect ? ' correct' : isWrong ? ' wrong' : answers[i] === oi ? ' chosen' : ''}`}
                      onClick={() => !checked && setAnswers(a => ({ ...a, [i]: oi }))}
                    >{opt}</button>
                  )
                })}
              </div>
              {checked && <div className="el-rcquiz-explain">{q.explanation}</div>}
            </div>
          ))}
          {!checked
            ? <button className="el-nav-btn primary" onClick={() => setChecked(true)} disabled={Object.keys(answers).length < questions.length}>تحقق</button>
            : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="el-rcquiz-score">{score}/{questions.length}</div>
                <button className="el-nav-btn" onClick={() => { setChecked(false); setAnswers({}) }}>مرة اخرى</button>
              </div>
          }
        </div>
      )}
    </div>
  )
}

/* ─── Reading Bookmarks ─── */
function ReadingBookmarks() {
  const BOOK_KEY = 'el_bookmarks'
  const loadBM = () => { try { return JSON.parse(localStorage.getItem(BOOK_KEY) || '[]') } catch { return [] } }
  const [bookmarks, setBookmarks] = useState(loadBM)
  const [input, setInput] = useState('')

  const add = () => {
    if (!input.trim()) return
    const next = [...bookmarks, { text: input.trim(), date: Date.now() }]
    setBookmarks(next); localStorage.setItem(BOOK_KEY, JSON.stringify(next)); setInput('')
  }
  const remove = (i) => {
    const next = bookmarks.filter((_, bi) => bi !== i)
    setBookmarks(next); localStorage.setItem(BOOK_KEY, JSON.stringify(next))
  }

  return (
    <div className="el-bmark-section">
      <div className="el-bmark-title">محفوظاتي من هذه القراءة</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input className="el-buddy-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} placeholder="احفظي جملة مهمة..." style={{ flex: 1 }} />
        <button className="el-buddy-send" onClick={add}>+</button>
      </div>
      {bookmarks.map((b, i) => (
        <div key={i} className="el-bmark-item">
          <span className="el-bmark-text">"{b.text}"</span>
          <button className="el-bmark-del" onClick={() => remove(i)}>x</button>
        </div>
      ))}
    </div>
  )
}

/* ─── Pronunciation Recorder ─── */
function PronunciationRecorder({ words, allLearnedWords = [] }) {
  const [open, setOpen] = useState(false)
  const [useAll, setUseAll] = useState(false)
  const [selected, setSelected] = useState(null)
  const [recorded, setRecorded] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)
  const [diffFeedback, setDiffFeedback] = useState('')
  const pool = useAll && allLearnedWords.length > 0 ? allLearnedWords : words

  const lev = (a, b) => {
    const dp = Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0))
    for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[a.length][b.length]
  }

  const analyzeDiff = (heard, target) => {
    // Find first differing position
    const h = heard.toLowerCase(), t = target.toLowerCase()
    let firstDiff = -1
    for (let i = 0; i < Math.max(h.length, t.length); i++) {
      if (h[i] !== t[i]) { firstDiff = i; break }
    }
    if (firstDiff === -1) return ''
    const targetChar = t[firstDiff] || '(نهاية الكلمة)'
    const heardChar = h[firstDiff] || '(نهاية الكلمة)'
    // Map common English phoneme mistakes
    const hints = {
      'th': 'ضعي طرف لسانك بين أسنانك للصوت /θ/',
      'v': 'الشفة السفلى تلمس الأسنان العليا للصوت /v/',
      'p': 'أغلقي شفتيك ثم أفتحيهما بقوة للصوت /p/',
      'b': 'مثل /p/ لكن مع اهتزاز الحلق',
      'r': 'لفّي اللسان للخلف قليلاً للصوت /r/ الأمريكي',
      'w': 'ابدئي بضم الشفتين للصوت /w/',
    }
    const hint = hints[targetChar] || hints[t.slice(firstDiff, firstDiff+2)] || `ركزي على الحرف "${targetChar}" في موضع ${firstDiff + 1}`
    return hint
  }

  const record = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('يحتاج Chrome أو Edge'); return }
    const r = new SR(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=3
    r.onstart=()=>setListening(true)
    r.onresult=e=>{
      // Pick best matching alternative
      const alts = Array.from(e.results[0]).map(a => a.transcript.toLowerCase().trim())
      const target = (selected?.word||'').toLowerCase()
      const best = alts.reduce((a, b) => lev(a, target) <= lev(b, target) ? a : b)
      const conf = e.results[0][0].confidence
      setRecorded(best)
      setConfidence(Math.round(conf * 100))
      const dist = lev(best, target)
      const pct = 1 - dist / Math.max(target.length, 1)
      if (dist === 0) { setResult('match'); setDiffFeedback('') }
      else if (pct >= 0.7 || best.includes(target) || target.includes(best)) { setResult('close'); setDiffFeedback(analyzeDiff(best, target)) }
      else { setResult('try'); setDiffFeedback(analyzeDiff(best, target)) }
      setListening(false)
    }
    r.onerror=()=>setListening(false); r.onend=()=>setListening(false)
    r.start()
  }

  const speakWord = (rate=0.7) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(selected.word)
    u.lang='en-US'; u.rate=rate
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.lang==='en-US')
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="el-pronrec-section">
      <button className="el-roleplay-toggle" style={{ background:'#fce7f3', borderColor:'#f9a8d4', color:'#9d174d', marginBottom: open ? 14 : 0 }} onClick={()=>setOpen(o=>!o)}>
        {open ? 'اغلق تسجيل النطق' : 'Pronunciation Recorder — سجلي نطقك واعرفي أي صوت أخطأتِ'}
      </button>
      {open && (
        <>
          {allLearnedWords.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button className={`el-family-chip${!useAll ? ' active' : ''}`} onClick={() => { setUseAll(false); setSelected(null); setResult(null) }}>كلمات اليوم</button>
              <button className={`el-family-chip${useAll ? ' active' : ''}`} onClick={() => { setUseAll(true); setSelected(null); setResult(null) }}>كل كلماتي ({allLearnedWords.length})</button>
            </div>
          )}
          <div className="el-family-pick">
            {pool.slice(0,16).map((w,i)=>(
              <button key={i} className={`el-family-chip${selected?.word===w.word?' active':''}`}
                onClick={()=>{setSelected(w);setRecorded('');setResult(null);setDiffFeedback('')}}>{w.word}</button>
            ))}
          </div>
          {selected && (
            <div className="el-pronrec-card">
              <div className="el-pronrec-word">{selected.word}</div>
              <div className="el-pronrec-ipa">{selected.ipa}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0' }}>
                <button className="el-speak-btn" style={{fontSize:'1rem'}}
                  onClick={() => speakWord(0.6)}>🔊 بطيء</button>
                <button className="el-speak-btn" style={{fontSize:'1rem'}}
                  onClick={() => speakWord(0.9)}>🔊 عادي</button>
              </div>
              <button className={`el-pronrec-btn${listening?' recording':' record'}`} onClick={record} disabled={listening}>
                {listening ? '🔴 يسجل — تكلمي الآن...' : '🎤 سجلي نطقك'}
              </button>
              {recorded && (
                <div className="el-pronrec-result">
                  <div style={{ fontSize: '.85rem', color: 'var(--el-text2)', marginBottom: 6 }}>
                    سمعت: <strong>"{recorded}"</strong>
                    {confidence > 0 && <span style={{ marginRight: 8, color: 'var(--el-muted)', fontSize: '.78rem' }}>({confidence}% وضوح)</span>}
                  </div>
                  {result==='match' && <div className="el-pronrec-feedback match">✅ نطق مثالي! أحسنتِ تماماً</div>}
                  {(result==='close' || result==='try') && (
                    <div className={`el-pronrec-feedback ${result === 'close' ? 'close' : 'tryagain'}`}>
                      {result === 'close' ? '🟡 قريب جداً — الحرف الأحمر هو موضع الخطأ:' : '🔴 جربي مرة أخرى — شاهدي أين الخطأ:'}
                      <div className="el-pronrec-diff">
                        <div>
                          <span style={{ fontSize: '.75rem', color: 'var(--el-muted)' }}>🎯 الصواب:</span>{' '}
                          <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 2 }}>
                            {selected.word.toLowerCase().split('').map((char, i) => {
                              const heardChar = recorded.toLowerCase()[i]
                              const wrong = heardChar !== char
                              return (
                                <span key={i} style={{
                                  background: wrong ? '#fecaca' : 'transparent',
                                  color: wrong ? '#dc2626' : 'inherit',
                                  fontWeight: wrong ? 'bold' : 'normal',
                                  borderBottom: wrong ? '2px solid #dc2626' : 'none',
                                  padding: '0 1px', borderRadius: 2
                                }}>{char}</span>
                              )
                            })}
                            {recorded.length > selected.word.length && (
                              <span style={{ background: '#fee2e2', color: '#dc2626', textDecoration: 'line-through', padding: '0 1px' }}>
                                {recorded.toLowerCase().slice(selected.word.length)}
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '.75rem', color: 'var(--el-muted)' }}>👂 سمعت:</span>{' '}
                          <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 2 }}>{recorded}</span>
                        </div>
                      </div>
                      {diffFeedback && <div className="el-pronrec-hint">💡 {diffFeedback}</div>}
                      {result === 'try' && (
                        <div style={{ fontSize: '.8rem', marginTop: 4, color: 'var(--el-muted)' }}>
                          IPA: {selected.ipa} — استمعي للنموذج بشكل بطيء ثم كرري
                        </div>
                      )}
                    </div>
                  )}
                  <button className="el-nav-btn" style={{ marginTop: 8, fontSize: '.8rem' }}
                    onClick={() => { setRecorded(''); setResult(null); setDiffFeedback('') }}>
                    🔄 حاولي مرة أخرى
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── XP Pop Animation ─── */
export function XPPopAnimation({ amount, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1800); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="el-xpop-overlay">
      <div className="el-xpop-bubble">
        <div className="el-xpop-icon">⭐</div>
        <div className="el-xpop-amount">+{amount} XP</div>
      </div>
    </div>
  )
}

/* ─── Study Timer hook ─── */
export function useStudyTimer() {
  const KEY = 'el_study_time'
  const today = new Date().toISOString().slice(0, 10)
  const loadTimer = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
  const [timerData] = useState(loadTimer)
  const addTime = (seconds) => {
    const d = loadTimer(); d[today] = (d[today] || 0) + seconds
    localStorage.setItem(KEY, JSON.stringify(d))
  }
  const todayMinutes = Math.floor((timerData[today] || 0) / 60)
  const weekMinutes = Math.floor(Object.entries(timerData).filter(([d]) => new Date(d) >= new Date(Date.now() - 7*86400000)).reduce((s,[,v])=>s+v, 0) / 60)
  return { addTime, todayMinutes, weekMinutes, timerData }
}

