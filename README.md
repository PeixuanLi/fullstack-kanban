# Fullstack Kanban Board

A modern Kanban board application with drag-and-drop support, built with NestJS and Next.js.

[中文文档](./README-zh.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 |
| Backend | NestJS 11 + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | Passport.js + JWT |
| Drag & Drop | @hello-pangea/dnd |
| Deploy | Docker Compose |

## Features

- **User Auth** — Registration, login, JWT-based session (7-day expiry)
- **Boards** — Create, rename, delete boards; each user sees only their own
- **Lists** — Add, rename, delete lists within a board; drag to reorder
- **Cards** — Create, edit (title + description), delete cards; drag within or across lists
- **Responsive UI** — Tailwind CSS styling, works across screen sizes

## Project Structure

```
fullstack-kanban/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/            # Register, login, JWT strategy
│   │   ├── boards/          # Board CRUD
│   │   ├── lists/           # List CRUD + reorder
│   │   ├── cards/           # Card CRUD + move
│   │   └── prisma/          # Prisma service
│   └── prisma/
│       └── schema.prisma    # Database schema
├── frontend/                 # Next.js App
│   └── src/
│       ├── app/             # Pages (login, boards, board detail)
│       ├── components/      # Board, List, Card, Modals, Forms
│       └── lib/             # API client, auth context, types
└── docker-compose.yml       # PostgreSQL + Backend + Frontend
```

## API Endpoints

All endpoints except auth require a JWT `Authorization: Bearer <token>` header.

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
- PostgreSQL: localhost:5432

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
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/kanban` | Prisma connection string |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing key |
| `PORT` | `3001` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

## Database Schema

```
User  1──*  Board  1──*  List  1──*  Card
```

- **User**: id, username, password (bcrypt hashed)
- **Board**: id, title, userId
- **List**: id, title, position, boardId (unique: boardId + position)
- **Card**: id, title, content?, position, listId (unique: listId + position)

Cascade deletes propagate from Board → List → Card.
