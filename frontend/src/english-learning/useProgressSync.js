/**
 * useProgressSync — syncs student progress between localStorage and backend DB.
 * Call once at app root after login.
 *
 * Keys here MUST match the constants in hooks/useProgress.js.
 */
import { useEffect, useCallback, useRef } from 'react'
import { API_BASE } from '../config'

const XP_KEY       = 'english_xp'        // { total: number, history: [] }
const STREAK_KEY   = 'english_streak'    // { current, longest, lastDate, history }
const HW_KEY       = 'english_hard_words' // [ ...wordObjs ]
const BADGES_KEY   = 'english_badges'    // [ ...idStrings ]
const NOTEBOOK_KEY = 'english_notebook'  // { key: { text, updatedAt } }
const ERRORS_KEY   = 'english_errors'    // { component: count }

const WATCHED_KEYS = [XP_KEY, STREAK_KEY, HW_KEY, BADGES_KEY, NOTEBOOK_KEY, ERRORS_KEY]

function getToken() { return localStorage.getItem('noura_token') || '' }

function localToPayload() {
  const xpRaw  = (() => { try { return JSON.parse(localStorage.getItem(XP_KEY) || '{"total":0}') } catch { return { total: 0 } } })()
  const streak = (() => { try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}') } catch { return {} } })()
  return {
    xp:              xpRaw.total       ?? 0,
    streak_count:    streak.current    ?? 0,   // useProgress saves "current", not "count"
    last_study_date: streak.lastDate   ?? '',
    hard_words:      localStorage.getItem(HW_KEY)       || '[]',
    badges:          localStorage.getItem(BADGES_KEY)   || '[]',
    notebook:        localStorage.getItem(NOTEBOOK_KEY) || '{}',
    errors:          localStorage.getItem(ERRORS_KEY)   || '{}',  // object, not array
  }
}

function applyRemoteToLocal(data) {
  if (data.xp !== undefined) {
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(XP_KEY) || '{"total":0,"history":[]}') }
      catch { return { total: 0, history: [] } }
    })()
    // Backend wins only if it has a higher total (merge strategy)
    if (data.xp > (existing.total || 0)) {
      localStorage.setItem(XP_KEY, JSON.stringify({ ...existing, total: data.xp }))
    }
  }

  if (data.streak_count !== undefined || data.last_study_date !== undefined) {
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}') }
      catch { return {} }
    })()
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      ...existing,
      current:  data.streak_count    ?? existing.current  ?? 0,
      lastDate: data.last_study_date ?? existing.lastDate ?? '',
    }))
  }

  if (data.hard_words) localStorage.setItem(HW_KEY,       data.hard_words)
  if (data.badges)     localStorage.setItem(BADGES_KEY,   data.badges)
  if (data.notebook)   localStorage.setItem(NOTEBOOK_KEY, data.notebook)
  if (data.errors)     localStorage.setItem(ERRORS_KEY,   data.errors)
}

export function useProgressSync() {
  const saveTimer = useRef(null)

  // On mount: pull from backend and merge
  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API_BASE}/progress/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) applyRemoteToLocal(data) })
      .catch(() => {})
  }, [])

  // Debounced save: waits 2s after the last change before hitting the backend
  const saveProgress = useCallback(() => {
    const token = getToken()
    if (!token) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`${API_BASE}/progress/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(localToPayload()),
      }).catch(() => {})
    }, 2000)
  }, [])

  // Patch localStorage.setItem to auto-trigger save when progress keys change
  useEffect(() => {
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = function (key, value) {
      original(key, value)
      if (WATCHED_KEYS.includes(key)) saveProgress()
    }
    return () => { localStorage.setItem = original }
  }, [saveProgress])

  return { saveProgress }
}
