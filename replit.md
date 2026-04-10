# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: express-session + bcryptjs
- **Real-time**: Socket.IO (WebSockets)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 3001 local / 8080 Replit)
│   └── love-app/           # "Us" relationship app (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── .env.example            # Template for local environment variables
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## "Us" App — Feature Summary

The main artifact is a 2-person private relationship app named **"Us"** at previewPath `/`.

### Features
1. **Auth** — register + login with session cookies (express-session + bcrypt)
2. **Pairing** — generate a 6-character code, partner enters it to link accounts
3. **Daily Love Checkin** — "I said I love you today" button, tracks daily completion per user
4. **Streak Tracker** — current streak + longest streak when both partners check in
5. **Miss You Button** — instantly notifies partner they're missed
6. **Mood Check** — happy/neutral/sad mood set once per day, visible to partner
7. **Daily Message Timeline** — 1 short message per person per day, shared feed
8. **Private Chat** — real-time messaging via Socket.IO with typing indicator, seen/read status, and animated typing bubble

### Database Tables
- `users` — accounts with session, pairing code, coupleId
- `couples` — links two users together
- `checkins` — daily love reminder completions
- `messages` — daily messages per couple
- `moods` — daily mood per user
- `miss_you` — miss you notifications with seen tracking
- `chat_messages` — private chat messages with `readAt` timestamp for seen status

## Local Development

Environment variables are loaded from `.env` at the project root (via `dotenv`).

1. `cp .env.example .env` and fill in `DATABASE_URL` and `SESSION_SECRET`
2. `pnpm install`
3. `pnpm --filter @workspace/db run push` — apply schema to DB
4. `pnpm dev` — starts both API (port 3001) and frontend (port 5173) via `concurrently`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run dev` — starts both API server and frontend concurrently (local development)
- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`.

- Routes: users, couples, checkins, messages, notifications, chat
- Auth: express-session (session stored in memory, cookie-based)
- Depends on: `@workspace/db`, `@workspace/api-zod`, `zod`, `bcryptjs`, `express-session`, `socket.io`
- Socket.IO at `/socket.io` — authenticated via session cookie; rooms per couple (`couple:{id}`)
- Socket events: `new_message`, `partner_typing`, `message_seen` (server→client); `typing_start`, `typing_stop`, `mark_seen` (client→server)
- Default port: 3001 (override with `PORT` env var)
- Loads `.env` from project root automatically via `--env-file-if-exists` tsx flag

### `artifacts/love-app` (`@workspace/love-app`)

React + Vite frontend for the relationship app.

- Pages: login, onboarding, home, timeline, chat, profile
- Components: BottomNav, AppLayout
- Hooks: use-app-queries (React Query)
- Served at previewPath `/`
- Default port: 5173 (override with `PORT` env var)
- Proxies `/api` requests to `http://localhost:API_PORT` (default 3001) in development

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/users.ts` — user accounts
- `src/schema/couples.ts` — couple pairings
- `src/schema/checkins.ts` — daily love checkins
- `src/schema/messages.ts` — daily messages
- `src/schema/moods.ts` — daily moods
- `src/schema/missyou.ts` — miss you notifications

In development: `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) and Orval config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
