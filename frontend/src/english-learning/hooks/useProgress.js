import { useState, useCallback } from 'react'

const STORAGE_KEY = 'english_progress'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  const markDone = useCallback((key) => {
    setProgress(prev => {
      const next = { ...prev, [key]: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isDone = useCallback((key) => !!progress[key], [progress])

  const dayProgress = useCallback((level, dayId) => {
    const components = ['vocab', 'grammar', 'reading', 'listening', 'shadowing', 'writing']
    const done = components.filter(c => progress[`${level}-${dayId}-${c}`]).length
    return { done, total: components.length, pct: Math.round((done / components.length) * 100) }
  }, [progress])

  const levelProgress = useCallback((level, totalDays) => {
    let totalDone = 0
    for (let d = 1; d <= totalDays; d++) {
      totalDone += dayProgress(level, d).done
    }
    const total = totalDays * 6
    return { done: totalDone, total, pct: Math.round((totalDone / total) * 100) }
  }, [dayProgress])

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProgress({})
  }, [])

  return { isDone, markDone, dayProgress, levelProgress, resetAll }
}
