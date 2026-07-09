import { useState, useCallback } from 'react'

const STORAGE_KEY      = 'english_progress'
const HARD_WORDS_KEY   = 'english_hard_words'
const ERROR_KEY        = 'english_errors'
const DRAFT_KEY_PREFIX = 'english_draft_'
const SM2_KEY          = 'english_sm2'

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

/* ── SM-2 algorithm ──────────────────────────────────────────
   quality: 0-5 (0=blackout, 3=correct-with-difficulty, 5=perfect)
   Returns updated card state: { ef, interval, repetitions, nextReview }
*/
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

export function useProgress() {
  const [progress, setProgress]     = useState(load)
  const [hardWords, setHardWords]   = useState(loadHardWords)
  const [errors, setErrors]         = useState(loadErrors)
  const [sm2Data, setSm2Data]       = useState(loadSM2)

  /* ── completion ── */
  const markDone = useCallback((key) => {
    setProgress(prev => {
      const next = { ...prev, [key]: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
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

  /* ── hard words (Vocabulary Ledger) ── */
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

  /* ── SM-2 Spaced Repetition ── */
  const reviewWord = useCallback((wordId, quality) => {
    setSm2Data(prev => {
      const card = prev[wordId] || {}
      const updated = sm2Step(card, quality)
      const next = { ...prev, [wordId]: updated }
      localStorage.setItem(SM2_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getSM2Card = useCallback((wordId) => {
    return sm2Data[wordId] || { ef: 2.5, interval: 1, repetitions: 0, nextReview: 0 }
  }, [sm2Data])

  /* Words due for review today (nextReview <= now) */
  const dueWords = useCallback(() => {
    const now = Date.now()
    return hardWords.filter(w => {
      const card = sm2Data[w.id]
      return !card || card.nextReview <= now
    })
  }, [hardWords, sm2Data])

  /* ── error tracking (for Part 13 dashboard) ── */
  const recordError = useCallback((component, detail) => {
    setErrors(prev => {
      const key = component
      const next = { ...prev, [key]: (prev[key] || 0) + 1 }
      localStorage.setItem(ERROR_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  /* ── writing drafts ── */
  const saveDraft = useCallback((key, text) => {
    localStorage.setItem(DRAFT_KEY_PREFIX + key, text)
  }, [])

  const loadDraft = useCallback((key) => {
    return localStorage.getItem(DRAFT_KEY_PREFIX + key) || ''
  }, [])

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HARD_WORDS_KEY)
    localStorage.removeItem(ERROR_KEY)
    localStorage.removeItem(SM2_KEY)
    setProgress({})
    setHardWords([])
    setErrors({})
    setSm2Data({})
  }, [])

  return {
    isDone, markDone, dayProgress, levelProgress,
    hardWords, toggleHardWord, isHardWord,
    sm2Data, reviewWord, getSM2Card, dueWords,
    errors, recordError,
    saveDraft, loadDraft,
    resetAll
  }
}
