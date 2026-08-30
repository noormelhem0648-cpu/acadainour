import { useState, useEffect } from 'react'
import { API_BASE as API_URL } from '../../config'
import { getToken } from '../utils/auth'

const CACHE_KEY = 'noura_plan_cache'

function loadCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null') }
  catch { return null }
}

// Locked days beyond the free preview — unlock with Premium.
export const FREE_DAY_LIMIT = 5

export function usePlan() {
  const [plan, setPlan] = useState(() => loadCache()?.plan || 'free')
  const [loading, setLoading] = useState(() => !loadCache())

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    let cancelled = false
    const fetchPlan = (attempt) => {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
        .then(d => {
          if (cancelled) return
          const p = d.plan || 'free'
          setPlan(p)
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ plan: p })) } catch {}
          setLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          // Retry once after a short delay (cold-start / flaky network) before
          // giving up — a stale "locked" read is worse than a brief extra wait.
          if (attempt === 0) setTimeout(() => fetchPlan(1), 1500)
          else setLoading(false)
        })
    }
    fetchPlan(0)
    return () => { cancelled = true }
  }, [])

  return { plan, isPremium: plan === 'premium', loading }
}

export function isDayLocked(dayId, plan) {
  return Number(dayId) > FREE_DAY_LIMIT && plan !== 'premium'
}
