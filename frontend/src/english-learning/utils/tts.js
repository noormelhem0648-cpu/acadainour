// Shared TTS utility — all spoken content in the app goes through here.
// Respects saved preferences: voice (US/UK), rate, and pitch.

const KEY_VOICE_US  = 'noura_voice_us'
const KEY_VOICE_UK  = 'noura_voice_uk'
const KEY_RATE      = 'noura_tts_rate'
const KEY_PITCH     = 'noura_tts_pitch'

const PRIORITY = {
  'en-US': [
    'Aria Online (Natural)','Jenny Online (Natural)','Guy Online (Natural)',
    'Ana Online (Natural)','Davis Online (Natural)','Emma Online (Natural)',
    'Eric Online (Natural)','Michelle Online (Natural)','Roger Online (Natural)',
    'Steffan Online (Natural)','Microsoft Aria','Microsoft Jenny','Microsoft David',
    'Microsoft Mark','Microsoft Zira','Google US English','Samantha','Alex','Ava',
  ],
  'en-GB': [
    'Libby Online (Natural)','Maisie Online (Natural)','Ryan Online (Natural)',
    'Sonia Online (Natural)','Thomas Online (Natural)','Microsoft Libby',
    'Microsoft Maisie','Microsoft Ryan','Microsoft Sonia',
    'Google UK English Female','Google UK English Male','Daniel','Kate',
  ],
}

let _cache = {}

// Normalize lang tag for comparison: 'en-GB' → 'en_gb', 'en-US' → 'en_us'
function _normLang(s) { return s.toLowerCase().replace('-', '_') }

// True only when voice dialect matches exactly (en-US≠en-GB, en-GB-oxendict counts as GB)
function _isDialect(voice, lang) {
  const vl = _normLang(voice.lang)
  const tl = _normLang(lang)
  return vl === tl || vl.startsWith(tl + '_')
}

function _pick(lang) {
  if (_cache[lang]) return _cache[lang]
  if (!window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null  // don't cache — try again on next call

  // 1. User's saved preference (set via VoicePicker)
  const savedName = localStorage.getItem(lang === 'en-GB' ? KEY_VOICE_UK : KEY_VOICE_US)
  if (savedName) {
    const saved = voices.find(v => v.name === savedName)
    if (saved) { _cache[lang] = saved; return saved }
  }

  // 2. Best online/natural voice whose lang tag matches this dialect
  const natural = voices.find(v => _isDialect(v, lang) && /online|natural|neural/i.test(v.name))
  if (natural) { _cache[lang] = natural; return natural }

  // 3. Any voice whose lang tag matches this dialect
  const exact = voices.find(v => _isDialect(v, lang))
  if (exact) { _cache[lang] = exact; return exact }

  // 4. Priority name list (last resort — catches Google/non-standard naming)
  for (const name of (PRIORITY[lang] || [])) {
    const v = voices.find(v => v.name.includes(name))
    if (v) { _cache[lang] = v; return v }
  }

  // No matching dialect voice found — return null, u.lang hint may still help the browser
  return null
}

function _preload() {
  _cache = {}
  _pick('en-US')
  _pick('en-GB')
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  if (window.speechSynthesis.getVoices().length > 0) _preload()
  else window.speechSynthesis.addEventListener('voiceschanged', _preload, { once: true })
}

export function clearVoiceCache() { _cache = {} }

export function stopTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis)
    window.speechSynthesis.cancel()
}

export function getRate() {
  const saved = parseFloat(localStorage.getItem(KEY_RATE))
  return isNaN(saved) ? null : saved
}

export function getPitch() {
  const saved = parseFloat(localStorage.getItem(KEY_PITCH))
  return isNaN(saved) ? null : saved
}

export function saveRate(v)  { localStorage.setItem(KEY_RATE,  String(v)) }
export function savePitch(v) { localStorage.setItem(KEY_PITCH, String(v)) }

/**
 * speakAtRate(text, rate, lang?, onEnd?)
 * Like speak() but overrides the saved rate — useful for listening/shadowing speed controls.
 */
export function speakAtRate(text, rate, lang = 'en-US', onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  stopTTS()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  const voice = _pick(lang)
  if (voice) u.voice = voice
  u.rate  = rate
  u.pitch = getPitch() ?? 1
  u.onend   = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}

/**
 * speak(text, lang?, onStart?, onEnd?)
 * lang defaults to 'en-US'. Applies saved voice, rate, and pitch.
 */
export function speak(text, lang = 'en-US', onStart, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  stopTTS()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  const voice = _pick(lang)
  if (voice) u.voice = voice
  const isNatural = voice ? /online|natural|neural|google/i.test(voice.name) : false
  const defaultRate = isNatural ? (lang === 'en-GB' ? 0.9 : 0.92) : (lang === 'en-GB' ? 0.8 : 0.85)
  u.rate  = getRate()  ?? defaultRate
  const defaultPitch = 1
  u.pitch = getPitch() ?? defaultPitch
  u.onstart = () => onStart?.()
  u.onend   = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}
