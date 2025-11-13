# Environment setup

Create `.env` files using the templates below.

## Frontend (Nuxt) `.env`
```
# ===== UBU AI Gateway - Frontend (Nuxt) =====

# Nuxt runtime
JWT_SECRET=dev-secret-change-me

# OAuth Portal
OAUTH_CLIENT_ID=ubu-ai-gateway
OAUTH_LOGIN_URL=https://dev.ubu.ac.th/oauth_server/login
OAUTH_ME_URL=https://dev.ubu.ac.th/oauth_server/me
REDIRECT_URI=http://localhost:3000/callback

# Public config
PUBLIC_API_BASE=http://localhost:3000
PUBLIC_APP_NAME=UBU AI SERVICE

# Database URL (optional for Prisma tooling)
DATABASE_URL=postgresql://ai:ubu-ai@202.28.49.204:5433/ai-gateway?schema=public
```

Place at: `frontend/.env`

---

## Backend (Express) `.env`
```
# ===== UBU AI Gateway - Backend (Express) =====

# App
PORT=4000
NODE_ENV=development
JWT_SECRET=dev-secret-change-me

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://dev2.ubu.ac.th

# PostgreSQL
PGUSER=ai
PGPASSWORD=ubu-ai
PGHOST=202.28.49.204
PGDATABASE=ai-gateway
PGPORT=5433

# Mail API (optional)
MAIL_API_URL=http://202.28.49.210:8000
MAIL_API_SYSTEM=SWDEV2

# SMTP fallback (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# OAuth (optional if backend talks to portal)
OAUTH_LOGIN_URL=https://dev.ubu.ac.th/oauth_server/login
OAUTH_ME_URL=https://dev.ubu.ac.th/oauth_server/me
REDIRECT_URI=http://localhost:3000/callback
OAUTH_CLIENT_ID=ubu-ai-gateway
```

Place at: `backend/.env`
