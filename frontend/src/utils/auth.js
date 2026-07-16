// Shared auth token helpers — single source of truth for token key.
// Re-exports from english-learning utils so both halves of the app use the same key.
export { getToken, setToken, authHeaders } from '../english-learning/utils/auth'
