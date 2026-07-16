// Single source of truth for the backend URL.
// Override at build time via REACT_APP_API_URL environment variable.
// Vercel: set in Project Settings → Environment Variables.
// Local dev: create frontend/.env.local with REACT_APP_API_URL=http://localhost:8000
export const API_BASE = process.env.REACT_APP_API_URL || 'https://acadai-backend-avvo.onrender.com'
