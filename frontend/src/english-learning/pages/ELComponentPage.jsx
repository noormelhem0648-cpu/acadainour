import { useNavigate, useParams } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { getDay, COMPONENTS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function ELComponentPage({ darkMode, setDarkMode }) {
  const { levelId, dayId, componentId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()
  const day = getDay(levelId, Number(dayId))
  const compIndex = COMPONENTS.findIndex(c => c.id === componentId)
  const comp = COMPONENTS[compIndex]

  if (!day || !comp) return <div className="el-app"><div className="el-page"><p style={{ padding: 32 }}>Not found.</p></div></div>

  const progressKey = `${levelId}-${dayId}-${componentId}`
  const done = progress.isDone(progressKey)

  const handleDone = () => {
    progress.markDone(progressKey)
    const next = COMPONENTS[compIndex + 1]
    if (next) navigate(`${EL}/level/${levelId}/day/${dayId}/${next.id}`)
    else navigate(`${EL}/level/${levelId}/day/${dayId}`)
  }

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page el-comp-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}`)}>←</button>
          <span className="el-top-bar-title">{comp.icon} {comp.labelEn}</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
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

        <div className="el-comp-body">
          {componentId === 'vocab'     && <VocabComp day={day} />}
          {componentId === 'grammar'   && <GrammarComp day={day} />}
          {componentId === 'reading'   && <ReadingComp day={day} />}
          {componentId === 'listening' && <ListeningComp day={day} />}
          {componentId === 'shadowing' && <ShadowingComp day={day} />}
          {componentId === 'writing'   && <WritingComp day={day} levelId={levelId} dayId={dayId} navigate={navigate} />}
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

/* ─── Grammar ─── */
function GrammarComp({ day }) {
  const [shown, setShown] = useState({})
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

/* ─── Writing & AI Chat ─── */
function WritingComp({ day, levelId, dayId, navigate }) {
  const [responses, setResponses] = useState({})
  const [copied, setCopied] = useState(false)
  const { writing: w } = day

  const copyPrompt = () => {
    navigator.clipboard.writeText(w.companionPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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
            onChange={e => setResponses(r => ({ ...r, [i]: e.target.value }))}
            rows={4}
          />
        </div>
      ))}

      <div className="el-companion-section">
        <div className="el-companion-title">🤖 رفيق المحادثة الحية</div>
        <p className="el-companion-desc">
          انسخ هذا البرومبت، افتح المحادثة مع Noura AI، والصقه لتبدأ محادثة حية مخصصة لدرس اليوم.
        </p>
        <div className="el-prompt-preview">
          <pre className="el-prompt-text">{w.companionPrompt}</pre>
        </div>
        <div className="el-companion-btns">
          <button className="el-nav-btn" onClick={copyPrompt}>
            {copied ? '✓ تم النسخ' : '📋 انسخ البرومبت'}
          </button>
          <button className="el-nav-btn primary" onClick={() => navigate(`${EL}/level/${levelId}/day/${dayId}/chat`)}>
            💬 افتح المحادثة الحية
          </button>
        </div>
      </div>
    </div>
  )
}
