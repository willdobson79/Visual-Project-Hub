# Visual Project Dashboard — Master Documentation
**Last Updated:** 21 February 2026 — Iteration 5

> This documentation is automatically updated every 5 iterations.

---

## Project Overview
The **Visual Project Dashboard** is a local-first **Personal Knowledge Management (PKM) Super Hub** designed to serve as a single, central resource for everything in your life. It organises notes, tasks, projects, and ideas into a powerful visual hierarchy — all persisted locally for instant performance, with automatic bidirectional sync to a PostgreSQL cloud database on willpowered.design.

---

## Database Hierarchy

```
Tabs (top level — e.g. "Master", "Finance", "Travel", "DIY", "AI Projects")
  └── Workspaces (logical project groupings)
       └── Boards (individual canvases / project boards)
            └── Cards (tasks, ideas, notes — linked cross-board via tags)
                 └── Connections (visual edges between cards on the same board)
```

**Supporting entities:**
- `TagRule` — auto-add tags per board
- `ChangeHistory` — 7-day point-in-time snapshot buffer
- `SyncQueue` — push queue for cloud synchronisation
- `SyncMetadata` (PG only) — per-device pull tracking

---

## Features & Functionality

### 1. Tabs (Category System)
- Top-level organisational layer.
- Each tab contains its own filtered set of workspaces.
- Default "Master" tab auto-created on first load.
- Custom tabs created via sidebar `+` button.
- Active tab highlighted with accent indicator.

### 2. Workspaces
- Logical groupings of boards within a tab.
- Custom accent colours and icons.
- Created via modal with colour picker.
- Deletable with cascade (removes all boards & cards within).

### 3. Boards
- Each board is a full interactive canvas.
- Supports **Canvas View** (node-based React Flow) and **List View** (table format).
- Lockable to prevent accidental edits.
- Exportable as PNG.
- CSV import support via modal.
- Auto-tag rules configurable per board (⚡ Zap button).

### 4. Cards (Nodes)
- Draggable nodes on the React Flow canvas.
- Each card supports:
  - **Title** (editable inline on canvas and sidebar)
  - **Description**
  - **Status** (To Do, In Progress, Complete, Blocked)
  - **Priority** (Low, Medium, High, Urgent)
  - **Custom Colour** (via colour picker)
  - **Project Ref** (editable inline, auto-generated timestamp format)
  - **Tags** (cross-board linking system)
  - **Rich Text Content** (Tiptap editor with formatting, links, images)
  - **Drawing Canvas** (freehand sketching)
  - **File Attachments** (upload zone)
- Tags displayed as pills directly on canvas cards (max 3 visible, overflow indicator).

### 5. Tag System (Cross-Board Linking)
- Tags are `string[]` on each card.
- Any card sharing a tag with another card (on ANY board) is automatically linked.
- **CardSidebar** shows:
  - All current tags with remove buttons.
  - Tag input with autocomplete suggestions from existing global tags.
  - **Related Cards** panel showing all cross-board matches with card title, board name, shared tags, and click-to-navigate.
- **Auto-Add Tags** (TagRule system):
  - Configured per board via the ⚡ Zap button in board controls.
  - New cards on that board automatically receive all configured auto-tags.
  - Rules managed with add/remove UI in a popover.

### 6. Connections (Edges)
- Visual connections between cards on the same board.
- Configurable: type (smoothstep, straight, step), style (solid, dashed, dotted), colour, stroke width, markers (arrow/circle/none on each end).
- Animated edges supported.
- Dedicated EdgeSidebar for editing.

### 7. Alignment Toolbar
- Multi-select cards via lasso tool.
- Align horizontally/vertically, distribute evenly.

### 8. Global Stats
- Dashboard-level statistics: total cards, completion percentage, cloud sync status.
- Dedicated modal view.

### 9. Bidirectional Cloud Sync (PostgreSQL)
- **Local-First**: All data persists in IndexedDB (Dexie.js) for instant, offline-capable performance.
- **Push Sync (Local → Cloud)**: Every CRUD operation is queued in `syncQueue`. A background service processes the queue every 5 seconds, pushing changes to PostgreSQL via `/api/sync`.
- **Pull Sync (Cloud → Local)**: A pull cycle runs every 30 seconds (and once on startup), fetching all records updated since the last pull via `/api/sync/pull`. Cloud data is merged into local Dexie using `bulkPut` (cloud wins on conflict).
- **SyncIndicator**: Compact widget showing live sync status (syncing spinner, pending count badge, push/pull buttons). Visible on both the Dashboard sidebar and Board headers.
- **Device Tracking**: Each device gets a persistent unique ID stored in localStorage. The cloud database tracks the last pull timestamp per device via `sync_metadata`.
- **Entity Coverage**: All 6 entity types are fully synced — tabs, workspaces, boards, cards, connections, and tagRules.

### 10. History Buffer (7-Day Point-in-Time Restore)
- **Automatic Buffering**: Every create, update, or delete operation across the entire application automatically captures a full JSON snapshot of the entity at that exact moment into the `changeHistory` table.
- **7-Day Retention**: History entries older than 7 days are automatically pruned when the History panel is opened.
- **History Panel** (`HistoryPanel.tsx`):
  - Accessed via "Change History" button in the Dashboard sidebar.
  - Timeline view grouped by day, most recent first.
  - Filter by entity type (cards, boards, workspaces, tabs, connections, tags).
  - Search by name or entity ID.
  - Expand any entry to see the full JSON snapshot.
  - **"Restore to This Point"** button — instantly reverts any entity to its exact state at that moment and queues the restore for cloud sync.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Languages | TypeScript |
