---
name: Visual Project Dashboard Core Skills
description: Unified skills and protocols for building and maintaining the PKM Super Hub
---

# Unified Project Skills & Protocols
**Last Updated:** 21 February 2026 — Iteration 5

> **MANDATORY PROTOCOL:** This file and `MASTER_DOCS.md` must be updated every 5 iterations automatically.

---

## 1. Core Architecture
- **Framework**: Next.js 16+ (App Router) with React 19 and strict TypeScript.
- **Rendering**: Client-side (`'use client'`) for all interactive components involving `framer-motion`, `lucide-react`, `@xyflow/react`, and `dexie-react-hooks`.
- **Package Manager**: pnpm.
- **Project Identity**: This is a **PKM (Personal Knowledge Management) Super Hub** — a central resource for all notes, tasks, and information.

## 2. Database Hierarchy
Strict nested hierarchy:

```
Tab → Workspace → Board → Card → Connection
```

- **Tab**: Top-level category (e.g. "Master", "Finance", "Travel"). Owns workspaces.
- **Workspace**: Owns multiple boards. Linked to a `tabId`.
- **Board**: Contains cards and connections. Can have `TagRules` for auto-add.
- **Card**: Core data unit with `tags[]`, position, rich content, status, priority, projectRef.
- **Connection**: Visual edge linking two cards on the same board.
- **TagRule**: Auto-add tag config per board. New cards inherit these tags.
- **ChangeHistory**: Point-in-time snapshot of every CRUD operation (7-day retention).

## 3. Local-First Data Handling (Dexie.js v4)
- All data lives in **IndexedDB** via Dexie.js (`ProjectCanvasDB`).
- Always use `useLiveQuery` from `dexie-react-hooks` for reactive rendering.
- Schema versioning: Currently at **v4**. Always increment version for schema changes.
- Key helper methods on the DB class:
  - `db.findRelatedCards(cardId)` — cross-board tag matching.
  - `db.getAllTags()` — global unique tag list.
  - `db.getAutoTags(boardId)` — auto-add tag rules for a board.
  - `db.logChange(entityType, entityId, action, snapshot)` — log to history buffer.
  - `db.pruneOldHistory()` — purge entries older than 7 days.
  - `db.getEntityHistory(entityType, entityId)` — per-entity timeline.
  - `db.getRecentHistory(limit)` — all changes in the last 7 days.
- **CRITICAL**: `addToSyncQueue()` automatically captures a snapshot and logs it to `changeHistory` before queuing for cloud sync. This means ALL CRUD operations are automatically buffered.

## 4. Bidirectional Sync Architecture
- **Push (Local → Cloud)**: `processSyncQueue()` in `sync_service.ts`. Runs every 5 seconds. Sends each queued item to `POST /api/sync` which performs UPSERT into PostgreSQL.
- **Pull (Cloud → Local)**: `pullFromCloud()` in `sync_service.ts`. Runs every 30 seconds + once on startup. Calls `GET /api/sync/pull?since=<timestamp>&deviceId=<id>` and merges results into Dexie via `bulkPut`.
- **Conflict Resolution**: Cloud wins on pull (last-write-wins via `bulkPut`).
- **Device Tracking**: Persistent `pkm_device_id` in localStorage. PG `sync_metadata` table tracks `last_pulled_at` per device.
- **Entity Coverage**: All 6 types — tabs, workspaces, boards, cards, connections, tagRules.
- **SyncProvider**: React context exposing `isSyncing`, `pendingCount`, `lastSynced`, `triggerSync()`, `triggerPull()`.

## 5. History Buffer System
- `changeHistory` table with compound index `[entityType+entityId]`.
- Snapshot is a deep clone (`JSON.parse(JSON.stringify(data))`).
- **Restore workflow**: `db.cards.put(snapshot)` → `db.addToSyncQueue(type, id, 'update')`.
- **Pruning**: `pruneOldHistory()` deletes entries where `timestamp < (now - 7 days)`.
- **HistoryPanel.tsx**: Slide-out panel with day grouping, entity type filter, search, JSON preview, and restore button.

## 6. Tag System Architecture
- Tags are `string[]` on each Card.
- **Cross-Board Linking**: `findRelatedCards()` queries ALL cards across ALL boards returning those sharing at least one tag.
- **Auto-Add Tags**: `TagRule` entities link a tag to a boardId. On card creation, `getAutoTags()` is called and tags pre-populated.
- **UI Locations**:
  - `CardSidebar.tsx` — Add/remove tags, see suggestions, view related cards with navigation.
  - `BoardControls.tsx` — Configure auto-add tags via ⚡ Zap popover.
  - `VisualCard.tsx` — Display up to 3 tag pills on canvas cards.

## 7. UI & Aesthetic Requirements
- **Theme**: Dark, premium glassmorphism (`.glass-panel`, `.glass-card`), deep slate backgrounds.
- **Accent Colours**: `text-accent-1` (Orange), `text-accent-2` (Bright Violet), `text-accent-3` (Blue).
- **Animations**: Framer Motion. Core effect: `cinematicZoom` (scale 1.25→1, blur 12px→0, duration 1.8s).
- **Icons**: Lucide React exclusively.
- **Language**: UK British English throughout (e.g. "colour", "optimisation").

## 8. Canvas Mechanics (@xyflow/react)
- Cards are custom nodes (`VisualCard`) with connection handles on all 4 sides.
- Edges map to `Connection` entities with configurable types, styles, and markers.
- Tool modes: Pointer (drag nodes) and Lasso (multi-select).
- Node position changes are persisted to Dexie on each `onNodesChange` event.
- Event propagation managed (`.stopPropagation()`) for embedded inputs.

## 9. Component Responsibilities

| Component | Role |
|---|---|
| `page.tsx` (root) | Dashboard: Tab switcher, workspace sidebar, board grid, sync indicator, history access |
| `board/[id]/page.tsx` | Board canvas with React Flow, tool modes, header, sync indicator |
| `CardSidebar.tsx` | Card detail: fields, tags, related cards, rich text, drawing |
| `BoardControls.tsx` | Board actions: lock, export PNG, CSV import, auto-tag config |
| `VisualCard.tsx` | Canvas node: title, status, priority, ref, tag pills |
| `EdgeSidebar.tsx` | Connection editor: type, style, colour, markers |
| `AlignmentToolbar.tsx` | Multi-select alignment/distribution tools |
| `BoardListView.tsx` | Table view alternative to canvas |
| `GlobalStats.tsx` | Dashboard statistics modal |
| `HistoryPanel.tsx` | 7-day change history with search, filter, and point-in-time restore |
| `SyncIndicator.tsx` | Compact push/pull status widget with manual trigger buttons |
| `SyncProvider.tsx` | React context managing sync lifecycle and state |

## 10. PostgreSQL Schema
Run `node init_pg_schema.js` to create/upgrade:
- `tabs`, `workspaces`, `boards`, `cards`, `connections`, `tag_rules`, `sync_metadata` (7 tables)
- All FKs use `ON DELETE CASCADE`
- Safe upgrade logic with `DO $$ ... IF NOT EXISTS` blocks

## 11. Development Workflow
```bash
pnpm install              # Install all dependencies
npm run dev               # Start Next.js dev server on port 3000
npx tsc --noEmit          # Type-check without building
node init_pg_schema.js    # Create/upgrade PostgreSQL tables
```

## 12. Documentation Protocol
- `MASTER_DOCS.md` — Comprehensive technical documentation, features, schemas, file structure.
- `skills.md` — This file. AI skill reference for architecture patterns and protocols.
- Both files MUST be refreshed every 5 iterations.
