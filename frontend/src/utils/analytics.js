// Lightweight first-party analytics — no external service, no cookies banner needed.
// Fires events to our own backend (/analytics/track), which is instructor-only to read.
import { API_BASE } from '../config'

const SESSION_KEY = 'noura_session_id'

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function track(eventName, meta) {
  try {
    const token = localStorage.getItem('noura_token')
    const body = JSON.stringify({
      event_name: eventName,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      session_id: getSessionId(),
      meta: meta ? JSON.stringify(meta) : undefined,
    })
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    // Fire-and-forget — never block or throw on the caller
    fetch(`${API_BASE}/analytics/track`, { method: 'POST', headers, body, keepalive: true }).catch(() => {})
  } catch { /* analytics must never break the app */ }
}

export function trackPageView(path) {
  track('page_view', path ? { path } : undefined)
}
