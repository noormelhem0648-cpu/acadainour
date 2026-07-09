import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDay } from '../data/curriculum'
import '../EL.css'

const API = 'https://acadai-backend-avvo.onrender.com'
const EL = '/english-learning'

export default function ELChatPage({ darkMode, setDarkMode }) {
  const { levelId, dayId } = useParams()
  const navigate = useNavigate()
  const day = getDay(levelId, Number(dayId))

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!day) return
    setMessages([{ role: 'assistant', content: getGreeting(day) }])
  }, [day])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!day) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Not found.</p></div></div>

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg = { role: 'user', content: text }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    const history = [...messages, userMsg]
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const body = {
        message: text,
        history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
        subject_info: `English Learning — ${levelId} Day ${dayId}: ${day.title}. SYSTEM: ${day.writing.companionPrompt}`
      }

      const res = await fetch(`${API}/english-tutor/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Server error')

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
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: full }
              return copy
            })
          }
        }
      }
    } catch {
      setMessages(m => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: '⚠️ خطأ بالاتصال — تأكد من الإنترنت وحاول مرة ثانية.' }
        return copy
      })
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const clear = () => setMessages([{ role: 'assistant', content: getGreeting(day) }])

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page el-chat-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/writing`)}>←</button>
          <div className="el-chat-header-info">
            <span className="el-chat-header-title">💬 المحادثة الحية</span>
            <span className="el-chat-header-sub">Day {dayId}: {day.title}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="el-icon-btn" title="محادثة جديدة" onClick={clear}>🔄</button>
            <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <div className="el-chat-tip">
          💡 الـ AI مدرّب خصيصاً على مفردات وقواعد اليوم {dayId}. تحدث معه بالإنجليزية وسيصحح لك بلطف!
        </div>

        <div className="el-chat-messages">
          {messages.map((msg, i) => {
            const isAI = msg.role === 'assistant'
            const isTyping = isAI && loading && i === messages.length - 1 && !msg.content
            return (
              <div key={i} className={`el-msg-row ${isAI ? 'ai' : 'user'}`}>
                {isAI && (
                  <div className="el-msg-avatar ai-avatar" title="Noura AI">N</div>
                )}
                <div className={`el-bubble ${isAI ? 'ai' : 'user'}`}>
                  {isAI && <div className="el-bubble-name">Noura AI 🎓</div>}
                  {isTyping
                    ? <span className="el-typing-dots"><span/><span/><span/></span>
                    : <div className="el-bubble-text">{msg.content}</div>
                  }
                </div>
                {!isAI && (
                  <div className="el-msg-avatar user-avatar" title="أنت">أ</div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="el-chat-input-row">
          <input
            ref={inputRef}
            className="el-chat-input"
            placeholder="اكتب بالإنجليزية وابدأ المحادثة..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button className="el-send-btn" onClick={send} disabled={loading || !input.trim()}>
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getGreeting(day) {
  return `Hello! I'm your English tutor for Day ${day.id}: "${day.title}" 🎓

Today's topic: ${day.subtitle}

I'm here to practice with you using ONLY today's vocabulary and grammar. I'll correct you gently if you make a mistake.

Ready? Let's start! ${day.writing.companionPrompt.match(/Start.*?:\s*"(.+?)"/s)?.[1] || "Say hello and let's practice!"}`
}
