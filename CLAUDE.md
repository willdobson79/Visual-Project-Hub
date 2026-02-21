# CLAUDE.md — Visual Project Dashboard (PKM Super Hub)
**Last Updated:** 21 February 2026 — Iteration 5

> **SUPERSEDES** `skills.md`. This file is the single source of truth for AI context.
> **MANDATORY PROTOCOL:** Update this file every 5 iterations automatically.

---

## Project Identity

This is a **PKM (Personal Knowledge Management) Super Hub** — a central, visual resource for all notes, tasks, projects, and ideas. It is **local-first** (IndexedDB via Dexie.js) with **bidirectional cloud sync** to a PostgreSQL database hosted at willpowered.design.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, PostCSS |
| Local DB | Dexie.js v4 (IndexedDB) |
| Cloud DB | PostgreSQL (bidirectional sync) |
| Canvas | @xyflow/react (React Flow) |
| Rich Text | Tiptap v3 (@tiptap/react, starter-kit) |
| Animations | Framer Motion |
| Icons | Lucide React (exclusively) |
| Drawing | Fabric.js v7 |
| CSV | PapaParse |
| Image Export | html-to-image |
| Package Manager | **pnpm** |

---

## Core Architecture Rules

- **Rendering**: All interactive components use `'use client'` — especially anything using `framer-motion`, `lucide-react`, `@xyflow/react`, or `dexie-react-hooks`.
- **Reactive data**: Always use `useLiveQuery` from `dexie-react-hooks`. Never fetch data outside of it for rendering.
- **Language**: UK British English throughout (e.g. "colour", "optimisation", "behaviour").
- **Icons**: Lucide React only — no other icon libraries.

---

## Database Hierarchy

```
Tab → Workspace → Board → Card → Connection
```

- **Tab**: Top-level category (e.g. "Master", "Finance", "Travel"). Owns workspaces.
- **Workspace**: Logical grouping of boards. Linked to a `tabId`.
- **Board**: Full interactive canvas. Contains cards and connections. Supports TagRules.
- **Card**: Core data unit — title, description, status, priority, colour, projectRef, tags[], rich content, drawing, attachments.
- **Connection**: Visual edge between two cards on the same board.
- **TagRule**: Auto-add tag config per board. New cards inherit configured tags.
- **ChangeHistory**: Point-in-time JSON snapshot of every CRUD op (7-day retention).
- **SyncQueue**: Push buffer for cloud synchronisation.

---

## Local DB — Dexie.js v4 (`src/lib/db.ts`)

**Schema version: v4.** Always increment for schema changes.

| Table | Indexed Fields |
|---|---|
| `tabs` | `id, userId, name, sortOrder, updatedAt, deletedAt` |
| `workspaces` | `id, tabId, userId, name, sortOrder, updatedAt, deletedAt` |
| `boards` | `id, workspaceId, userId, name, updatedAt, deletedAt` |
| `cards` | `id, boardId, title, status, updatedAt, deletedAt, *tags` |
| `connections` | `id, boardId, fromCardId, toCardId, updatedAt, deletedAt` |
| `tagRules` | `id, boardId, tag, updatedAt` |
| `changeHistory` | `++id, entityType, entityId, action, timestamp, [entityType+entityId]` |
| `syncQueue` | `++id, entityType, entityId, action, timestamp, synced` |

**Key DB helper methods:**
- `db.findRelatedCards(cardId)` — cross-board tag matching
- `db.getAllTags()` — global unique tag list
- `db.getAutoTags(boardId)` — auto-add tag rules for a board
- `db.logChange(entityType, entityId, action, snapshot)` — log to history buffer
- `db.pruneOldHistory()` — purge entries older than 7 days
- `db.getEntityHistory(entityType, entityId)` — per-entity timeline
- `db.getRecentHistory(limit)` — all changes in the last 7 days

**CRITICAL**: `addToSyncQueue()` automatically captures a snapshot and logs it to `changeHistory` before queuing for cloud sync. ALL CRUD operations are automatically buffered via this method.

---

## Bidirectional Sync (`src/lib/sync_service.ts`)

- **Push (Local → Cloud)**: `processSyncQueue()` — runs every 5s. POSTs each queued item to `/api/sync` which UPSERTs into PostgreSQL.
- **Pull (Cloud → Local)**: `pullFromCloud()` — runs every 30s + once on startup. GETs `/api/sync/pull?since=<timestamp>&deviceId=<id>` and merges via `bulkPut` (cloud wins on conflict).
- **Device ID**: Persistent `pkm_device_id` in localStorage.
- **Entity coverage**: All 6 types — tabs, workspaces, boards, cards, connections, tagRules.
- **SyncProvider**: React context exposing `isSyncing`, `pendingCount`, `lastSynced`, `triggerSync()`, `triggerPull()`.

---

## PostgreSQL Schema (Cloud)

| Table | Key Columns |
|---|---|
| `tabs` | `id, user_id, name, sort_order, updated_at, deleted_at` |
| `workspaces` | `id, tab_id (FK→tabs), user_id, name, description, colour, icon, sort_order` |
| `boards` | `id, workspace_id (FK→workspaces), user_id, name, description, settings (JSONB), is_locked` |
| `cards` | `id, board_id (FK→boards), position_x/y, width/height, colour, title, description, status, priority, content, z_index, locked, tags (TEXT[]), project_ref` |
| `connections` | `id, board_id (FK→boards), from_card_id/to_card_id (FK→cards), type, style, colour, label, animated, stroke_width, marker_start, marker_end` |
| `tag_rules` | `id, board_id (FK→boards), tag, updated_at` |
| `sync_metadata` | `device_id, last_pulled_at` |

