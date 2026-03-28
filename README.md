# Us — A Private App for Two

A private relationship app for couples. Share daily check-ins, moods, messages, and more.

---

## Local Setup

### Prerequisites

- **Node.js** 20 or higher — [nodejs.org](https://nodejs.org)
- **pnpm** — install with `npm install -g pnpm`
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/) or use a free cloud DB (Neon, Supabase, Railway)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/love_app
SESSION_SECRET=any-long-random-string
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Start the app

```bash
pnpm dev
```

This starts both the API server (port 3001) and the frontend (port 5173) at the same time. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
├── artifacts/
│   ├── api-server/     # Express API (port 3001 locally)
│   └── love-app/       # React + Vite frontend (port 5173 locally)
├── lib/
│   ├── api-client-react/  # Auto-generated React Query hooks
│   ├── api-spec/          # OpenAPI spec (source of truth for API)
│   ├── api-zod/           # Auto-generated Zod schemas
│   └── db/                # Drizzle ORM schema + DB connection
```

## Features

- **Auth** — register + login with session cookies
- **Pairing** — link two accounts with a 6-character code
- **Daily Love Check-in** — "I said I love you today" button with streak tracking
- **Mood Check** — set your mood (happy / neutral / sad), visible to your partner
- **Miss You Button** — instantly notify your partner
- **Daily Message Timeline** — one short message per person per day
- **Private Chat** — real-time messaging between partners

## Deploying

The app requires a PostgreSQL database. Any provider works — Neon, Supabase, Railway, or self-hosted.

Set `DATABASE_URL` and `SESSION_SECRET` as environment variables in your hosting platform and deploy the two services:

- **API**: `pnpm --filter @workspace/api-server run build && node artifacts/api-server/dist/index.cjs`
- **Frontend**: `pnpm --filter @workspace/love-app run build` → serve the `artifacts/love-app/dist/public` folder as static files
