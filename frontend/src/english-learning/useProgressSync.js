/**
 * useProgressSync — syncs student progress between localStorage and backend DB.
 * Call once at app root after login. Exposes saveProgress() to trigger a manual sync.
 */
import { useEffect, useCallback, useRef } from 'react'
import { API_BASE } from '../config'

const KEYS = ['el_xp', 'el_streak', 'el_hardWords', 'el_badges', 'el_notebook', 'el_errors']

function getToken() { return localStorage.getItem('noura_token') || '' }

function localToPayload() {
  const streak = (() => { try { return JSON.parse(localStorage.getItem('el_streak') || '{}') } catch { return {} } })()
  return {
    xp:              parseInt(localStorage.getItem('el_xp') || '0', 10),
    streak_count:    streak.count ?? 0,
    last_study_date: streak.lastDate ?? '',
    hard_words:      localStorage.getItem('el_hardWords') || '[]',
    badges:          localStorage.getItem('el_badges')    || '[]',
    notebook:        localStorage.getItem('el_notebook')  || '{}',
    errors:          localStorage.getItem('el_errors')    || '[]',
  }
}

function applyRemoteToLocal(data) {
  if (data.xp !== undefined)
    localStorage.setItem('el_xp', String(data.xp))

  if (data.streak_count !== undefined || data.last_study_date !== undefined) {
    const existing = (() => { try { return JSON.parse(localStorage.getItem('el_streak') || '{}') } catch { return {} } })()
    localStorage.setItem('el_streak', JSON.stringify({
      ...existing,
      count:    data.streak_count    ?? existing.count ?? 0,
      lastDate: data.last_study_date ?? existing.lastDate ?? '',
    }))
  }

  if (data.hard_words) localStorage.setItem('el_hardWords', data.hard_words)
  if (data.badges)     localStorage.setItem('el_badges',    data.badges)
  if (data.notebook)   localStorage.setItem('el_notebook',  data.notebook)
  if (data.errors)     localStorage.setItem('el_errors',    data.errors)
}

export function useProgressSync() {
  const saveTimer = useRef(null)

  // On mount: pull from backend and merge (backend wins on conflict)
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

  // Debounced save to backend (waits 2s after last call)
  const saveProgress = useCallback(() => {
    const token = getToken()
    if (!token) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`${API_BASE}/progress/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(localToPayload()),
      }).catch(() => {})
    }, 2000)
  }, [])

  // Patch localStorage.setItem to auto-save when progress keys change
  useEffect(() => {
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = function(key, value) {
      original(key, value)
      if (KEYS.includes(key)) saveProgress()
    }
    return () => { localStorage.setItem = original }
  }, [saveProgress])

  return { saveProgress }
}
