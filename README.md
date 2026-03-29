# Fullstack Kanban Board

A **full-stack TypeScript learning project** — a drag-and-drop Kanban board that covers the complete development pipeline from UI components to backend API, database modeling, and containerized deployment. Built with modern, production-grade tooling so you learn patterns you'll use in real projects.

[中文文档](./README-zh.md)

## What You'll Learn

This project is designed as a hands-on guide for TypeScript developers who want to understand how the pieces of a full-stack application fit together:

| Stage | Topics |
|-------|--------|
| **Frontend + UI** | Next.js 16 App Router, React 19 components & hooks, Tailwind CSS 4 utility-first styling, shadcn/ui component system, drag-and-drop (`@hello-pangea/dnd`) |
| **Backend + API** | NestJS 11 modular architecture, RESTful API design, Passport JWT authentication, request validation with pipes, unit testing with Jest |
| **Database + ORM** | PostgreSQL 16 relational modeling, Prisma 7 schema & migrations, cascade deletes, unique constraints, client generation |
| **DevOps / Deployment** | Docker multi-stage builds, Docker Compose multi-service orchestration, environment variable management, CORS configuration |

## Tech Stack

| Layer | Technology | Why It's Here |
|-------|-----------|---------------|
| Frontend Framework | Next.js 16 (App Router) | Learn file-based routing, layouts, and the latest Next.js patterns |
| UI Library | React 19 | Master component composition, hooks, context, and client-side rendering |
| Styling | Tailwind CSS 4 | Utility-first CSS — style rapidly without leaving your markup |
| Component Kit | shadcn/ui | Understand how to build and consume a composable component library |
| Backend Framework | NestJS 11 | Learn decorators, modules, dependency injection, and structured API design |
| Database | PostgreSQL 16 | Production-grade relational database — schema design, constraints, indexes |
| ORM | Prisma 7 | Type-safe database access, migrations, and auto-generated types |
| Authentication | Passport.js + JWT | Industry-standard token-based auth with bcrypt password hashing |
| Drag & Drop | @hello-pangea/dnd | Complex state updates across lists with optimistic UI |
| Deployment | Docker Compose | Run frontend, backend, and database together with a single command |

## Architecture at a Glance

```
Browser (React)
  │  HTTP + JWT
  ▼
Next.js 16 ──── CORS ──── NestJS 11
                               │
                          Prisma ORM
                               │
                          PostgreSQL 16
```

The frontend runs entirely client-side (`'use client'`). Every API call goes through `lib/api.ts`, which auto-injects the JWT token. The backend validates the token via Passport's JWT strategy on every protected route.

## Features

- **User Auth** — Registration, login, JWT-based session (7-day expiry), auto-logout on 401
- **Boards** — Create, rename, delete boards; each user sees only their own
- **Lists** — Add, rename, delete lists within a board; drag to reorder
- **Cards** — Create, edit (title + description), delete cards; drag within or across lists
- **Responsive UI** — Tailwind CSS + shadcn/ui, works across screen sizes

## Project Structure

```
fullstack-kanban/
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── auth/            # Register, login, JWT strategy, bcrypt hashing
│   │   ├── boards/          # Board CRUD + ownership checks
│   │   ├── lists/           # List CRUD + position-based reordering
│   │   ├── cards/           # Card CRUD + cross-list move logic
│   │   └── prisma/          # PrismaService singleton
│   └── prisma/
│       └── schema.prisma    # Database models & relations
├── frontend/                 # Next.js client app
│   └── src/
│       ├── app/             # Routes: login, board list, board detail
│       ├── components/      # Board, List, Card, Modals, Forms, UI primitives
│       └── lib/             # API client, auth context, TypeScript types
└── docker-compose.yml       # PostgreSQL + Backend + Frontend
```

## Full-Stack Walkthrough

### Frontend — Next.js + React + Tailwind + shadcn/ui

The frontend uses **Next.js 16 App Router** for file-based routing and **React 19** for component rendering. All page components are client-side rendered (`'use client'`), which keeps the mental model simple while learning.

Key files to study:

| File | What You Learn |
|------|---------------|
| `frontend/src/app/layout.tsx` | Root layout, wrapping providers (`AuthProvider`) |
| `frontend/src/app/page.tsx` | Login/register page, form handling, API integration |
| `frontend/src/app/boards/page.tsx` | Board list, authenticated data fetching |
| `frontend/src/app/boards/[boardId]/page.tsx` | Dynamic routes, board detail with drag-and-drop |
| `frontend/src/lib/auth.tsx` | React Context + `useAuth()` hook, token persistence |
| `frontend/src/lib/api.ts` | Typed HTTP client, automatic JWT injection, 401 handling |
| `frontend/src/components/Board.tsx` | Drag-and-drop context, list reordering |
| `frontend/src/components/Card.tsx` | Draggable cards, cross-list movement |
| `frontend/src/components/ui/` | shadcn/ui primitives (Button, Input, Dialog…) |

### Backend — NestJS + Passport JWT

The backend follows NestJS's **modular architecture**: each domain (auth, boards, lists, cards) is a self-contained module with its own controller, service, and DTOs.

Key files to study:

| File | What You Learn |
|------|---------------|
| `backend/src/main.ts` | Bootstrap, global `ValidationPipe`, CORS setup |
| `backend/src/app.module.ts` | Module composition, dependency injection |
| `backend/src/auth/` | Register/login flow, bcrypt hashing, JWT strategy, guards |
| `backend/src/boards/` | CRUD controller, DTOs with class-validator, ownership checks |
| `backend/src/lists/` | Position-based ordering, reordering algorithm |
| `backend/src/cards/` | Cross-list card movement, position recalculation |
| `backend/src/prisma/` | PrismaService singleton pattern |

### Database — PostgreSQL + Prisma ORM

```
User  1──*  Board  1──*  List  1──*  Card
```

The schema demonstrates core relational modeling concepts:
- **Foreign keys & cascade deletes** — deleting a Board removes all its Lists and Cards
- **Unique constraints** — `@@unique([boardId, position])` ensures no two lists share a position within a board
- **Optional fields** — `content?` on Card allows cards with title-only
- **Prisma 7** — `prisma-client` provider, migrations via `npx prisma migrate dev`, type-safe queries

Key file: `backend/prisma/schema.prisma`

### Deployment — Docker Compose

A single `docker compose up --build` starts all three services:

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | PostgreSQL 16 | 5433 (host) | Data persisted via Docker volume |
| `backend` | Node.js (multi-stage) | 3001 | Auto-runs Prisma migrations on start |
| `frontend` | Node.js | 3000 | Proxies to backend via `NEXT_PUBLIC_API_URL` |

Key file: `docker-compose.yml` and `backend/Dockerfile`

## API Endpoints

All endpoints except auth require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/boards` | List user's boards |
| POST | `/boards` | Create board |
| GET | `/boards/:id` | Get board with lists & cards |
| PATCH | `/boards/:id` | Rename board |
| DELETE | `/boards/:id` | Delete board |
| POST | `/boards/:boardId/lists` | Add list |
| PATCH | `/lists/:id` | Rename list |
| DELETE | `/lists/:id` | Delete list |
| PUT | `/boards/:boardId/lists/reorder` | Reorder lists |
| POST | `/lists/:listId/cards` | Add card |
| PATCH | `/cards/:id` | Edit card |
| DELETE | `/cards/:id` | Delete card |
| PUT | `/cards/:id/move` | Move card across lists/positions |

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Run with Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5433

### Run Locally (Development)

**1. Start PostgreSQL**

```bash
docker compose up postgres
```

**2. Backend**

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npm run start:dev
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/kanban` | Prisma connection string |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing key |
| `PORT` | `3001` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

## Detailed Guides

Deep-dive documentation for each layer of the stack:

| Document | Description |
|----------|-------------|
| [Next.js/React Guide](./docs/nextjs-guide.md) | App Router, React fundamentals, frontend architecture, and implementation patterns |
| [shadcn/ui Guide](./docs/shadcn-guide.md) | shadcn/ui component library setup and usage |
| [NestJS Guide](./docs/nestjs-guide.md) | NestJS backend architecture, modules, auth, and key implementation patterns |
| [PostgreSQL Guide](./docs/postgresql-guide.md) | PostgreSQL + Prisma ORM usage guide |
| [Docker Guide](./docs/docker-guide.md) | Docker and Docker Compose configuration walkthrough |
| [Card Drag Call Stack](./docs/card-drag-call-stack.md) | Full-stack call chain analysis for card drag-and-drop |

## License

[MIT](./LICENSE)
