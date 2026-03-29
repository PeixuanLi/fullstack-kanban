# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack Kanban board with drag-and-drop. Monorepo with two independent apps — no workspace config at root level.

- **frontend/** — Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui
- **backend/** — NestJS 11 + Prisma 7 + PostgreSQL 16 + Passport JWT

## Common Commands

### Backend (from `backend/`)

```bash
npm run start:dev          # Dev server with watch (port 3001)
npm test                   # Unit tests (Jest + ts-jest, matches *.spec.ts)
npm run test:e2e           # E2E tests (config in test/jest-e2e.json)
npx prisma migrate dev     # Run migrations + regenerate client
npx prisma generate        # Regenerate Prisma client only
npm run lint               # ESLint with Prettier
```

### Frontend (from `frontend/`)

```bash
npm run dev                # Dev server (port 3000)
npm run build              # Production build
npm test                   # Jest tests
npm run lint               # ESLint
```

### Docker

```bash
docker compose up --build              # Full stack (postgres:5433, backend:3001, frontend:3000)
docker compose up postgres             # Just PostgreSQL (port 5433 on host)
```

Note: Docker maps PostgreSQL to host port **5433** (not 5432) to avoid conflicts.

## Architecture

### Backend (NestJS)

**Entry:** `backend/src/main.ts` — global `ValidationPipe` (whitelist + transform), CORS from `CORS_ORIGIN` env var.

**Module structure** (`backend/src/app.module.ts`):
- `ConfigModule` — global, reads `.env`
- `PrismaModule` — provides `PrismaService` (singleton, injected everywhere)
- `AuthModule` — register/login endpoints, `JwtStrategy`, `JwtAuthGuard`
- `BoardsModule` / `ListsModule` / `CardsModule` — CRUD + reordering

**Auth flow:** Passport JWT strategy validates `Authorization: Bearer <token>` on protected routes. Passwords hashed with bcrypt. JWT has 7-day expiry.

**Prisma client output:** `backend/generated/prisma/` (not default `node_modules`). Tests mock `@prisma/client` via `backend/src/__mocks__/prisma-client.ts`.

**Env vars:** `DATABASE_URL`, `JWT_SECRET`, `PORT` (default 3001), `CORS_ORIGIN` (default `http://localhost:3000`).

### Frontend (Next.js App Router)

**Entry layout:** `frontend/src/app/layout.tsx` — wraps with `AuthProvider`.

**Key directories:**
- `app/` — pages: `page.tsx` (login/register), `boards/` (board list + `[boardId]/page.tsx` for board detail)
- `components/` — `Board.tsx`, `List.tsx`, `Card.tsx`, `CardEditModal.tsx`, `AddCardForm.tsx`, `AddListForm.tsx`, `ui/` (shadcn), `providers/`
- `lib/api.ts` — typed HTTP client with auto-JWT injection and 401→logout redirect
- `lib/auth.tsx` — `AuthProvider` context + `useAuth()` hook, persists token/user in localStorage

**All page components are `'use client'`** — this app uses client-side rendering exclusively.

**Drag-and-drop:** Uses `@hello-pangea/dnd`. Board data refetched after every drag operation.

### Database Schema

```
User 1──* Board 1──* List 1──* Card
```

- `List` has `@@unique([boardId, position])` — position is unique within a board
- `Card` has `@@unique([listId, position])` — position is unique within a list
- Cascade deletes: Board → List → Card

### Frontend–Backend Contract

All API calls go through `lib/api.ts` which sends JSON with `Authorization: Bearer <token>`. Backend returns JSON; 204 for successful deletes. 401 responses trigger automatic logout and redirect to `/`.

## Important Notes

- **Next.js 16 has breaking changes** from earlier versions — check `frontend/node_modules/next/dist/docs/` before modifying Next.js-specific APIs
- **Prisma 7** uses `prisma-client` provider (not `prisma-client-js`) in schema generator
- **shadcn/ui** components live in `frontend/src/components/ui/` — use the shadcn CLI to add new ones
