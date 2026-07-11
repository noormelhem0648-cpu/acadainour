import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDay } from '../data/curriculum'
import { getRolePlayTopic } from '../data/roleplay_topics'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const API = 'https://acadai-backend-avvo.onrender.com'
const EL = '/english-learning'

/* ── TTS helpers ── */
let _activeSynth = null

function stopTTS() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  _activeSynth = null
}

function speakText(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  stopTTS()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = 0.88
  const voices = window.speechSynthesis.getVoices()
  const v = voices.find(v => v.lang === 'en-US' && !v.name.includes('Google')) || voices.find(v => v.lang === 'en-US')
  if (v) u.voice = v
  _activeSynth = u
  u.onend = () => { _activeSynth = null; onEnd?.() }
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

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    stopTTS()
    setTtsPlaying(false)

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages([...newMessages, { role: 'ai', content: '', typing: true }])
    setLoading(true)
    setRoundCount(r => r + 1)

    const systemPrompt = `You are playing the role of: ${topic.aiRole}. Personality: ${topic.aiPersonality}.
Setting: ${topic.setting}
Day vocabulary focus: ${topic.focusWords.join(', ')}
Student's level: ${levelId} - Day ${dayId}: ${day?.title || ''}

RULES:
1. Stay completely in character as ${topic.aiRole}. Keep responses short (2-3 sentences).
2. Encourage use of today's vocabulary: ${topic.focusWords.join(', ')}
3. After your in-character response, check the student's last message for grammar/spelling mistakes.
4. Output EXACTLY in this format (no deviation):
REPLY: your in-character response here
ERROR: the wrong word or phrase the student wrote (or "none" if correct)
FIX: the correct version
NOTE: one short Arabic explanation`

    try {
      const res = await fetch(`${API}/english-tutor/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
          subject_info: systemPrompt
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
            // Show streaming text — extract REPLY part if available, else show raw
            const streamReply = full.match(/REPLY:\s*(.+?)(?=\nERROR:|$)/s)
            const displayText = streamReply ? streamReply[1].trim() : full.replace(/^REPLY:\s*/i, '')
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'ai', content: displayText, typing: false }
              return copy
            })
          }
        }
      }

      // Parse structured response
      const replyMatch = full.match(/REPLY:\s*(.+?)(?=\nERROR:|$)/s)
      const errorMatch = full.match(/ERROR:\s*(.+?)(?=\nFIX:|$)/s)
      const fixMatch   = full.match(/FIX:\s*(.+?)(?=\nNOTE:|$)/s)
      const noteMatch  = full.match(/NOTE:\s*(.+?)$/s)
      const replyText = replyMatch ? replyMatch[1].trim() : full.split('💬')[0].trim() || full
      const correction = errorMatch && errorMatch[1].trim().toLowerCase() !== 'none'
        ? { error: errorMatch[1].trim(), fix: fixMatch?.[1].trim() || '', note: noteMatch?.[1].trim() || '' }
        : null
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'ai', content: replyText, correction, typing: false }
        return copy
      })
      if (ttsEnabled && replyText) {
        setTtsPlaying(true)
        speakText(replyText, () => setTtsPlaying(false))
      }

      // Calculate rough reaction score based on input length and vocabulary use
      const usedFocusWords = topic.focusWords.filter(w => text.toLowerCase().includes(w.toLowerCase())).length
      const score = Math.min(100, 40 + text.split(' ').length * 3 + usedFocusWords * 15)
      setLastReaction(getReaction(score, roundCount))

      if (roundCount >= 7) {
        setTimeout(() => setPhase('review'), 2000)
      }

    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'ai', content: '⚠️ خطأ في الاتصال — تأكد من الإنترنت وحاول مرة ثانية.', typing: false }
        return copy
      })
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
                        <div className="el-rp-correction-error">❌ {msg.correction.error}</div>
                        <div className="el-rp-correction-fix">✅ {msg.correction.fix}</div>
                        {msg.correction.note && <div className="el-rp-correction-note">{msg.correction.note}</div>}
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