All FKs: `ON DELETE CASCADE`. Run `node init_pg_schema.js` to create/upgrade.

---

## History Buffer System

- Every CRUD op auto-captures a full JSON snapshot into `changeHistory`.
- Snapshots are deep clones: `JSON.parse(JSON.stringify(data))`.
- 7-day retention — `pruneOldHistory()` deletes older entries.
- **Restore workflow**: `db.cards.put(snapshot)` → `db.addToSyncQueue(type, id, 'update')`.
- **HistoryPanel.tsx**: Slide-out panel with day grouping, entity type filter, search, JSON preview, restore button.

---

## Tag System

- Tags are `string[]` on each Card.
- **Cross-board linking**: `findRelatedCards()` queries ALL cards across ALL boards for shared tags.
- **Auto-add tags**: `TagRule` entities link a tag to a boardId. On card creation, `getAutoTags()` pre-populates tags.
- **UI**: Tags shown as pills on `VisualCard` (max 3, overflow indicator). Managed in `CardSidebar`. Auto-tags configured via ⚡ Zap button in `BoardControls`.

---

## Canvas Mechanics (@xyflow/react)

- Cards are custom nodes (`VisualCard`) with connection handles on all 4 sides.
- Edges map to `Connection` entities with configurable type, style, colour, stroke width, markers.
- Tool modes: Pointer (drag nodes) and Lasso (multi-select).
- Node position changes persisted to Dexie on each `onNodesChange` event.
- Use `.stopPropagation()` for event propagation inside embedded inputs.

---

## UI & Aesthetic Requirements

- **Theme**: Dark, premium glassmorphism — `.glass-panel`, `.glass-card`. Deep slate backgrounds.
- **Accent colours**: `text-accent-1` (Orange) · `text-accent-2` (Bright Violet) · `text-accent-3` (Blue)
- **Fonts**: `--font-outfit` (primary), `--font-inter` (fallback)
- **Animations**: Framer Motion. Core effect — `cinematicZoom` (scale 1.25→1, blur 12px→0, 1.8s).
- **Icons**: Lucide React exclusively.

---

## Component Map

| Component | Role |
|---|---|
| `src/app/page.tsx` | Dashboard: tab switcher, workspace sidebar, board grid, sync indicator, history access |
| `src/app/board/[id]/page.tsx` | Board canvas: React Flow, tool modes, header, sync indicator |
| `src/components/board/CardSidebar.tsx` | Card detail: fields, tags, related cards, rich text, drawing |
| `src/components/board/BoardControls.tsx` | Board actions: lock, export PNG, CSV import, auto-tag config |
| `src/components/board/BoardListView.tsx` | Table view alternative to canvas |
| `src/components/board/EdgeSidebar.tsx` | Connection editor: type, style, colour, markers |
| `src/components/board/AlignmentToolbar.tsx` | Multi-select alignment & distribution tools |
| `src/components/board/RichTextEditor.tsx` | Tiptap rich text editor |
| `src/components/board/CSVImportModal.tsx` | CSV import configuration |
| `src/components/board/DrawingCanvas.tsx` | Freehand drawing tool (Fabric.js) |
| `src/components/canvas/VisualCard.tsx` | Canvas node: title, status, priority, ref, tag pills |
| `src/components/canvas/GridBackground.tsx` | Canvas background grid |
| `src/components/dashboard/GlobalStats.tsx` | Dashboard statistics modal |
| `src/components/dashboard/HistoryPanel.tsx` | 7-day change history with search, filter, point-in-time restore |
| `src/components/dashboard/NewBoardModal.tsx` | Board creation modal |
| `src/components/dashboard/NewWorkspaceModal.tsx` | Workspace creation modal |
| `src/components/global/SyncIndicator.tsx` | Compact push/pull status widget with manual trigger buttons |
| `src/components/providers/SyncProvider.tsx` | React context managing sync lifecycle and state |
| `src/lib/db.ts` | Dexie schema v4 & all DB helpers |
| `src/lib/pg_db.ts` | PostgreSQL connection pool |
| `src/lib/sync_service.ts` | Bidirectional sync engine |
| `src/lib/utils.ts` | General utilities (`cn` helper) |
| `src/app/api/sync/route.ts` | Push API (POST — all 6 entity types) |
| `src/app/api/sync/pull/route.ts` | Pull API (GET — cloud → local) |

---

## Development Workflow

```bash
pnpm install              # Install all dependencies
npm run dev               # Start dev server at http://localhost:3000
npx tsc --noEmit          # Type-check without building
node init_pg_schema.js    # Create/upgrade PostgreSQL tables
```

**First-time setup** — on first load, the app auto-creates:
1. A "Master" tab
2. A "My Workspace" within that tab
3. A "Main Board" within that workspace

---

## Key Conventions & Gotchas

- Always use `pnpm` — never `npm install` (a `pnpm-lock.yaml` exists).
- Never use `npm install` to add packages; use `pnpm add`.
- All new interactive components must have `'use client'` at the top.
- Use `useLiveQuery` for any data that should re-render on DB change.
- Card status values: `'todo' | 'in-progress' | 'complete' | 'blocked'`.
- Card priority values: `'low' | 'medium' | 'high' | 'urgent'`.
- IDs are string UUIDs (not numeric auto-increment) in both Dexie and PostgreSQL.
- Soft-delete pattern: `deletedAt` timestamp field on all major entities.
- When adding a new entity type to sync, add it to both the push (`/api/sync/route.ts`) and pull (`/api/sync/pull/route.ts`) routes, and to `sync_service.ts`.
- DB schema changes MUST increment the Dexie version number.
