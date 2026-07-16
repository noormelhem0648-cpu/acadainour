// Centralized token access — single place to change storage strategy.
// Current: localStorage (requires backend httpOnly-cookie migration for full security).
// To migrate: change getToken/setToken to use sessionStorage, and update backend
// to set/clear httpOnly cookies on login/logout.

export const getToken = () => localStorage.getItem('noura_token')

export const setToken = (token) => {
  if (token) localStorage.setItem('noura_token', token)
  else localStorage.removeItem('noura_token')
}

export const authHeaders = () => {
  const t = getToken()
  return t
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
    : { 'Content-Type': 'application/json' }
}
