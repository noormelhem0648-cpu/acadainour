import { useState, useCallback } from 'react'
import { LEVELS } from '../data/curriculum'

const STORAGE_KEY      = 'english_progress'
const HARD_WORDS_KEY   = 'english_hard_words'
const ERROR_KEY        = 'english_errors'
const DRAFT_KEY_PREFIX = 'english_draft_'
const SM2_KEY          = 'english_sm2'
const STREAK_KEY       = 'english_streak'
const XP_KEY           = 'english_xp'
const BADGES_KEY       = 'english_badges'
const NOTEBOOK_KEY     = 'english_notebook'
const WORD_ERRORS_KEY  = 'english_word_errors'
const WEEKLY_KEY       = 'english_weekly'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}
function loadHardWords() {
  try { return JSON.parse(localStorage.getItem(HARD_WORDS_KEY) || '[]') }
  catch { return [] }
}
function loadErrors() {
  try { return JSON.parse(localStorage.getItem(ERROR_KEY) || '{}') }
  catch { return {} }
}
function loadSM2() {
  try { return JSON.parse(localStorage.getItem(SM2_KEY) || '{}') }
  catch { return {} }
}
function loadStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || JSON.stringify({ current: 0, longest: 0, lastDate: null, history: [] })) }
  catch { return { current: 0, longest: 0, lastDate: null, history: [] } }
}
function loadXP() {
  try { return JSON.parse(localStorage.getItem(XP_KEY) || '{"total":0,"history":[]}') }
  catch { return { total: 0, history: [] } }
}
function loadBadges() {
  try { return JSON.parse(localStorage.getItem(BADGES_KEY) || '[]') }
  catch { return [] }
}
function loadNotebook() {
  try { return JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '{}') }
  catch { return {} }
}
function loadWordErrors() {
  try { return JSON.parse(localStorage.getItem(WORD_ERRORS_KEY) || '{}') }
  catch { return {} }
}
function loadWeekly() {
  try { return JSON.parse(localStorage.getItem(WEEKLY_KEY) || 'null') }
  catch { return null }
}

/* ── SM-2 algorithm ── */
function sm2Step(card, quality) {
  let { ef = 2.5, interval = 1, repetitions = 0 } = card
  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * ef)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000
  return { ef, interval, repetitions, nextReview, lastQuality: quality, lastReview: Date.now() }
}

/* ── XP values per action ── */
export const XP_VALUES = {
  vocab: 15,
  grammar: 20,
  reading: 15,
  listening: 20,
  shadowing: 15,
  writing: 25,
  speedRound: 10,
  flashcardCorrect: 3,
  debateRound: 8,
  teachMe: 12,
  notebook: 5,
}

