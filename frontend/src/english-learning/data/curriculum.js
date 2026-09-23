import { DAYS_1_10 } from './curriculum_1_10.js'
import { DAYS_11_20 } from './curriculum_11_20.js'
import { DAYS_21_30 } from './curriculum_21_30.js'
import { VOCAB_EXTRA } from './vocab_extra.js'
import { VOCAB_ORDER, VOCAB_ORDER_BY_TITLE } from './vocabOrder.js'
import { VOCAB_MORE } from './vocabMore.js'
import { A2_DAYS_1_10 } from './curriculum_a2_1_10.js'
import { A2_DAYS_11_20 } from './curriculum_a2_11_20.js'
import { A2_DAYS_21_30 } from './curriculum_a2_21_30.js'
import { B1_DAYS_1_10 } from './curriculum_b1_1_10.js'
import { B1_DAYS_11_20 } from './curriculum_b1_11_20.js'
import { B1_DAYS_21_30 } from './curriculum_b1_21_30.js'
import { B2_DAYS_1_10 } from './curriculum_b2_1_10.js'
import { B2_DAYS_11_20 } from './curriculum_b2_11_20.js'
import { B2_DAYS_21_30 } from './curriculum_b2_21_30.js'
import { C1_DAYS_1_10 } from './curriculum_c1_1_10.js'
import { C1_DAYS_11_20 } from './curriculum_c1_11_20.js'
import { C1_DAYS_21_30 } from './curriculum_c1_21_30.js'
import { C1_DAYS_31_35 } from './curriculum_c1_31_35.js'
import { C2_DAYS_1_10 } from './curriculum_c2_1_10.js'
import { C2_DAYS_11_20 } from './curriculum_c2_11_20.js'
import { C2_DAYS_21_30 } from './curriculum_c2_21_30.js'

const baseDays = [...DAYS_1_10, ...DAYS_11_20, ...DAYS_21_30]

const _norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z' ]/g, '').trim()

// Removes repeated words within a day (keeps the first) and combined entries
// like "Morning / Evening" when each part already has its own entry.
function dedupeWords(words) {
  const seen = new Set(words.filter(w => !/\s\/\s/.test(w.word)).map(w => _norm(w.word)))
  const out = []
  const used = new Set()
  for (const w of words) {
    if (/\s\/\s/.test(w.word) && w.word.split('/').every(p => seen.has(_norm(p)))) continue
    const k = _norm(w.word)
    if (used.has(k)) continue
    used.add(k)
    out.push(w)
  }
  return out
}

const WORD_ORDER = VOCAB_ORDER

function orderWords(words, levelId, dayId, title) {
  const order = VOCAB_ORDER_BY_TITLE[levelId]?.[`${dayId}|${title}`] || WORD_ORDER[levelId]?.[dayId]
  if (!order) return words
  const rank = w => { const i = order.findIndex(o => _norm(o) === _norm(w.word)); return i === -1 ? order.length : i }
  return [...words].sort((a, b) => rank(a) - rank(b))
}

function tidyDays(days, levelId) {
  return days.map(day => {
    if (!day.vocabulary?.words) return day
    const base = dedupeWords(day.vocabulary.words)
    const more = (VOCAB_MORE[levelId]?.[`${day.id}|${day.title}`] || []).slice(0, Math.max(0, 20 - base.length))
    return { ...day, vocabulary: { ...day.vocabulary, words: orderWords(dedupeWords([...base, ...more]), levelId, day.id, day.title) } }
  })
}

export const ALL_DAYS = tidyDays(baseDays.map(day => {
  const extra = VOCAB_EXTRA[day.id]
  if (!extra) return day
  return {
    ...day,
    vocabulary: {
      ...day.vocabulary,
      words: [...day.vocabulary.words, ...extra],
    }
  }
}), 'A1')

export const A2_ALL_DAYS = tidyDays([...A2_DAYS_1_10, ...A2_DAYS_11_20, ...A2_DAYS_21_30], 'A2')
export const B1_ALL_DAYS = tidyDays([...B1_DAYS_1_10, ...B1_DAYS_11_20, ...B1_DAYS_21_30], 'B1')
export const B2_ALL_DAYS = tidyDays([...B2_DAYS_1_10, ...B2_DAYS_11_20, ...B2_DAYS_21_30], 'B2')
export const C1_ALL_DAYS = tidyDays([...C1_DAYS_1_10, ...C1_DAYS_11_20, ...C1_DAYS_21_30, ...C1_DAYS_31_35], 'C1')
export const C2_ALL_DAYS = tidyDays([...C2_DAYS_1_10, ...C2_DAYS_11_20, ...C2_DAYS_21_30], 'C2')

export const LEVELS = [
  { id: 'A1', name: 'A1 — Beginner',          nameAr: 'مبتدئ',         description: 'من الصفر إلى التواصل الأساسي',        totalDays: 30, available: true },
  { id: 'A2', name: 'A2 — Elementary',         nameAr: 'أساسي',         description: 'بناء الثقة في التواصل اليومي',        totalDays: 30, available: true },
  { id: 'B1', name: 'B1 — Intermediate',       nameAr: 'متوسط',         description: 'التعبير عن الآراء والأفكار',          totalDays: 30, available: true },
  { id: 'B2', name: 'B2 — Upper Intermediate', nameAr: 'فوق المتوسط',   description: 'التحدث بطلاقة في مواضيع متنوعة',     totalDays: 30, available: true },
  { id: 'C1', name: 'C1 — Advanced',           nameAr: 'متقدم',         description: 'الطلاقة والدقة اللغوية العالية',     totalDays: 35, available: true },
  { id: 'C2', name: 'C2 — Mastery',            nameAr: 'إتقان',         description: 'مستوى شبه الأصيل',                  totalDays: 30, available: true },
]

export const COMPONENTS = [
  { id: 'vocab',     icon: '🔤', label: 'مفردات',      labelEn: 'Vocabulary & Phonetics' },
  { id: 'grammar',   icon: '📐', label: 'قواعد',        labelEn: 'Grammar & Conversation' },
  { id: 'reading',   icon: '📖', label: 'قراءة',          labelEn: 'Reading & Breakdown' },
  { id: 'listening', icon: '🎧', label: 'استماع',          labelEn: 'Listening & Dictation' },
  { id: 'shadowing', icon: '🎙️', label: 'شادونج',           labelEn: 'Shadowing & Fluency' },
  { id: 'writing',   icon: '✍️', label: 'الكتابة', labelEn: 'Writing & AI Chat' },
]

export function getDay(levelId, dayId) {
  if (levelId === 'A1') return ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'A2') return A2_ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'B1') return B1_ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'B2') return B2_ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'C1') return C1_ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'C2') return C2_ALL_DAYS.find(d => d.id === dayId) || null
  return null
}
