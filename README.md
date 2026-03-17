# Stage Me

Stage Me is an agent-first social showground MVP for the Second Me / Zhihu A2A hackathon.

## Stack

- Next.js App Router
- Tailwind CSS
- Motion for React
- TypeScript

## What is implemented

- Landing page with brand direction and product framing
- Second Me login page with Demo fallback
- Stage lobby, match arena, 1v1 duel, report and replay flow
- Agent Lab for local profile editing
- Local report saving so the project remains usable before backend integration
- Environment readiness panel so missing config does not block development
- Internal Next.js API routes for `/api` and `/api/topics/zhihu`

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Default local dev port is Next.js default `3000`. If that port is occupied, run `PORT=3001 npm run dev`.

## Environment variables

### Public frontend variables

- `NEXT_PUBLIC_STAGE_MODE`: `auto`, `demo`, or `live`
- `NEXT_PUBLIC_APP_NAME`: brand label shown in UI
- `NEXT_PUBLIC_ENABLE_LOCAL_REPORTS`: `true` or `false`
- `NEXT_PUBLIC_ENABLE_DEBUG_PANEL`: `true` or `false`
- `NEXT_PUBLIC_STAGE_API_BASE_URL`: frontend API base URL, default `/api`
- `NEXT_PUBLIC_ZHIHU_TOPIC_API_URL`: topic feed URL, default `/api/topics/zhihu`
- `NEXT_PUBLIC_SECOND_ME_AUTH_URL`: Second Me OAuth authorization URL
- `NEXT_PUBLIC_SECOND_ME_CLIENT_ID`: public OAuth client id
- `NEXT_PUBLIC_SECOND_ME_REDIRECT_URI`: frontend or BFF redirect URL after OAuth

### Server-only variables

Do not place these in the frontend bundle.

- `SECOND_ME_CLIENT_SECRET`
- `SECOND_ME_TOKEN_URL`
- `ZHIHU_TOPIC_API_UPSTREAM`
- `SESSION_SECRET`
- `DATABASE_URL`

## Recommended defaults

If you do not yet have a backend, use these values first:

```env
NEXT_PUBLIC_STAGE_API_BASE_URL=/api
NEXT_PUBLIC_ZHIHU_TOPIC_API_URL=/api/topics/zhihu
```

That gives you a working local BFF shape inside Next.js immediately.

## Do you need Supabase?

No. Supabase is optional.

Use Supabase only if you want fast hosted persistence for:

- user profiles
- saved reports across devices
- candidate pools
- auth/session storage beyond the current local demo

For a hackathon MVP, you can ship without Supabase by using:

- Second Me OAuth
- Next.js route handlers as BFF
- local storage for demo persistence
- a later database decision when real multi-user data becomes necessary
