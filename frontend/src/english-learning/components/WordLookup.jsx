import { useState, useEffect, useRef, useCallback } from 'react'

const API = 'https://acadai-backend-avvo.onrender.com'

async function lookupWord(word) {
  const token = localStorage.getItem('acadai_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const prompt = `Give a concise dictionary entry for the English word: "${word}"
Reply in EXACTLY this format (no extra text):
ARABIC: [Arabic meaning, 2-4 words max]
IPA: [IPA pronunciation like /wɜːrd/]
US: [US pronunciation spelled out like "wurd"]
UK: [UK pronunciation spelled out like "wuhd"]
POS: [part of speech: noun/verb/adjective/adverb/etc]
EXAMPLE: [one short example sentence using the word]`

  const res = await fetch(`${API}/english-tutor/stream`, {
    method: 'POST', headers,
    body: JSON.stringify({ message: prompt, history: [], subject_info: 'You are a dictionary. Return only the labeled lines, no extra text.' })
  })
  if (!res.ok) throw new Error('lookup failed')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop()
    for (const line of lines) {
      if (line.startsWith('data: ')) { const c = line.slice(6); if (c !== '[DONE]') full += c }
    }
  }
  const get = (label) => { const m = full.match(new RegExp(`${label}:\\s*(.+)`, 'i')); return m ? m[1].trim() : '' }
  return {
    word,
    arabic: get('ARABIC'),
    ipa: get('IPA'),
    us: get('US'),
    uk: get('UK'),
    pos: get('POS'),
    example: get('EXAMPLE'),
  }
}

export default function WordLookupProvider({ children }) {
  const [popup, setPopup] = useState(null) // {x, y, word, data, loading}
  const popupRef = useRef(null)
  const pendingRef = useRef(null)

  const closePopup = useCallback(() => setPopup(null), [])

  useEffect(() => {
    const handleClick = async (e) => {
      // Close if clicking inside popup
      if (popupRef.current?.contains(e.target)) return
      // Close if clicking outside
      if (popup) { closePopup(); return }

      const el = e.target
      // Only trigger on text nodes inside el-app
      if (!el.closest('.el-app')) return
      // Skip buttons, inputs, etc.
      if (['BUTTON', 'INPUT', 'TEXTAREA', 'A', 'SELECT'].includes(el.tagName)) return

      // Get the word under click
      const selection = window.getSelection()
      let word = ''
      if (selection && selection.toString().trim().length > 0) {
        word = selection.toString().trim().split(/\s+/)[0]
      } else {
        // Get word from text node at click position
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
        if (range) {
          const node = range.startContainer
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent
            const offset = range.startOffset
            const wordMatch = text.slice(0, offset + 1).match(/[a-zA-Z']+$/)
            const wordStart = wordMatch ? wordMatch[0] : ''
            const afterMatch = text.slice(offset).match(/^[a-zA-Z']*/)
            const wordEnd = afterMatch ? afterMatch[0] : ''
            word = (wordStart + wordEnd).replace(/^'+|'+$/g, '')
          }
        }
      }

      if (!word || word.length < 2 || !/^[a-zA-Z]/.test(word)) return

      const x = Math.min(e.clientX, window.innerWidth - 240)
      const y = e.clientY + window.scrollY

      setPopup({ x, y, word, data: null, loading: true })

      if (pendingRef.current) clearTimeout(pendingRef.current)
      try {
        const data = await lookupWord(word)
        setPopup(prev => prev?.word === word ? { ...prev, data, loading: false } : prev)
      } catch {
        setPopup(prev => prev?.word === word ? { ...prev, data: { word, arabic: '...', ipa: '', us: '', uk: '', pos: '', example: '' }, loading: false } : prev)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [popup, closePopup])

  return (
    <>
      {children}
      {popup && (
        <div
          ref={popupRef}
          className="el-word-popup"
          style={{
            position: 'fixed',
            left: Math.min(popup.x, window.innerWidth - 260),
            top: popup.y - window.scrollY - 10,
            transform: 'translateY(-100%)',
            zIndex: 9999,
          }}
        >
          <div className="el-wp-header">
            <span className="el-wp-word">{popup.word}</span>
            {popup.data?.pos && <span className="el-wp-pos">{popup.data.pos}</span>}
            <button className="el-wp-close" onClick={closePopup}>&#x2715;</button>
          </div>
          {popup.loading ? (
            <div className="el-wp-loading">&#x23F3; جارٍ البحث...</div>
          ) : (
            <>
              {popup.data?.arabic && <div className="el-wp-arabic">{popup.data.arabic}</div>}
              {popup.data?.ipa && <div className="el-wp-ipa">{popup.data.ipa}</div>}
              <div className="el-wp-tts-row">
                {popup.data?.us && (
                  <button className="el-wp-tts" onClick={() => { const u = new SpeechSynthesisUtterance(popup.word); u.lang='en-US'; window.speechSynthesis.speak(u) }}>
                    🔊 US: {popup.data.us}
                  </button>
                )}
                {popup.data?.uk && (
                  <button className="el-wp-tts" onClick={() => { const u = new SpeechSynthesisUtterance(popup.word); u.lang='en-GB'; window.speechSynthesis.speak(u) }}>
                    🔊 UK: {popup.data.uk}
                  </button>
                )}
              </div>
              {popup.data?.example && <div className="el-wp-example">"{popup.data.example}"</div>}
            </>
          )}
        </div>
      )}
    </>
  )
}
