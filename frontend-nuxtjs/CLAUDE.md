# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server on :3000
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm lint             # ESLint (uses @nuxt/eslint)
pnpm typecheck        # vue-tsc type checking via `nuxt typecheck`
pnpm test             # Vitest in watch mode
pnpm test:run         # Vitest single run
pnpm test:coverage    # Vitest with v8 coverage
```

Package manager: **pnpm** (lockfile: `pnpm-lock.yaml`).

## Stack

- **Nuxt 4** (app directory pattern: source code in `app/`, not project root)
- **Nuxt UI v4** (`@nuxt/ui`) — provides `UApp`, `UCard`, `UButton`, `UModal`, `UInput`, `UFormField`, `UTextarea`, `UScrollArea`, `USkeleton`, `UEmpty`, `UAlert`, `USeparator`, `UColorModeButton` and Tailwind v4 integration
- **Tailwind CSS v4** — imported via `@import "@nuxt/ui"` in `app/assets/css/main.css`, no `tailwind.config` file
- **vue-draggable-plus** for drag-and-drop (SortableJS wrapper)
- **Vitest + happy-dom + @vue/test-utils** for testing

## Architecture

### Routing (file-based)

```
app/pages/index.vue              → / (login/register)
app/pages/boards/index.vue       → /boards (board list)
app/pages/boards/[boardId].vue   → /boards/:id (kanban board)
```

### Auth flow

- `plugins/api.ts` — provides `$api` via `$fetch.create()` with auto JWT injection from cookie and 401→logout redirect
- `composables/useAuth.ts` — `login()`, `register()`, `logout()` using cookie-based token storage (`useCookie('token')`, `useCookie('user')`)
- `middleware/auth.global.ts` — global route guard: unauthenticated users → `/`, authenticated users on `/` → `/boards`

### Component hierarchy

```
[boardId].vue
  └─ BoardComponent.vue        (list drag-and-drop, delegates all CRUD)
       ├─ KanbanList.vue        (card drag-and-drop, inline title edit)
       │    ├─ KanbanCard.vue   (click to edit, delete confirmation)
       │    └─ AddCardForm.vue  (inline add-card form)
       ├─ AddListForm.vue       (inline add-list form)
       └─ CardEditModal.vue     (modal for card title + description)
```

### Drag-and-drop pattern

`vue-draggable-plus` wraps SortableJS. Two `VueDraggable` instances: one for lists (in `BoardComponent`), one for cards per list (in `KanbanList`). Cards use `group="cards"` for cross-list dragging. On drag end, the component reads `data-id` / `data-list-id` from DOM attributes to determine cardId/destListId, emits `cardMoved`, parent calls `PUT /cards/:id/move`, then re-fetches the board. The `draggableKey` ref forces VueDraggable remount when server data refreshes to keep DOM in sync.

### Key conventions

- Types in `app/types/index.ts` (`Board`, `List`, `Card`) — auto-imported via `imports.dirs: ['types']` in nuxt.config
- API base URL from `NUXT_PUBLIC_API_BASE` env var (defaults to `http://localhost:3001`)
- Nuxt UI theme colors configured in `app/app.config.ts` (`primary: green`, `neutral: slate`)
- All API calls go through `$api` (from `useNuxtApp().$api`), never raw `$fetch`
- Components use Nuxt auto-import — no explicit imports needed for composables or Nuxt UI components

### Testing

Tests in `tests/` mirror `app/` structure. Setup file (`tests/setup.ts`) stubs all Nuxt auto-import globals (`useCookie`, `useNuxtApp`, `navigateTo`, `ref`, `computed`, etc.) via `vi.stubGlobal`. Uses `happy-dom` environment. Path alias `~` resolves to `app/`.
