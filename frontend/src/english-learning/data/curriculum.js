import { DAYS_1_10 } from './curriculum_1_10.js'
import { DAYS_11_20 } from './curriculum_11_20.js'
import { DAYS_21_30 } from './curriculum_21_30.js'
import { VOCAB_EXTRA } from './vocab_extra.js'
import { A2_DAYS_1_10 } from './curriculum_a2_1_10.js'
import { A2_DAYS_11_20 } from './curriculum_a2_11_20.js'
import { A2_DAYS_21_30 } from './curriculum_a2_21_30.js'
import { B1_DAYS_1_10 } from './curriculum_b1_1_10.js'
import { B1_DAYS_11_20 } from './curriculum_b1_11_20.js'
import { B1_DAYS_21_30 } from './curriculum_b1_21_30.js'

const baseDays = [...DAYS_1_10, ...DAYS_11_20, ...DAYS_21_30]

export const ALL_DAYS = baseDays.map(day => {
  const extra = VOCAB_EXTRA[day.id]
  if (!extra) return day
  return {
    ...day,
    vocabulary: {
      ...day.vocabulary,
      words: [...day.vocabulary.words, ...extra],
    }
  }
})

export const A2_ALL_DAYS = [...A2_DAYS_1_10, ...A2_DAYS_11_20, ...A2_DAYS_21_30]
export const B1_ALL_DAYS = [...B1_DAYS_1_10, ...B1_DAYS_11_20, ...B1_DAYS_21_30]

export const LEVELS = [
  { id: 'A1', name: 'A1 — Beginner', nameAr: 'مبتدئ', description: 'من الصفر إلى التواصل الأساسي', totalDays: 30, available: true },
  { id: 'A2', name: 'A2 — Elementary', nameAr: 'أساسي', description: 'بناء الثقة في التواصل اليومي', totalDays: 30, available: true },
  { id: 'B1', name: 'B1 — Intermediate', nameAr: 'متوسط', description: 'التعبير عن الآراء والأفكار', totalDays: 30, available: true },
  { id: 'B2', name: 'B2 — Upper Intermediate', nameAr: 'فوق المتوسط', description: 'التحدث بطلاقة في مواضيع متنوعة', totalDays: 30, available: true },
  { id: 'C1', name: 'C1 — Advanced', nameAr: 'متقدم', description: 'الطلاقة والدقة اللغوية العالية', totalDays: 30, available: true },
  { id: 'C2', name: 'C2 — Mastery', nameAr: 'إتقان', description: 'مستوى شبه الأصيل', totalDays: 30, available: true },
]

export const COMPONENTS = [
  { id: 'vocab',     icon: '🔤', label: 'المفردات والصوتيات',      labelEn: 'Vocabulary & Phonetics' },
  { id: 'grammar',   icon: '📐', label: 'القواعد والمحادثة',        labelEn: 'Grammar & Conversation' },
  { id: 'reading',   icon: '📖', label: 'القراءة والتحليل',          labelEn: 'Reading & Breakdown' },
  { id: 'listening', icon: '🎧', label: 'الاستماع والإملاء',          labelEn: 'Listening & Dictation' },
  { id: 'shadowing', icon: '🎙️', label: 'الشادونج والنطق',           labelEn: 'Shadowing & Fluency' },
  { id: 'writing',   icon: '✍️', label: 'الكتابة والمحادثة الحية', labelEn: 'Writing & AI Chat' },
]

export function getDay(levelId, dayId) {
  if (levelId === 'A1') return ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'A2') return A2_ALL_DAYS.find(d => d.id === dayId) || null
  if (levelId === 'B1') return B1_ALL_DAYS.find(d => d.id === dayId) || null
  return null
}