/* ── Badge definitions ── */
export const ALL_BADGES = [
  { id: 'first_day',     icon: '🌱', name: 'البداية',        nameEn: 'First Step',     desc: 'أكملت أول يوم دراسي',       condition: (p) => Object.keys(p.progress || {}).length >= 6 },
  { id: 'streak_3',      icon: '🔥', name: '3 أيام متتالية', nameEn: '3-Day Streak',   desc: 'درست 3 أيام متتالية',        condition: (p) => p.streak?.current >= 3 },
  { id: 'streak_7',      icon: '⚡', name: 'المثابر',        nameEn: 'Consistent',     desc: 'درست 7 أيام متتالية',        condition: (p) => p.streak?.current >= 7 },
  { id: 'streak_14',     icon: '💎', name: 'لا يُهزم',       nameEn: 'Unstoppable',    desc: '14 يوماً متتالياً',          condition: (p) => p.streak?.current >= 14 },
  { id: 'streak_30',     icon: '👑', name: 'الأسطورة',       nameEn: 'Legend',         desc: '30 يوماً متتالياً',          condition: (p) => p.streak?.current >= 30 },
  { id: 'xp_500',        icon: '⭐', name: 'ناشط',           nameEn: 'Active',         desc: 'حصلت على 500 نقطة',          condition: (p) => p.xp?.total >= 500 },
  { id: 'xp_2000',       icon: '🌟', name: 'مجتهد',          nameEn: 'Dedicated',      desc: 'حصلت على 2000 نقطة',         condition: (p) => p.xp?.total >= 2000 },
  { id: 'xp_5000',       icon: '💫', name: 'متميز',          nameEn: 'Outstanding',    desc: 'حصلت على 5000 نقطة',         condition: (p) => p.xp?.total >= 5000 },
  { id: 'hard_words_10', icon: '📚', name: 'جامع المفردات',  nameEn: 'Word Collector', desc: 'حفظت 10 كلمات صعبة',         condition: (p) => p.hardWords?.length >= 10 },
  { id: 'hard_words_50', icon: '🧠', name: 'قاموس حي',       nameEn: 'Living Dict.',   desc: 'حفظت 50 كلمة صعبة',          condition: (p) => p.hardWords?.length >= 50 },
  { id: 'notebook_5',    icon: '📓', name: 'المذكرة',        nameEn: 'Notekeeper',     desc: 'دوّنت 5 ملاحظات',            condition: (p) => Object.keys(p.notebook || {}).length >= 5 },
  { id: 'speed_master',  icon: '🏎️', name: 'السرعة',         nameEn: 'Speed King',     desc: 'أنهيت Speed Round بـ 8+',    condition: (p) => (p.xpHistory || []).some(h => h.type === 'speedRound' && h.score >= 8) },
  { id: 'debate_1',      icon: '🎤', name: 'المناظر',        nameEn: 'Debater',        desc: 'خضت أول مناظرة',             condition: (p) => (p.xpHistory || []).some(h => h.type === 'debateRound') },
  { id: 'teach_1',       icon: '🎓', name: 'المعلم',         nameEn: 'Teacher',        desc: 'شرحت قاعدة للـ AI',          condition: (p) => (p.xpHistory || []).some(h => h.type === 'teachMe') },
  { id: 'level_a1',      icon: '🥉', name: 'A1 مكتمل',      nameEn: 'A1 Complete',    desc: 'أكملت مستوى A1 كاملاً',      condition: (p) => (p.levelPct?.('A1', 30) || 0) >= 100 },
  { id: 'level_a2',      icon: '🥈', name: 'A2 مكتمل',      nameEn: 'A2 Complete',    desc: 'أكملت مستوى A2 كاملاً',      condition: (p) => (p.levelPct?.('A2', 30) || 0) >= 100 },
  { id: 'level_b1',      icon: '🥇', name: 'B1 مكتمل',      nameEn: 'B1 Complete',    desc: 'أكملت مستوى B1 كاملاً',      condition: (p) => (p.levelPct?.('B1', 30) || 0) >= 100 },
  { id: 'level_b2',      icon: '🏅', name: 'B2 مكتمل',      nameEn: 'B2 Complete',    desc: 'أكملت مستوى B2 كاملاً',      condition: (p) => (p.levelPct?.('B2', 30) || 0) >= 100 },
  { id: 'level_c1',      icon: '🎖️', name: 'C1 مكتمل',      nameEn: 'C1 Complete',    desc: 'أكملت مستوى C1 كاملاً',      condition: (p) => (p.levelPct?.('C1', 35) || 0) >= 100 },
  { id: 'level_c2',      icon: '🏆', name: 'C2 مكتمل',      nameEn: 'C2 Complete',    desc: 'أكملت مستوى C2 كاملاً',      condition: (p) => (p.levelPct?.('C2', 30) || 0) >= 100 },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function useProgress() {
  const [progress, setProgress]     = useState(load)
  const [hardWords, setHardWords]   = useState(loadHardWords)
  const [errors, setErrors]         = useState(loadErrors)
  const [sm2Data, setSm2Data]       = useState(loadSM2)
  const [streak, setStreak]         = useState(loadStreak)
  const [xpData, setXpData]         = useState(loadXP)
  const [badges, setBadges]         = useState(loadBadges)
  const [notebook, setNotebook]     = useState(loadNotebook)
  const [wordErrors, setWordErrors] = useState(loadWordErrors)
  const [weeklyReport, setWeeklyReport] = useState(loadWeekly)

  /* ── completion ── */
  const markDone = useCallback((key) => {
    setProgress(prev => {
      const next = { ...prev, [key]: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    // Update streak on any completion
    updateStreak()
  }, [])

  const isDone = useCallback((key) => !!progress[key], [progress])

  /* ── progress counters ── */
  const dayProgress = useCallback((level, dayId) => {
    const components = ['vocab', 'grammar', 'reading', 'listening', 'shadowing', 'writing']
    const done = components.filter(c => progress[`${level}-${dayId}-${c}`]).length
    return { done, total: components.length, pct: Math.round((done / components.length) * 100) }
  }, [progress])

  const levelProgress = useCallback((level, totalDays) => {
    let totalDone = 0
    for (let d = 1; d <= totalDays; d++) totalDone += dayProgress(level, d).done
    const total = totalDays * 6
    return { done: totalDone, total, pct: Math.round((totalDone / total) * 100) }
  }, [dayProgress])

  /* ── skill percentages for radar chart ── */
  const skillProgress = useCallback(() => {
    const comps = ['vocab', 'grammar', 'reading', 'listening', 'shadowing', 'writing']
    const totals = Object.fromEntries(comps.map(c => [c, 0]))
    const done = Object.fromEntries(comps.map(c => [c, 0]))
    for (const lv of LEVELS) {
      for (let d = 1; d <= lv.totalDays; d++) {
        for (const c of comps) {
          totals[c]++
          if (progress[`${lv.id}-${d}-${c}`]) done[c]++
        }
      }
    }
    return Object.fromEntries(comps.map(c => [c, totals[c] > 0 ? Math.round((done[c] / totals[c]) * 100) : 0]))
  }, [progress])

  /* ── hard words ── */
  const toggleHardWord = useCallback((wordObj, level, dayId) => {
    setHardWords(prev => {
      const id = `${level}-${dayId}-${wordObj.word}`
      const exists = prev.find(w => w.id === id)
      const next = exists
        ? prev.filter(w => w.id !== id)
        : [...prev, { id, word: wordObj.word, arabic: wordObj.arabic, ipa: wordObj.ipa, level, dayId, addedAt: Date.now() }]
      localStorage.setItem(HARD_WORDS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isHardWord = useCallback((word, level, dayId) => {
    const id = `${level}-${dayId}-${word}`
    return hardWords.some(w => w.id === id)
  }, [hardWords])

  /* ── SM-2 ── */
  const reviewWord = useCallback((wordId, quality) => {
    setSm2Data(prev => {
      const card = prev[wordId] || {}
      const updated = sm2Step(card, quality)
      const next = { ...prev, [wordId]: updated }
      localStorage.setItem(SM2_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getSM2Card = useCallback((wordId) => sm2Data[wordId] || { ef: 2.5, interval: 1, repetitions: 0, nextReview: 0 }, [sm2Data])

  const dueWords = useCallback(() => {
    const now = Date.now()
    return hardWords.filter(w => {
      const card = sm2Data[w.id]
      return !card || card.nextReview <= now
    })
  }, [hardWords, sm2Data])

  /* ── error tracking ── */
  const recordError = useCallback((component, detail) => {
    setErrors(prev => {
      const next = { ...prev, [component]: (prev[component] || 0) + 1 }
      localStorage.setItem(ERROR_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  /* ── word-level error memory ── */
  const recordWordError = useCallback((word, component) => {
    setWordErrors(prev => {
      const key = `${word}::${component}`
      const entry = prev[key] || { word, component, count: 0, lastSeen: null }
      const next = {
        ...prev,
        [key]: { ...entry, count: entry.count + 1, lastSeen: Date.now() }
      }
      localStorage.setItem(WORD_ERRORS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getTopWordErrors = useCallback((n = 3) => {
    return Object.values(wordErrors)
      .sort((a, b) => b.count - a.count)
      .slice(0, n)
  }, [wordErrors])

  /* ── writing drafts ── */
  const saveDraft = useCallback((key, text) => localStorage.setItem(DRAFT_KEY_PREFIX + key, text), [])
  const loadDraft = useCallback((key) => localStorage.getItem(DRAFT_KEY_PREFIX + key) || '', [])

  /* ── streak ── */
  const updateStreak = useCallback(() => {
    const today = todayStr()
    setStreak(prev => {
      if (prev.lastDate === today) return prev
      const MS_PER_DAY = 86_400_000
      const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10)
      const current = prev.lastDate === yesterday ? prev.current + 1 : 1
      const longest = Math.max(prev.longest || 0, current)
      const history = [...(prev.history || []).slice(-89), today]
      const next = { current, longest, lastDate: today, history }
      localStorage.setItem(STREAK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  /* ── XP ── */
  const addXP = useCallback((type, extra = {}) => {
    const amount = XP_VALUES[type] || 5
    setXpData(prev => {
      const entry = { type, amount, date: Date.now(), ...extra }
      const history = [...(prev.history || []).slice(-499), entry]
      const next = { total: (prev.total || 0) + amount, history }
      localStorage.setItem(XP_KEY, JSON.stringify(next))
      return next
    })
    checkBadges()
  }, [])

  /* ── badges ── */
  const checkBadges = useCallback(() => {
    // Persist newly earned badge IDs so the badge count is stable across sessions
    setBadges(prev => {
      const earned = getEarnedBadges()
      const earnedIds = earned.map(b => b.id)
      const merged = [...new Set([...prev, ...earnedIds])]
      if (merged.length !== prev.length) {
        localStorage.setItem(BADGES_KEY, JSON.stringify(merged))
      }
      return merged
    })
  }, [getEarnedBadges])

  const getEarnedBadges = useCallback((currentState) => {
    const context = {
      progress,
      streak,
      xp: xpData,
      hardWords,
      notebook,
      xpHistory: xpData.history || [],
      levelPct: (level, days) => {
        let done = 0
        const comps = ['vocab', 'grammar', 'reading', 'listening', 'shadowing', 'writing']
        for (let d = 1; d <= days; d++)
          for (const c of comps)
            if (progress[`${level}-${d}-${c}`]) done++
        return Math.round(done / (days * 6) * 100)
      }
    }
    return ALL_BADGES.filter(b => {
      try { return b.condition(context) } catch { return false }
    })
  }, [progress, streak, xpData, hardWords, notebook])

  /* ── notebook ── */
  const saveNote = useCallback((key, text) => {
    setNotebook(prev => {
      const next = text.trim()
        ? { ...prev, [key]: { text, updatedAt: Date.now() } }
        : (() => { const n = { ...prev }; delete n[key]; return n })()
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getNote = useCallback((key) => notebook[key]?.text || '', [notebook])

  /* ── weekly report ── */
  const saveWeeklyReport = useCallback((report) => {
    const data = { ...report, generatedAt: Date.now() }
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(data))
    setWeeklyReport(data)
  }, [])

  /* ── reset ── */
  const resetAll = useCallback(() => {
    [STORAGE_KEY, HARD_WORDS_KEY, ERROR_KEY, SM2_KEY, STREAK_KEY, XP_KEY, BADGES_KEY, NOTEBOOK_KEY, WORD_ERRORS_KEY, WEEKLY_KEY]
      .forEach(k => localStorage.removeItem(k))
    setProgress({}); setHardWords([]); setErrors({}); setSm2Data({})
    setStreak({ current: 0, longest: 0, lastDate: null, history: [] })
    setXpData({ total: 0, history: [] }); setBadges([]); setNotebook({})
    setWordErrors({}); setWeeklyReport(null)
  }, [])

  return {
    isDone, markDone, dayProgress, levelProgress, skillProgress,
    hardWords, toggleHardWord, isHardWord,
    sm2Data, reviewWord, getSM2Card, dueWords,
    errors, recordError,
    wordErrors, recordWordError, getTopWordErrors,
    saveDraft, loadDraft,
    streak, updateStreak,
    xpData, addXP,
    badges, getEarnedBadges,
    notebook, saveNote, getNote,
    weeklyReport, saveWeeklyReport,
    resetAll
  }
}
