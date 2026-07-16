import { useState, useRef, useEffect, useCallback } from 'react'
import { API_BASE as API } from '../../config'
import { useNavigate, useParams } from 'react-router-dom'
import { getDay } from '../data/curriculum'
import { getRolePlayTopic } from '../data/roleplay_topics'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

/* ── Non-streaming AI call for structured data ── */
async function aiAsk(message, systemPrompt) {
  const token = localStorage.getItem('noura_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}/english-tutor/stream`, {
    method: 'POST', headers,
    body: JSON.stringify({ message, history: [], subject_info: systemPrompt })
  })
  if (!res.ok) throw new Error(res.status)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop()
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

/* ── TTS helpers ── */
let _activeSynth = null

function stopTTS() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  _activeSynth = null
}

const _RP_VOICE_PRIORITY = [
  'Aria Online (Natural)', 'Jenny Online (Natural)', 'Guy Online (Natural)',
  'Ana Online (Natural)', 'Emma Online (Natural)', 'Eric Online (Natural)',
  'Michelle Online (Natural)', 'Roger Online (Natural)',
  'Microsoft Aria', 'Microsoft Jenny', 'Microsoft David',
  'Google US English', 'Samantha', 'Alex', 'Ava',
]
let _rpVoiceCache = null
function getBestVoice() {
  if (_rpVoiceCache) return _rpVoiceCache
  const voices = window.speechSynthesis.getVoices()
  for (const name of _RP_VOICE_PRIORITY) {
    const v = voices.find(v => v.name.includes(name))
    if (v) { _rpVoiceCache = v; return v }
  }
  const online = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('natural')))
  if (online) { _rpVoiceCache = online; return online }
  return voices.find(v => v.lang === 'en-US') || null
}

function speakText(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  stopTTS()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  const voice = getBestVoice()
  if (voice) {
    u.voice = voice
    const isNatural = voice.name.toLowerCase().includes('online') || voice.name.toLowerCase().includes('natural') || voice.name.toLowerCase().includes('google')
    u.rate = isNatural ? 0.93 : 0.85
  } else {
    u.rate = 0.85
  }
  _activeSynth = u
  u.onend  = () => { _activeSynth = null; onEnd?.() }
  u.onerror = () => { _activeSynth = null; onEnd?.() }
  window.speechSynthesis.speak(u)
}

/* ── AI reaction messages ── */
function getReaction(score, streak) {
  if (score >= 90) return { msg: 'وااو! إجابة ممتازة جداً! 🎉', color: '#10b981', emoji: '🌟' }
  if (score >= 70) return { msg: 'أحسنت! واضح إنك فاهم الموضوع 💪', color: '#3b82f6', emoji: '✅' }
  if (score >= 50) return { msg: 'كويس! بس في مجال للتحسين — جرب مرة ثانية 🔁', color: '#f59e0b', emoji: '💡' }
  return { msg: 'لا تستسلم! كل محاولة أفضل من السابقة 🤗', color: '#ef4444', emoji: '💪' }
}

