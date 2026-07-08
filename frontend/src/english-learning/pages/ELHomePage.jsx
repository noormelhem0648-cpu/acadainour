import { useNavigate } from 'react-router-dom'
import { LEVELS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

export default function ELHomePage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const progress = useProgress()

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <div className="el-top-bar-brand">
            <button className="el-icon-btn" onClick={() => navigate('/')} title="رجوع">←</button>
            <span className="el-brand-dot" />
            <span className="el-brand-name">English with Noura</span>
          </div>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="el-home-main">
          <div className="el-hero-block">
            <div className="el-hero-badge">🎓 مجاناً تماماً</div>
            <h1 className="el-hero-title">
              تعلّم الإنجليزية<br />
              <span className="el-hero-accent">خطوة بخطوة</span>
            </h1>
            <p className="el-hero-sub">
              من الصفر المطلق إلى الطلاقة — 6 مستويات × 30 يوماً × 6 مهارات يومياً
            </p>
          </div>

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

          <div className="el-how-it-works">
            <h2 className="el-section-title">كيف يعمل النظام؟</h2>
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
          </div>
        </main>
      </div>
    </div>
  )
}