| Styling | Tailwind CSS v4, PostCSS |
| Local Database | Dexie.js v4 (IndexedDB wrapper) |
| Cloud Database | PostgreSQL (bidirectional sync) |
| Canvas Engine | @xyflow/react (React Flow) |
| Rich Text Editor | Tiptap (@tiptap/react, starter-kit) |
| Animations | Framer Motion |
| Icons | Lucide React |
| CSV Parsing | PapaParse |
| Image Export | html-to-image |
| Package Manager | pnpm |

---

## Database Schemas

### Local (Dexie.js v4)

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

### Cloud (PostgreSQL)

| Table | Key Columns |
|---|---|
| `tabs` | `id, user_id, name, sort_order, updated_at, deleted_at` |
| `workspaces` | `id, tab_id (FK→tabs), user_id, name, description, colour, icon, sort_order` |
| `boards` | `id, workspace_id (FK→workspaces), user_id, name, description, settings (JSONB), is_locked` |
| `cards` | `id, board_id (FK→boards), position_x/y, width/height, colour, title, description, status, priority, content, z_index, locked, tags (TEXT[]), project_ref` |
| `connections` | `id, board_id (FK→boards), from_card_id/to_card_id (FK→cards), type, style, colour, label, animated, stroke_width, marker_start, marker_end` |
| `tag_rules` | `id, board_id (FK→boards), tag, updated_at` |
| `sync_metadata` | `device_id, last_pulled_at` |

All foreign keys use `ON DELETE CASCADE` for referential integrity.

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── sync/
│   │       ├── route.ts           # Push API (POST — all 6 entity types)
│   │       └── pull/
│   │           └── route.ts       # Pull API (GET — cloud → local)
│   ├── board/[id]/page.tsx        # Board canvas page
│   ├── privacy-policy/            # Privacy policy page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Dashboard (home — tabs, workspaces, boards)
│   └── globals.css                # Global styles
├── components/
│   ├── board/
│   │   ├── AlignmentToolbar.tsx   # Multi-select alignment tools
│   │   ├── BoardControls.tsx      # Board actions (lock, export, CSV, auto-tags)
│   │   ├── BoardListView.tsx      # Table/list view of cards
│   │   ├── CardSidebar.tsx        # Card detail panel with tags & related cards
│   │   ├── CSVImportModal.tsx     # CSV import configuration
│   │   ├── DrawingCanvas.tsx      # Freehand drawing tool
│   │   ├── EdgeSidebar.tsx        # Connection/edge editing panel
│   │   └── RichTextEditor.tsx     # Tiptap rich text editor
│   ├── canvas/
│   │   ├── GridBackground.tsx     # Canvas background grid
│   │   └── VisualCard.tsx         # Card node component (with tag pills)
│   ├── dashboard/
│   │   ├── GlobalStats.tsx        # Global statistics modal
│   │   ├── HistoryPanel.tsx       # 7-day change history with restore
│   │   ├── NewBoardModal.tsx      # Board creation modal
│   │   └── NewWorkspaceModal.tsx  # Workspace creation modal
│   ├── global/
│   │   └── SyncIndicator.tsx      # Cloud sync status (push + pull buttons)
│   ├── layout/                    # Layout components
│   ├── providers/
│   │   └── SyncProvider.tsx       # Sync context (push + pull lifecycle)
│   └── ui/                        # Reusable UI primitives (Tabs, etc.)
├── lib/
│   ├── assets.ts                  # Asset registry
│   ├── canvas_utils.ts            # Canvas utility functions
│   ├── db.ts                      # Dexie database schema v4 & helpers
│   ├── pg_db.ts                   # PostgreSQL connection pool
│   ├── sync_service.ts            # Bidirectional sync engine (push + pull)
│   ├── test_db.ts                 # Database testing utilities
│   └── utils.ts                   # General utilities (cn helper)
```

**Root Scripts:**
- `init_pg_schema.js` — Creates/upgrades all 7 PostgreSQL tables
- `download_assets.js` — Placeholder image generator

---

## Instructions

### Development
```bash
pnpm install          # Install dependencies
npm run dev           # Start dev server at http://localhost:3000
npx tsc --noEmit      # Type-check without building
```

### Database Setup
```bash
node init_pg_schema.js   # Create/upgrade PostgreSQL tables
```

### First-Time Setup
On the first load, the application auto-creates:
1. A **"Master"** tab.
2. A **"My Workspace"** within that tab.
3. A **"Main Board"** within that workspace.

### Creating Content
1. **New Tab**: Click `+` next to "Categories / Tabs" in the sidebar.
2. **New Workspace**: Click "New Workspace" button below workspace list.
3. **New Board**: Click "Create New Board" card on the dashboard.
4. **New Card**: Click "+ New Card" button in the board header.
5. **Auto-Tag**: Click the ⚡ icon in board controls to configure auto-add tags.
6. **Add Tags**: Open a card's sidebar and use the Tags section.

### Sync Operations
- **Automatic**: Push every 5s, pull every 30s (configurable in SyncProvider).
- **Manual Push**: Click the refresh icon in the SyncIndicator.
- **Manual Pull**: Click the download icon in the SyncIndicator.

### Restoring Data
1. Open "Change History" from the Dashboard sidebar.
2. Filter or search for the entity you need regarding.
3. Expand the entry and click "Restore to This Point".

---
*Documentation auto-managed per 5-iteration protocol.*