export default function ELRolePlayPage({ darkMode, setDarkMode }) {
  const { levelId, dayId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const day = getDay(levelId, Number(dayId))
  const topic = getRolePlayTopic(Number(dayId))

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [phase, setPhase] = useState('intro') // intro | chat | review
  const [roundCount, setRoundCount] = useState(0)
  const [lastReaction, setLastReaction] = useState(null)
  const [showTips, setShowTips] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startRolePlay = () => {
    const aiOpener = topic.starterLine
    setMessages([{ role: 'ai', content: aiOpener, ttsText: aiOpener }])
    setPhase('chat')
    if (ttsEnabled) {
      setTtsPlaying(true)
      speakText(aiOpener, () => setTtsPlaying(false))
    }
    progress.addXP?.('debateRound')
  }

  const rpAbortRef = useRef(null)
  useEffect(() => () => rpAbortRef.current?.abort(), [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    stopTTS()
    setTtsPlaying(false)

    rpAbortRef.current?.abort()
    rpAbortRef.current = new AbortController()
    const signal = rpAbortRef.current.signal

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages([...newMessages, { role: 'ai', content: '', typing: true }])
    setLoading(true)
    setRoundCount(r => r + 1)

    // Step 1: natural in-character streaming reply
    const roleplaySys = `You are ${topic.aiRole}. ${topic.aiPersonality}. Setting: ${topic.setting}.
Stay completely in character. Keep your response to 1-2 sentences. Encourage use of: ${topic.focusWords.join(', ')}.`

    // C-7 fix: include auth header in streaming roleplay fetch
    const token = localStorage.getItem('noura_token')
    const rpHeaders = { 'Content-Type': 'application/json' }
    if (token) rpHeaders['Authorization'] = `Bearer ${token}`

    try {
      const res = await fetch(`${API}/english-tutor/stream`, {
        method: 'POST',
        headers: rpHeaders,
        signal,
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
          subject_info: roleplaySys
        })
      })

      if (!res.ok) throw new Error('server')

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
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'ai', content: full, typing: false }
              return copy
            })
          }
        }
      }

      const replyText = full.trim()

      // H-5: fire TTS and grammar correction in parallel
      if (ttsEnabled && replyText) {
        setTtsPlaying(true)
        speakText(replyText, () => setTtsPlaying(false))
      }

      // Step 2: grammar correction (runs while TTS plays)
      let correction = null
      try {
        const corrPrompt = `"${text}" ← هذه الجملة كتبها طالب إنجليزي.
ابحث عن خطأ واحد فقط (إملاء أو قواعد).
أجب بهذا الشكل الحرفي فقط بدون أي نص إضافي:
WRONG: [الكلمة أو العبارة الخاطئة من الجملة، أو: none]
RIGHT: [النسخة الصحيحة، أو: none]
WHY: [جملة عربية قصيرة تشرح السبب]`
        const corrRaw = await aiAsk(corrPrompt, 'أنت مصحح لغوي. أجب فقط بالسطور الثلاثة المطلوبة.')
        const wM = corrRaw.match(/WRONG:\s*(.+)/i)
        const rM = corrRaw.match(/RIGHT:\s*(.+)/i)
        const yM = corrRaw.match(/WHY:\s*(.+)/i)
        if (wM && wM[1].trim().toLowerCase() !== 'none' && wM[1].trim() !== '') {
          correction = {
            error: wM[1].trim().replace(/["""]/g, ''),
            fix: rM?.[1].trim().replace(/["""]/g, '') || '',
            note: yM?.[1].trim() || ''
          }
        } else if (corrRaw.trim() && !corrRaw.toLowerCase().includes('none') && corrRaw.length < 250) {
          const lines = corrRaw.split('\n').map(l => l.trim()).filter(Boolean)
          const noteLine = lines.find(l => /[؀-ۿ]/.test(l))
          const engLines = lines.filter(l => !/[؀-ۿ]/.test(l) && l.length < 60)
          if (engLines.length >= 2) {
            correction = { error: engLines[0], fix: engLines[1], note: noteLine || '' }
          } else if (noteLine) {
            correction = { error: '', fix: '', note: noteLine }
          }
        }
      } catch { /* correction is optional */ }

      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'ai', content: replyText, correction, typing: false }
        return copy
      })

      // Calculate rough reaction score based on input length and vocabulary use
      const usedFocusWords = topic.focusWords.filter(w => text.toLowerCase().includes(w.toLowerCase())).length
      const score = Math.min(100, 40 + text.split(' ').length * 3 + usedFocusWords * 15)
      setLastReaction(getReaction(score, roundCount))

      if (roundCount >= 7) {
        setTimeout(() => setPhase('review'), 2000)
      }

    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'ai', content: '⚠️ خطأ في الاتصال — تأكد من الإنترنت وحاول مرة ثانية.', typing: false }
          return copy
        })
      }
    }
    setLoading(false)
    inputRef.current?.focus()
  }, [input, messages, loading, topic, levelId, dayId, day, ttsEnabled, roundCount])

  if (!day) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Not found.</p></div></div>

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page el-rp-page">

        {/* Header */}
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => { stopTTS(); navigate(`${EL}/level/${levelId}/day/${dayId}`) }}>←</button>
          <div className="el-rp-header-center">
            <span className="el-rp-icon">{topic.icon}</span>
            <div>
              <div className="el-rp-title">{topic.scenario}</div>
              <div className="el-rp-subtitle">{topic.scenarioAr}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={'el-icon-btn' + (ttsEnabled ? ' active' : '')}
              onClick={() => { if (ttsEnabled) stopTTS(); setTtsEnabled(e => !e) }}
              title={ttsEnabled ? 'أوقف صوت AI' : 'شغّل صوت AI'}
            >
              {ttsPlaying ? '🔊' : ttsEnabled ? '🔈' : '🔇'}
            </button>
            <button className="el-icon-btn" onClick={() => stopTTS() || setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="el-rp-intro">
            <div className="el-rp-scene-card">
              <div className="el-rp-scene-icon">{topic.icon}</div>
              <h2 className="el-rp-scene-title">{topic.scenario}</h2>
              <p className="el-rp-scene-setting">{topic.setting}</p>
              <div className="el-rp-scene-ar">{topic.settingAr}</div>

              <div className="el-rp-role-info">
                <div className="el-rp-role-you">
                  <span className="el-rp-role-label">أنت</span>
                  <span className="el-rp-role-desc">تلعب دورك الطبيعي</span>
                </div>
                <div className="el-rp-role-ai">
                  <span className="el-rp-role-label">AI</span>
                  <span className="el-rp-role-desc">{topic.aiRole}</span>
                  <span className="el-rp-role-ar">{topic.aiRoleAr}</span>
                </div>
              </div>

              <div className="el-rp-focus-words">
                <div className="el-rp-focus-label">🎯 كلمات الهدف اليوم:</div>
                <div className="el-rp-focus-chips">
                  {topic.focusWords.map(w => <span key={w} className="el-rp-word-chip">{w}</span>)}
                </div>
              </div>

              <div className="el-rp-starter-preview">
                <div className="el-rp-starter-label">سيبدأ {topic.aiRole} بقول:</div>
                <div className="el-rp-starter-text">"{topic.starterLineAr}"</div>
              </div>

              <button className="el-nav-btn primary el-rp-start-btn" onClick={startRolePlay}>
                🎭 ابدأ التمثيل اللغوي
              </button>

              <button className="el-rp-tips-toggle" onClick={() => setShowTips(s => !s)}>
                💡 {showTips ? 'إخفاء' : 'عرض'} النصائح
              </button>
              {showTips && (
                <div className="el-rp-tips">
                  {topic.tips.map((t, i) => <div key={i} className="el-rp-tip">• {t}</div>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Phase */}
        {phase === 'chat' && (
          <>
            <div className="el-rp-focus-bar">
              {topic.focusWords.map(w => <span key={w} className="el-rp-word-chip mini">{w}</span>)}
              <span className="el-rp-round-count">{roundCount}/8 جولات</span>
            </div>

            <div className="el-rp-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`el-rp-msg-row ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="el-rp-avatar">{topic.icon}</div>
                  )}
                  <div className={`el-rp-bubble ${msg.role}`}>
                    {msg.role === 'ai' && <div className="el-rp-bubble-name">{topic.aiRole}</div>}
                    {msg.typing ? (
                      <span className="el-typing-dots"><span /><span /><span /></span>
                    ) : (
                      <div className="el-rp-bubble-text">{msg.content}</div>
                    )}
                    {msg.role === 'ai' && msg.content && !msg.typing && (
                      <button
                        className="el-rp-tts-btn"
                        onClick={() => {
                          if (ttsPlaying) { stopTTS(); setTtsPlaying(false) }
                          else { setTtsPlaying(true); speakText(msg.content, () => setTtsPlaying(false)) }
                        }}
                      >
                        {ttsPlaying ? '⏹' : '🔊'}
                      </button>
                    )}
                    {msg.role === 'ai' && msg.correction && (
                      <div className="el-rp-correction-wrap" style={{ marginTop: 8 }}>
                        {msg.correction.error && <div className="el-rp-correction-error">❌ {msg.correction.error}</div>}
                        {msg.correction.fix && <div className="el-rp-correction-fix">✅ {msg.correction.fix}</div>}
                        {msg.correction.note && <div className="el-rp-correction-note">💡 {msg.correction.note}</div>}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && <div className="el-rp-avatar user">👤</div>}
                </div>
              ))}

              {lastReaction && (
                <div className="el-rp-reaction" style={{ borderColor: lastReaction.color }}>
                  <span>{lastReaction.emoji}</span> {lastReaction.msg}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="el-rp-input-row">
              <input
                ref={inputRef}
                className="el-rp-input"
                placeholder="ردّ على الشخصية بالإنجليزية..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                className="el-rp-stop-btn"
                onClick={() => { stopTTS(); setTtsPlaying(false) }}
                title="أوقف الصوت"
              >
                ⏹
              </button>
              <button className="el-rp-send-btn" onClick={send} disabled={loading || !input.trim()}>
                {loading ? '⏳' : '↑'}
              </button>
            </div>

            <div className="el-rp-end-row">
              <button className="el-rp-end-btn" onClick={() => { stopTTS(); setPhase('review') }}>
                إنهاء الجلسة والمراجعة →
              </button>
            </div>
          </>
        )}

        {/* Review Phase */}
        {phase === 'review' && (
          <div className="el-rp-review">
            <div className="el-rp-review-card">
              <div className="el-rp-review-icon">🎭</div>
              <h2>انتهت الجلسة!</h2>
              <div className="el-rp-review-stats">
                <div className="el-rp-stat">
                  <div className="el-rp-stat-num">{roundCount}</div>
                  <div className="el-rp-stat-label">جولات</div>
                </div>
                <div className="el-rp-stat">
                  <div className="el-rp-stat-num">{topic.focusWords.filter(w => messages.some(m => m.role === 'user' && m.content.toLowerCase().includes(w.toLowerCase()))).length}/{topic.focusWords.length}</div>
                  <div className="el-rp-stat-label">كلمات مستخدمة</div>
                </div>
              </div>

              <div className="el-rp-used-words">
                <div className="el-rp-used-label">الكلمات التي استخدمتها:</div>
                <div className="el-rp-focus-chips">
                  {topic.focusWords.map(w => {
                    const used = messages.some(m => m.role === 'user' && m.content.toLowerCase().includes(w.toLowerCase()))
                    return <span key={w} className={`el-rp-word-chip ${used ? 'used' : 'missed'}`}>{used ? '✓' : '✗'} {w}</span>
                  })}
                </div>
              </div>

              <div className="el-rp-review-tips">
                <div className="el-rp-used-label">نصائح للمرة القادمة:</div>
                {topic.tips.map((t, i) => <div key={i} className="el-rp-tip">• {t}</div>)}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="el-nav-btn" onClick={() => { setMessages([]); setRoundCount(0); setLastReaction(null); setPhase('intro') }}>
                  🔄 مرة ثانية
                </button>
                <button className="el-nav-btn primary" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}>
                  ← العودة لليوم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
