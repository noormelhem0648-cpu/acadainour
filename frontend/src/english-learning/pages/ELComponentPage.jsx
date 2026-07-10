import { useNavigate, useParams } from 'react-router-dom'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getDay, COMPONENTS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'
const BACKEND = 'https://acadai-backend-avvo.onrender.com'

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
      {isPlaying ? '⏹' : label || (lang === 'en-GB' ? '🇬🇧' : '🇺🇸')}
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
        headers: { 'Content-Type': 'application/json' },
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
      setAvatarState('speaking')
      speak(full, null, () => setAvatarState('idle'))
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
              {componentId === 'vocab'     && <VocabComp day={day} levelId={levelId} dayId={dayId} progress={progress} setAvatarState={setAvatarState} setBuddyMessages={setBuddyMessages} />}
              {componentId === 'grammar'   && <GrammarComp day={day} setBuddyMessages={setBuddyMessages} setAvatarState={setAvatarState} />}
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
        <span>🇺🇸 = American English</span>
        <span>🇬🇧 = British English</span>
        <span style={{ opacity: .6, fontSize: '0.8rem' }}>اضغط مرة ثانية لإيقاف الصوت ⏹</span>
      </div>

      {viewMode === 'table' && (
        <div className="el-vocab-table-wrap">
          <table className="el-vocab-table">
            <thead>
              <tr>
                <th>الكلمة</th>
                <th>🇺🇸 🇬🇧</th>
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
                        <TTSBtn text={w.example} lang="en-US" ttsKey={`us-ex-${i}`} playingKey={playingKey} trigger={trigger} label="🇺🇸 جملة" />
                        <TTSBtn text={w.example} lang="en-GB" ttsKey={`gb-ex-${i}`} playingKey={playingKey} trigger={trigger} label="🇬🇧 جملة" />
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

      <div className="el-challenge-box">
        <div className="el-challenge-title">🎙️ تحدي المحاكاة الصوتية</div>
        <p className="el-challenge-desc">استمع بلهجتين ثم كرر بصوت عالٍ 3 مرات — لاحظ الفرق بين الأمريكية والبريطانية:</p>
        <div className="el-mimic-words">
          {v.mimicChallenge.map((phrase, i) => (
            <div key={i} className="el-mimic-item">
              <span className="el-mimic-text">{phrase}</span>
              <div className="el-tts-pair">
                <TTSBtn text={phrase} lang="en-US" ttsKey={`us-mimic-${i}`} playingKey={playingKey} trigger={trigger} label="🇺🇸" />
                <TTSBtn text={phrase} lang="en-GB" ttsKey={`gb-mimic-${i}`} playingKey={playingKey} trigger={trigger} label="🇬🇧" />
              </div>
            </div>
          ))}
        </div>
        <div className="el-mimic-tip">💡 {v.mimicTip}</div>
      </div>

      {/* Teacher Corner */}
      <TeacherCorner words={v.words} dayTitle={day.title} />
      <VocabStoryGen words={v.words} dayTitle={day.title} />
      <TeachMeMode words={v.words} dayTitle={day.title} />
      <SituationalCards words={v.words} />
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

  const systemPrompt = `أنت أستاذ لغة إنجليزية خبير ومتحمس. درس اليوم: "${dayTitle}".
قائمة مفردات الدرس:
${wordList}

قواعد التعامل:
- تحدث مع الطالب بالعربية إلا إذا طلب الإنجليزية
- اشرح الكلمات بأمثلة حية وقصص تُساعد على الحفظ
- إذا أخطأ الطالب في الفهم، صحّحه بلطف واعطِه مثالاً أوضح
- إذا سألك كيف يحفظ كلمة صعبة، اعطِه تقنية مجانسة أو قصة مرتبطة
- يمكنك الإشارة لأي كلمة من القائمة أعلاه بتفصيل كامل
- اجعل الجلسة ممتعة وليست مملة`

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })),
          system: systemPrompt
        })
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.response || data.message || '...' }])
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
                <span className="el-tc-text">{m.content}</span>
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

      <button className="el-roleplay-toggle" onClick={() => setRolePlay(r => !r)}>
        🎭 {rolePlay ? 'إخفاء وضع التمثيل' : 'تدرّب بالتمثيل اللغوي'}
      </button>
      {rolePlay && <RolePlayMode day={day} setBuddyMessages={setBuddyMessages} setAvatarState={setAvatarState} />}

      <GrammarDetective day={day} />
      <DebateMode day={day} />
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
              <TTSBtn text={match.word} lang="en-US" ttsKey="lu-us" playingKey={playingKey} trigger={trigger} label="🇺🇸" />
              <TTSBtn text={match.word} lang="en-GB" ttsKey="lu-gb" playingKey={playingKey} trigger={trigger} label="🇬🇧" />
            </div>
            <div className="el-lookup-example">{match.example}</div>
          </>
        ) : (
          <>
            <div className="el-lookup-arabic" style={{ color: 'var(--el-muted)', fontSize: '.85rem' }}>الكلمة ليست في قاموس اليوم</div>
            <div className="el-tts-pair" style={{ margin: '6px 0' }}>
              <TTSBtn text={word} lang="en-US" ttsKey="lu-us" playingKey={playingKey} trigger={trigger} label="🇺🇸 نطق" />
              <TTSBtn text={word} lang="en-GB" ttsKey="lu-gb" playingKey={playingKey} trigger={trigger} label="🇬🇧 نطق" />
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
          <TTSBtn text={r.passage} lang="en-US" ttsKey="passage-us" playingKey={playingKey} trigger={trigger} label="🇺🇸 استمع" />
          <TTSBtn text={r.passage} lang="en-GB" ttsKey="passage-gb" playingKey={playingKey} trigger={trigger} label="🇬🇧 استمع" />
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
        <div className="el-tts-pair" style={{ marginTop: 8 }}>
          <TTSBtn text={l.text} lang="en-US" ttsKey="lst-us" playingKey={playingKey} trigger={trigger} label="🇺🇸 استمع" />
          <TTSBtn text={l.text} lang="en-GB" ttsKey="lst-gb" playingKey={playingKey} trigger={trigger} label="🇬🇧 استمع" />
        </div>
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
  const [sentences] = useState(() => {
    const patterns = day.grammar?.patterns || []
    return [
      { text: 'She go to school every day and studyes hard.', errors: ['go', 'studyes'], fixes: ['goes', 'studies'], hint: 'فعل المضارع مع he/she/it يأخذ s' },
      { text: 'I have went to Paris last year with my family.', errors: ['have went'], fixes: ['went'], hint: 'الفعل went استخدم وحده في الماضي البسيط' },
      { text: 'There is many students in the classroom today.', errors: ['is'], fixes: ['are'], hint: 'students جمع → نستخدم are' },
    ]
  })
  const [clicked, setClicked] = useState({}) // {sentIdx_wordIdx: 'wrong'|'right'}
  const [revealed, setRevealed] = useState({})

  const handleWord = (sIdx, wIdx, word, sentence) => {
    const key = `${sIdx}_${wIdx}`
    if (clicked[key]) return
    const isError = sentence.errors.some(e => word.toLowerCase().includes(e.toLowerCase()))
    setClicked(c => ({ ...c, [key]: isError ? 'right' : 'wrong' }))
  }

  return (
    <div className="el-detective-section" style={{ marginTop: 20 }}>
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        🔍 {open ? 'إغلاق Grammar Detective' : 'Grammar Detective — اكتشف الأخطاء المخفية'}
      </button>
      {open && (
        <>
          <div className="el-detective-desc">اضغط على الكلمة التي تعتقد أنها خاطئة نحوياً في كل جملة:</div>
          {sentences.map((s, sIdx) => {
            const words = s.text.split(' ')
            const foundAll = s.errors.every(err =>
              Object.entries(clicked).some(([k, v]) => k.startsWith(`${sIdx}_`) && v === 'right')
            )
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
                        >{w}</span>
                        {' '}
                      </span>
                    )
                  })}
                </div>
                {foundAll && (
                  <div className="el-detective-result found">
                    ✅ وجدت الخطأ! الصواب: <strong>{s.fixes.join(' / ')}</strong> — {s.hint}
                  </div>
                )}
                {!foundAll && (
                  <button
                    className="el-nav-btn"
                    style={{ marginTop: 8, padding: '4px 12px', fontSize: '.78rem' }}
                    onClick={() => setRevealed(r => ({ ...r, [sIdx]: true }))}
                  >
                    {revealed[sIdx] ? `💡 الخطأ في: ${s.errors.join(', ')} → ${s.fixes.join(', ')}` : '💡 أرني الخطأ'}
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ─── Debate Mode ─── */
function DebateMode({ day }) {
  const [open, setOpen] = useState(false)
  const [stance, setStance] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const topic = `"${day.title}" — هل هذا الموضوع مهم في حياتنا اليومية؟`

  const startDebate = async (chosenStance) => {
    setStance(chosenStance)
    setMsgs([])
    setLoading(true)
    try {
      const sys = `You are a sharp academic debater. The topic is: "${day.title}".
The student will argue ${chosenStance === 'for' ? 'FOR' : 'AGAINST'} this topic. You argue the OPPOSITE side strongly.
Keep each response to 2-3 sentences max. After each student argument, rate it: [STRONG] or [WEAK] and explain why in Arabic briefly.
Use vocabulary from today's lesson naturally. Challenge the student to use better language.`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Start the debate with your opening argument.' }], system: sys })
      })
      const data = await res.json()
      setMsgs([{ role: 'ai', text: data.response || data.message || 'Let us begin...' }])
    } catch { setMsgs([{ role: 'ai', text: 'تعذّر الاتصال.' }]) }
    finally { setLoading(false) }
  }

  const sendArg = async () => {
    if (!input.trim() || loading) return
    const userText = input; setInput('')
    const history = [...msgs, { role: 'user', text: userText }]
    setMsgs(history)
    setLoading(true)
    try {
      const sys = `You are a sharp academic debater arguing AGAINST the student on: "${day.title}". Rate their argument [STRONG] or [WEAK] first, then counter-argue in 2-3 sentences. Brief Arabic feedback.`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          system: sys
        })
      })
      const data = await res.json()
      setMsgs(h => [...h, { role: 'ai', text: data.response || data.message || '...' }])
    } catch { setMsgs(h => [...h, { role: 'ai', text: 'تعذّر الاتصال.' }]) }
    finally { setLoading(false) }
  }

  return (
    <div className="el-debate-section">
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        🗣️ {open ? 'إغلاق Debate Mode' : 'Debate Mode — جادل الـ AI باللغة الإنجليزية'}
      </button>
      {open && (
        <>
          <div className="el-debate-topic">📌 موضوع النقاش: {topic}</div>
          {!stance ? (
            <div className="el-debate-stance">
              <button className="el-debate-stance-btn" onClick={() => startDebate('for')}>👍 أنا مع الفكرة</button>
              <button className="el-debate-stance-btn" onClick={() => startDebate('against')}>👎 أنا ضد الفكرة</button>
            </div>
          ) : (
            <>
              <div className="el-debate-msgs">
                {msgs.map((m, i) => {
                  const isStrong = m.text.includes('[STRONG]')
                  const isWeak = m.text.includes('[WEAK]')
                  const clean = m.text.replace('[STRONG]', '').replace('[WEAK]', '')
                  return (
                    <div key={i} className={`el-debate-msg ${m.role}`}>
                      {clean}
                      {m.role === 'ai' && isStrong && <div><span className="el-debate-score strong">💪 حجة قوية</span></div>}
                      {m.role === 'ai' && isWeak && <div><span className="el-debate-score weak">⚠️ حجة ضعيفة</span></div>}
                    </div>
                  )
                })}
                {loading && <div className="el-debate-msg ai"><span className="el-buddy-typing"><span/><span/><span/></span></div>}
                <div ref={endRef} />
              </div>
              <div className="el-buddy-input-row" style={{ padding: 0, border: 'none', background: 'transparent', gap: 6 }}>
                <input
                  className="el-buddy-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendArg()}
                  placeholder="اكتب حجتك بالإنجليزية..."
                  disabled={loading}
                />
                <button className="el-buddy-send" onClick={sendArg} disabled={loading || !input.trim()}>↑</button>
              </div>
              <button className="el-nav-btn" style={{ marginTop: 8, fontSize: '.8rem' }} onClick={() => { setStance(null); setMsgs([]) }}>🔄 نقاش جديد</button>
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
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `${prompts[lvl]}\n\nText: "${text}"` }], system: 'You are a professional English writing coach.' })
      })
      const data = await res.json()
      setResult(r => ({ ...r, [lvl]: data.response || data.message || text }))
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
function VocabStoryGen({ words, dayTitle }) {
  const [open, setOpen] = useState(false)
  const [genre, setGenre] = useState('قصة مغامرة')
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [usedWords, setUsedWords] = useState([])

  const genres = ['قصة مغامرة', 'حوار حياة يومية', 'تقرير إخباري', 'قصة رومانسية']

  const generate = async () => {
    setLoading(true)
    setStory('')
    const wordList = words.slice(0, 8).map(w => w.word).join(', ')
    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Write a short ${genre} story (5-7 sentences) naturally using these words: ${wordList}. Make the story engaging and memorable. Write in English only.` }],
          system: `You are a creative English storyteller. Use ALL the given words naturally in context. Topic theme: ${dayTitle}`
        })
      })
      const data = await res.json()
      const text = data.response || data.message || ''
      setStory(text)
      setUsedWords(words.filter(w => text.toLowerCase().includes(w.word.toLowerCase())).map(w => w.word))
    } catch { setStory('تعذّر إنشاء القصة. تحقق من الإنترنت.') }
    finally { setLoading(false) }
  }

  const highlight = (text) => {
    if (!usedWords.length) return text
    let result = text
    usedWords.forEach(w => {
      result = result.replace(new RegExp(`\\b${w}\\b`, 'gi'), `__BOLD__${w}__/BOLD__`)
    })
    return result.split(/(__)/).map((part, i) => {
      if (part.startsWith('BOLD__')) return <strong key={i} className="el-story-highlight">{part.slice(6)}</strong>
      if (part === '__/BOLD__') return null
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="el-story-section">
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        📖 {open ? 'إغلاق مولّد القصص' : 'Vocabulary Story Generator — تعلّم الكلمات بقصة'}
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
            {loading ? '⏳ يكتب القصة...' : '✨ اكتب لي قصة'}
          </button>
          {story && (
            <>
              <div className="el-story-text">
                {typeof story === 'string' ? highlight(story) : story}
              </div>
              <div style={{ marginTop: 8, fontSize: '.8rem', color: 'var(--el-muted)' }}>
                الكلمات المستخدمة: {usedWords.join(', ') || 'يُعثر عليها في النص'}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Teach Me Mode ─── */
function TeachMeMode({ words, dayTitle }) {
  const [open, setOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(null)
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const startTeach = async (word) => {
    setSelectedWord(word)
    setMsgs([])
    setScore(null)
    setLoading(true)
    try {
      const sys = `You are a student who just learned the word "${word.word}" (${word.arabic}) in a lesson about "${dayTitle}".
Pretend you forgot what it means. Ask the student to explain it to you in English.
After their explanation, give a score /10 and 1 line of feedback in Arabic.
Ask ONE follow-up question to test deeper understanding.`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Start by saying you forgot the meaning and ask them to teach you.' }], system: sys })
      })
      const data = await res.json()
      setMsgs([{ role: 'ai', text: data.response || data.message || '...' }])
    } catch { } finally { setLoading(false) }
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userText = input; setInput('')
    const history = [...msgs, { role: 'user', text: userText }]
    setMsgs(history)
    setLoading(true)
    try {
      const sys = `You are a student who forgot the word "${selectedWord?.word}". The user is teaching you. After 1-2 exchanges, give a final score X/10 and brief Arabic feedback. Ask follow-up questions to deepen understanding.`
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          system: sys
        })
      })
      const data = await res.json()
      const reply = data.response || data.message || '...'
      setMsgs(h => [...h, { role: 'ai', text: reply }])
      const match = reply.match(/(\d+)\/10/)
      if (match) setScore(parseInt(match[1]))
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="el-teach-section">
      <button className="el-roleplay-toggle" style={{ background: '#f0f9ff', borderColor: '#38bdf8', color: '#0369a1', marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        🎓 {open ? 'إغلاق Teach Me' : 'Teach Me Mode — علّم الـ AI واثبت فهمك'}
      </button>
      {open && (
        <>
          <div style={{ fontSize: '.85rem', color: 'var(--el-text2)', marginBottom: 10 }}>اختر كلمة وعلّمها للـ AI — اذا قدرت تشرح، إذن فهمتِ فعلاً:</div>
          <div className="el-teach-word-pick">
            {words.slice(0, 10).map((w, i) => (
              <button
                key={i}
                className={`el-teach-word-chip${selectedWord?.word === w.word ? ' active' : ''}`}
                onClick={() => startTeach(w)}
              >
                {w.word}
              </button>
            ))}
          </div>
          {selectedWord && (
            <>
              <div className="el-teach-msgs">
                {msgs.map((m, i) => (
                  <div key={i} className={`el-teach-msg ${m.role}`}>{m.text}</div>
                ))}
                {loading && <div className="el-teach-msg ai"><span className="el-buddy-typing"><span/><span/><span/></span></div>}
                <div ref={endRef} />
              </div>
              {score !== null && (
                <div className="el-teach-score">
                  <span>🏅 درجتك:</span>
                  <strong style={{ color: score >= 7 ? '#15803d' : score >= 5 ? '#b45309' : '#dc2626' }}>{score}/10</strong>
                  <span>{score >= 7 ? '— أنتِ معلمة ممتازة! 🎉' : score >= 5 ? '— فهم جيد، تحتاجين مزيداً من التفاصيل' : '— راجعي الكلمة وحاولي مجدداً'}</span>
                </div>
              )}
              <div className="el-buddy-input-row" style={{ padding: 0, border: 'none', background: 'transparent', gap: 6, marginTop: 8 }}>
                <input
                  className="el-buddy-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="اشرح للـ AI بالإنجليزية..."
                  disabled={loading}
                />
                <button className="el-buddy-send" onClick={send} disabled={loading || !input.trim()}>↑</button>
              </div>
            </>
          )}
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
  // Build a simple dialogue from shadowing chunk
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
                  <button
                    className="el-speak-btn"
                    onClick={() => trigger(line.text, 'en-US', `dial-${i}`)}
                  >
                    {playingKey === `dial-${i}` ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="el-tts-pair" style={{ justifyContent: 'center', marginTop: 10 }}>
            <button className="el-nav-btn" onClick={() => { setCurrentLine(0); trigger(lines[0].text, 'en-US', 'dial-0') }}>
              🔄 أعد من البداية
            </button>
            <button className="el-nav-btn primary" onClick={advance}>
              التالي →
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: '.8rem', color: 'var(--el-accent)' }}>
            السطر الحالي: {currentLine + 1} / {lines.length}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Situational Cards ("What Would You Say?") ─── */
function SituationalCards({ words }) {
  const [open, setOpen] = useState(false)
  const [cardIdx, setCardIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const cards = [
    { scenario: 'صديقك قال شيئاً خاطئاً في محادثة عامة — كيف تُصحّحه بلطف؟', context: 'اجتماعي رسمي', answer: '"I think you might mean… Actually, what I understand is…" — استخدم I think / I understand لتليين التصحيح' },
    { scenario: 'أستاذك يشرح مفهوماً وأنت لا تفهم. كيف تطلب الإيضاح؟', context: 'أكاديمي', answer: '"Could you clarify that point? / I\'m not sure I follow — could you give an example?"' },
    { scenario: 'في مقابلة عمل، سألوك عن نقطة ضعف لديك. كيف تجيب بذكاء؟', context: 'مهني', answer: '"One area I\'m working to improve is… — I\'ve been taking steps to address this by…"' },
    { scenario: 'زميلك قاطعك وأنت تتحدث في اجتماع. كيف تستعيد دورك؟', context: 'مهني', answer: '"If I may finish my point… / Just to complete what I was saying…"' },
    { scenario: 'شخص غريب يطلب منك اتجاهات في شارع إنجليزي. كيف ترد لو ما عرفتِ؟', context: 'يومي', answer: '"I\'m afraid I\'m not from around here, but you could try Google Maps / ask at that shop."' },
  ]

  const card = cards[cardIdx % cards.length]

  return (
    <div className="el-situation-section">
      <button className="el-roleplay-toggle" style={{ marginBottom: open ? 14 : 0 }} onClick={() => setOpen(o => !o)}>
        💬 {open ? 'إغلاق البطاقات' : '"ماذا تقولين في هذا الموقف؟" — بطاقات تفاعلية'}
      </button>
      {open && (
        <>
          <div className="el-situation-card">
            <div style={{ fontSize: '.72rem', color: 'var(--el-muted)', marginBottom: 6 }}>🗂️ {card.context}</div>
            <div className="el-situation-scenario">📌 {card.scenario}</div>
            {!revealed ? (
              <button
                className="el-nav-btn primary el-situation-reveal-btn"
                onClick={() => setRevealed(true)}
              >
                💡 كيف أقولها بالإنجليزية؟
              </button>
            ) : (
              <div className="el-situation-answer">{card.answer}</div>
            )}
          </div>
          <div className="el-situation-nav">
            <button className="el-nav-btn" onClick={() => { setCardIdx(i => i + 1); setRevealed(false) }}>
              بطاقة أخرى →
            </button>
            <button className="el-nav-btn" onClick={() => setRevealed(false)}>🔄 إعادة</button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--el-muted)', marginTop: 6 }}>
            بطاقة {(cardIdx % cards.length) + 1} / {cards.length}
          </div>
        </>
      )}
    </div>
  )
}
