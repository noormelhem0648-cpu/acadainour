# Noura AI / AcadAI — Project Documentation

This file exists so the project can survive if the founder is unavailable for a
while. Read this before touching anything in production.

## What this is

A bilingual (Arabic-first) study platform for Yarmouk University's Applied
English Language department, plus a standalone "English Learning" curriculum
(A1→C2, 30-day structured lessons) for anyone learning English from scratch.
Core features: an AI study assistant grounded in course PDFs (RAG over FAISS),
quizzes, restrictions (instructors can block a subject temporarily), a social
layer (friends, groups, challenges), and — as of August 2026 — a Free/Premium
subscription model with both automated card checkout and manual bank-transfer
fallback.

## Repo layout

```
AcadAI/
├── backend/          FastAPI app, deployed on Render as a Web Service
│   ├── main.py        All HTTP routes except social + auth helpers
│   ├── auth.py         JWT issuing/verification (hash_password, require_user, require_instructor)
│   ├── db.py            SQLAlchemy models + migration script (see below)
│   ├── social.py        Friends/groups/chat/challenges router + WebSocket
│   ├── ai_engine.py      Gemini calls, API key rotation across contributed keys
│   ├── faiss_engine.py   Vector search over course PDFs, in-memory index cache
│   ├── subjects_meta.py  Static metadata about each Yarmouk subject
│   └── subjects/         Source PDFs + prebuilt FAISS indexes, per subject
└── frontend/         Create React App, deployed on Render as a Static Site
    ├── src/pages/          University-track pages (Home, Chat, Instructor, Auth...)
    ├── src/english-learning/  The standalone English curriculum (separate route tree)
    └── src/utils/analytics.js  First-party usage tracking (see Analytics section)
```

## Deployment

Both services are on **Render**, auto-deploying from `main` on GitHub
(`noormelhem0648-cpu/acadainour`). **Auto-deploy is currently OFF for the
backend / behaves like manual** — after `git push`, go to the Render
dashboard and click **Manual Deploy → Deploy latest commit** for whichever
service changed. If you forget this, the live site keeps running the old
code and env-var-only changes silently do nothing.

- Frontend: https://acadai-frontend.onrender.com (service `acadai-frontend`)
- Backend: https://acadai-backend-avvo.onrender.com (service `acadai-backend`)

## Environment variables (Render → service → Environment tab)

### Required — the app won't work correctly without these
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. Without it, `SessionLocal` is `None` and all DB-backed features (auth, chat history, payments, analytics) silently no-op or 500. |
| `JWT_SECRET_KEY` | Signs login tokens. **If unset, a random key is generated on every process restart — every logged-in user gets kicked out.** Never remove this once set. |
| `GEMINI_API_KEY` | Primary Google Gemini key for the AI assistant. |
| `GEMINI_API_KEY1` … `GEMINI_API_KEY11` | Additional keys contributed by users (via the 🔑 button) or added manually. `ai_engine.py` rotates across all of them to spread quota/rate-limit load. More keys = more capacity. |

### Payments
| Variable | Purpose |
|---|---|
| `MYFATOORAH_API_KEY` | Enables the automated card-checkout button. If unset, `/payments/checkout` returns 503 and the UI just shows the manual bank-transfer flow. |
| `MYFATOORAH_MODE` | `test` (sandbox, fake cards, no real money) or `live` (real charges — requires MyFatoorah to approve your identity/business docs first). |
| `PREMIUM_PRICE_JOD` | Numeric price charged via MyFatoorah, e.g. `3.000`. |
| `PREMIUM_PRICE` | Display string shown in the UI, e.g. `"3 JOD / شهرياً"`. Keep in sync with the number above. |
| `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_HOLDER`, `PAYMENT_IBAN` | Shown in the manual bank-transfer fallback instructions. |
| `BACKEND_URL` | Used to build MyFatoorah's callback URL. Must match the actual backend origin. |
| `FRONTEND_URL` | Used for password-reset links and the post-checkout redirect. |

### Optional infrastructure
| Variable | Purpose |
|---|---|
| `REDIS_URL` | Optional response cache. App works fine without it, just slower/no caching. |
| `R2_ENDPOINT`, `R2_KEY`, `R2_SECRET`, `R2_BUCKET` | Cloudflare R2 (S3-compatible) storage for voice messages in the social chat feature. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` | Sends password-reset emails. Without these, forgot-password silently does nothing (check Render logs for `[Email] SMTP not configured`). |
| `ALLOWED_ORIGINS` | Extra CORS origins beyond the hardcoded defaults (comma-separated). |
| `ADMIN_SECRET` | One-time-use secret to promote/demote a user to `instructor` role via `GET /auth/make-instructor?email=...&secret=...`. Keep this private — anyone with it can grant themselves instructor access. |

## Database

Postgres via SQLAlchemy. **No formal migration tool (no Alembic)** — schema
changes are handled two ways:
1. New tables: just add the `class X(Base):` model in `db.py`. `Base.metadata.create_all()` runs on every startup and creates missing tables automatically.
2. New columns on existing tables: add an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` line to the `_migrate()` function in `db.py`. This also runs on every startup.

If you ever need to drop/rename a column, you'll have to write that SQL by
hand and run it once (e.g. via Render's shell or a local `psql` connection)
— there's no rollback mechanism.

## Key business logic to know

- **Daily AI message quota** (`_check_daily_limit` in `main.py`): Free users get 15 AI messages/day per subject, Premium gets 300. Resets at midnight UTC per user (`daily_date`/`daily_count` columns).
- **Plan upgrades happen two ways**: (1) automatically via the MyFatoorah callback after a verified card payment, or (2) manually — a student uploads a payment screenshot, an instructor approves it in `/instructor` → "📥 طلبات دفع بانتظار المراجعة", which flips `User.plan` to `"premium"`.
- **Instructor role** is separate from Premium — it's an admin/teacher account (can block subjects, review payments, see analytics), not a paid tier.
- **Subject restrictions**: instructors can block a subject_code temporarily (immediate or scheduled) via `/restrictions`. Blocked subjects return a canned "🔒 blocked" message instead of calling Gemini — this doesn't count against the daily quota.

## Analytics

First-party, no third-party service. `frontend/src/utils/analytics.js` fires
events to `POST /analytics/track` with an anonymous `session_id` (stored in
localStorage) plus the user's JWT if logged in. View the dashboard at
`/instructor` → "📊 الاستخدام" (instructor role required). Allowed event
names are whitelisted in `ALLOWED_EVENT_NAMES` in `main.py` — adding a new
`track("something")` call in the frontend without also adding it to that set
will make the event silently fail with a 400.

## If the founder becomes unavailable

1. GitHub repo access is the critical asset — make sure at least one other
   trusted person has collaborator access to `noormelhem0648-cpu/acadainour`.
2. Render dashboard access (or at minimum, the ability to read/rotate env
   vars) is the second critical asset — the API keys and JWT secret live
   there, not in git.
3. The Gemini API keys are personal Google accounts' keys contributed by
   users — if enough of them expire/get revoked, the AI assistant stops
   working until new keys are added via `/keys/contribute` or manually as
   `GEMINI_API_KEY12`, etc.
4. MyFatoorah's dashboard (separate login, tied to the business registration)
   controls the real payment flow and payout bank account — losing access
   there stops real revenue collection until support resets it.
