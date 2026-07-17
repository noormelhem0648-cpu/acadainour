import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/tts'
import '../EL.css'

function IpaDualSpeak({ text }) {
  const word = text.split(',')[0].trim()
  return (
    <span style={{ display: 'inline-flex', gap: 3 }} onClick={e => e.stopPropagation()}>
      <button className="el-speak-btn" style={{ fontSize: '.8rem', padding: '2px 5px' }}
        onClick={() => speak(word, 'en-US')} title="US">🇺🇸</button>
      <button className="el-speak-btn" style={{ fontSize: '.8rem', padding: '2px 5px' }}
        onClick={() => speak(word, 'en-GB')} title="UK">🇬🇧</button>
    </span>
  )
}

const EL = '/english-learning'

/* Common IPA symbols + pronunciation guide */
const IPA_GUIDE = [
  { symbol: '/iː/', example: 'see, feet', arabic: 'إي طويل', color: '#10b981' },
  { symbol: '/ɪ/', example: 'sit, tip', arabic: 'إِ قصير', color: '#10b981' },
  { symbol: '/e/', example: 'bed, set', arabic: 'إي', color: '#3b82f6' },
  { symbol: '/æ/', example: 'cat, map', arabic: 'أَ', color: '#3b82f6' },
  { symbol: '/ɑː/', example: 'car, far', arabic: 'آ طويل', color: '#8b5cf6' },
  { symbol: '/ɒ/', example: 'hot, top', arabic: 'أُو قصير', color: '#8b5cf6' },
  { symbol: '/ɔː/', example: 'saw, law', arabic: 'أُو طويل', color: '#f59e0b' },
  { symbol: '/ʊ/', example: 'put, foot', arabic: 'أُو قصير', color: '#f59e0b' },
  { symbol: '/uː/', example: 'blue, food', arabic: 'أُو طويل', color: '#ef4444' },
  { symbol: '/ʌ/', example: 'cup, fun', arabic: 'أَ', color: '#ef4444' },
  { symbol: '/ɜː/', example: 'bird, her', arabic: 'إِر', color: '#10b981' },
  { symbol: '/ə/', example: 'about, ago', arabic: 'أُ خفيف (schwa)', color: '#6b7280' },
  { symbol: '/eɪ/', example: 'day, say', arabic: 'إِي', color: '#3b82f6' },
  { symbol: '/aɪ/', example: 'my, fly', arabic: 'آي', color: '#8b5cf6' },
  { symbol: '/ɔɪ/', example: 'boy, toy', arabic: 'أُوي', color: '#f59e0b' },
  { symbol: '/aʊ/', example: 'now, how', arabic: 'آو', color: '#ef4444' },
  { symbol: '/əʊ/', example: 'go, show', arabic: 'أُو', color: '#10b981' },
  { symbol: '/ɪə/', example: 'here, ear', arabic: 'إِيَر', color: '#3b82f6' },
  { symbol: '/p/', example: 'pen, cup', arabic: 'پ', color: '#10b981' },
  { symbol: '/b/', example: 'bad, cab', arabic: 'ب', color: '#10b981' },
  { symbol: '/t/', example: 'ten, hat', arabic: 'ت', color: '#3b82f6' },
  { symbol: '/d/', example: 'day, bad', arabic: 'د', color: '#3b82f6' },
  { symbol: '/k/', example: 'cat, clock', arabic: 'ك', color: '#8b5cf6' },
  { symbol: '/g/', example: 'go, bag', arabic: 'غ/ج', color: '#8b5cf6' },
  { symbol: '/f/', example: 'fat, off', arabic: 'ف', color: '#f59e0b' },
  { symbol: '/v/', example: 'van, love', arabic: 'ڤ', color: '#f59e0b' },
  { symbol: '/θ/', example: 'think, bath', arabic: 'ث (لساني)', color: '#ef4444' },
  { symbol: '/ð/', example: 'this, father', arabic: 'ذ (لساني)', color: '#ef4444' },
  { symbol: '/s/', example: 'see, miss', arabic: 'س', color: '#10b981' },
  { symbol: '/z/', example: 'zoo, has', arabic: 'ز', color: '#10b981' },
  { symbol: '/ʃ/', example: 'she, cash', arabic: 'ش', color: '#3b82f6' },
  { symbol: '/ʒ/', example: 'vision, genre', arabic: 'ژ', color: '#3b82f6' },
  { symbol: '/tʃ/', example: 'church, watch', arabic: 'تش', color: '#8b5cf6' },
  { symbol: '/dʒ/', example: 'judge, gym', arabic: 'دج', color: '#8b5cf6' },
  { symbol: '/m/', example: 'man, some', arabic: 'م', color: '#f59e0b' },
  { symbol: '/n/', example: 'no, ten', arabic: 'ن', color: '#f59e0b' },
  { symbol: '/ŋ/', example: 'sing, ring', arabic: 'نغ أنفي', color: '#ef4444' },
  { symbol: '/h/', example: 'hat, how', arabic: 'هـ', color: '#ef4444' },
  { symbol: '/l/', example: 'leg, full', arabic: 'ل', color: '#10b981' },
  { symbol: '/r/', example: 'red, car', arabic: 'ر أمريكي', color: '#3b82f6' },
  { symbol: '/j/', example: 'yes, you', arabic: 'ي', color: '#8b5cf6' },
  { symbol: '/w/', example: 'wet, now', arabic: 'و', color: '#f59e0b' },
]

