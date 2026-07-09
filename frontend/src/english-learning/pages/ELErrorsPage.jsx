import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

const COMPONENT_LABELS = {
  listening: { label: 'الاستماع', icon: '🎧', tip: 'ركّز على الاستماع للنصوص البطيئة قبل الإجابة.' },
  vocab:     { label: 'المفردات', icon: '📚', tip: 'راجع قائمة كلماتك الصعبة يومياً.' },
  grammar:   { label: 'القواعد',  icon: '📐', tip: 'أعد قراءة الصيغة والأمثلة قبل التمرين.' },
  reading:   { label: 'القراءة',  icon: '📖', tip: 'اقرأ الجملة كاملة قبل اختيار الإجابة.' },
  writing:   { label: 'الكتابة', icon: '✍️', tip: 'راجع الجملة مرتين قبل الإرسال.' },
  shadowing: { label: 'الشادونج', icon: '🎙️', tip: 'كرر الجملة 3 مرات بعد السماع.' },
}

function Bar({ pct, color }) {
  return (
    <div className="el-err-bar-bg">
      <div className="el-err-bar-fill" style={{ width: pct + '%', background: color }} />
    </div>
  )
}

function getColor(pct) {
  if (pct < 20) return '#16a34a'
  if (pct < 50) return '#f97316'
  return '#dc2626'
}

export default function ELErrorsPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const { errors, resetAll } = useProgress()

  const entries = Object.entries(errors)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const worst = sorted[0]?.[0]

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">📊 لوحة الأخطاء</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-errors-wrap">
          {total === 0 ? (
            <div className="el-ledger-empty">
              <div style={{ fontSize: '3rem' }}>🎉</div>
              <p>لا أخطاء مسجّلة بعد!</p>
              <p style={{ color: 'var(--el-muted)', fontSize: '.9rem' }}>
                تُسجَّل الأخطاء تلقائياً عند إجابة الاستماع والمفردات.
              </p>
              <button className="el-nav-btn primary" onClick={() => navigate(EL)}>ابدأ التعلم</button>
            </div>
          ) : (
            <>
              <div className="el-errors-hero">
                <div className="el-errors-total">{total}</div>
                <div className="el-errors-total-label">إجمالي الأخطاء المسجّلة</div>
                {worst && (
                  <div className="el-errors-worst">
                    {COMPONENT_LABELS[worst]?.icon} أكثر أخطائك في <strong>{COMPONENT_LABELS[worst]?.label || worst}</strong>
                  </div>
                )}
              </div>

              <div className="el-errors-grid">
                {sorted.map(([comp, count]) => {
                  const pct = Math.round((count / total) * 100)
                  const info = COMPONENT_LABELS[comp] || { label: comp, icon: '❓', tip: '' }
                  const color = getColor(pct)
                  return (
                    <div key={comp} className="el-errors-card">
                      <div className="el-errors-card-top">
                        <span className="el-errors-icon">{info.icon}</span>
                        <span className="el-errors-label">{info.label}</span>
                        <span className="el-errors-count" style={{ color }}>{count} خطأ</span>
                      </div>
                      <Bar pct={pct} color={color} />
                      <div className="el-errors-pct" style={{ color }}>{pct}% من أخطائك</div>
                      {pct >= 30 && (
                        <div className="el-errors-tip">💡 {info.tip}</div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="el-errors-footer">
                <p style={{ color: 'var(--el-muted)', fontSize: '.8rem' }}>
                  الأخطاء تُسجَّل محلياً في متصفحك فقط.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