export default function ELIPAPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('guide') // guide | lookup

  const filtered = search
    ? IPA_GUIDE.filter(s =>
        s.symbol.includes(search) ||
        s.example.toLowerCase().includes(search.toLowerCase()) ||
        s.arabic.includes(search)
      )
    : IPA_GUIDE

  const vowels = filtered.filter((_, i) => i < 18)
  const consonants = filtered.filter((_, i) => i >= 18)

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">🔤 دليل IPA الصوتي</span>
          <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </header>

        <div className="el-ipa-page">
          <div className="el-ipa-hero">
            <h2 className="el-ipa-title">International Phonetic Alphabet</h2>
            <p className="el-ipa-desc">الدليل الكامل للرموز الصوتية — اضغط على أي رمز لتسمع نطقه</p>
          </div>

          {/* Tabs */}
          <div className="el-ipa-tabs">
            <button className={'el-ipa-tab' + (activeTab === 'guide' ? ' active' : '')} onClick={() => setActiveTab('guide')}>
              📖 دليل الرموز
            </button>
            <button className={'el-ipa-tab' + (activeTab === 'tips' ? ' active' : '')} onClick={() => setActiveTab('tips')}>
              💡 نصائح النطق
            </button>
          </div>

          {/* Search */}
          <input
            className="el-ipa-search"
            placeholder="ابحث عن رمز أو كلمة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {activeTab === 'guide' && (
            <>
              {/* Vowels */}
              {vowels.length > 0 && (
                <div className="el-ipa-section">
                  <div className="el-ipa-section-title">🔵 أصوات العلة (Vowels) — {vowels.length} رمز</div>
                  <div className="el-ipa-grid">
                    {vowels.map((s, i) => (
                      <div
                        key={i}
                        className="el-ipa-card"
                      >
                        <div className="el-ipa-symbol" style={{ color: s.color }}>{s.symbol}</div>
                        <div className="el-ipa-arabic">{s.arabic}</div>
                        <div className="el-ipa-example">{s.example}</div>
                        <IpaDualSpeak text={s.example} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consonants */}
              {consonants.length > 0 && (
                <div className="el-ipa-section">
                  <div className="el-ipa-section-title">🟢 أصوات الصامت (Consonants) — {consonants.length} رمز</div>
                  <div className="el-ipa-grid">
                    {consonants.map((s, i) => (
                      <div
                        key={i}
                        className="el-ipa-card"
                      >
                        <div className="el-ipa-symbol" style={{ color: s.color }}>{s.symbol}</div>
                        <div className="el-ipa-arabic">{s.arabic}</div>
                        <div className="el-ipa-example">{s.example}</div>
                        <IpaDualSpeak text={s.example} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'tips' && (
            <div className="el-ipa-tips">
              {[
                { icon: '/ə/', title: 'Schwa — الأكثر شيوعاً', tip: 'الـ schwa /ə/ هو الصوت الأكثر شيوعاً في الإنجليزية. كل مقطع غير مضغوط تقريباً يتحول له. "about" = /əˈbaʊt/', example: 'about, ago, sofa, camera' },
                { icon: '/θ/', title: 'TH الصعب', tip: 'ضع لسانك بين أسنانك بخفة. /θ/ في "think" = ث لساني. /ð/ في "this" = ذ لساني لكن مُجهَّر.', example: 'think /θɪŋk/, this /ðɪs/' },
                { icon: 'ˈ', title: 'علامة النبر', tip: 'الشرطة العمودية ˈ قبل المقطع تعني: هذا المقطع مضغوط. "student" = /ˈstjuːdənt/ — الضغط على STU.', example: '/ˈstjuːdənt/, /ˈtiːtʃər/' },
                { icon: '/r/', title: 'R الأمريكي', tip: 'في الأمريكية، /r/ ينطق دائماً حتى في نهاية الكلمة. في البريطانية قد يُحذف. "car" /kɑːr/ أمريكي vs /kɑː/ بريطاني.', example: 'car, better, teacher' },
                { icon: '/l/', title: 'L المضاعف', tip: '/l/ في بداية الكلمة "light" يختلف عن نهايتها "full". النهائي يُعرف بـ "dark L" ويُنطق أثقل.', example: 'light vs full, feel vs feel' },
                { icon: 'ː', title: 'علامة الإطالة', tip: 'النقطتان ː بعد صوت تعني إطالته. /iː/ في "see" أطول من /ɪ/ في "sit". الفرق مهم لتمييز المعنى.', example: '/biːt/ beat vs /bɪt/ bit' },
              ].map((tip, i) => (
                <div key={i} className="el-ipa-tip-card">
                  <div className="el-ipa-tip-icon">{tip.icon}</div>
                  <div className="el-ipa-tip-content">
                    <div className="el-ipa-tip-title">{tip.title}</div>
                    <div className="el-ipa-tip-text">{tip.tip}</div>
                    <div className="el-ipa-tip-example" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{tip.example}</span>
                      <IpaDualSpeak text={tip.example} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
