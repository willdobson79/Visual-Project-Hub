import { NextResponse } from 'next/server';
import { pgQuery } from '@/lib/pg_db';

/**
 * GET /api/sync/pull?since=<ISO timestamp>&deviceId=<string>
 * 
 * Returns all records updated since the given timestamp across all entity types.
 * This enables cloud → local synchronisation for the PKM Super Hub.
 * 
 * If no `since` param is provided, returns all records (full sync).
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since') || '1970-01-01T00:00:00Z';
        const deviceId = searchParams.get('deviceId') || 'default';

        const sinceDate = new Date(since);

        // Fetch all entities updated after the given timestamp
        const [tabs, workspaces, boards, cards, connections, tagRules] = await Promise.all([
            pgQuery('SELECT * FROM tabs WHERE updated_at > $1 ORDER BY sort_order', [sinceDate]),
            pgQuery('SELECT * FROM workspaces WHERE updated_at > $1 ORDER BY sort_order', [sinceDate]),
            pgQuery('SELECT * FROM boards WHERE updated_at > $1 ORDER BY name', [sinceDate]),
            pgQuery('SELECT * FROM cards WHERE updated_at > $1 ORDER BY title', [sinceDate]),
            pgQuery('SELECT * FROM connections WHERE updated_at > $1', [sinceDate]),
            pgQuery('SELECT * FROM tag_rules WHERE updated_at > $1', [sinceDate]),
        ]);

        // Update pull metadata
        await pgQuery(`
            INSERT INTO sync_metadata (device_id, last_pulled_at)
            VALUES ($1, $2)
            ON CONFLICT (device_id) DO UPDATE SET last_pulled_at = EXCLUDED.last_pulled_at
        `, [deviceId, new Date()]);

        // Map PG column names back to camelCase for the client
        const mapTab = (r: any) => ({
            id: r.id, userId: r.user_id, name: r.name,
            sortOrder: r.sort_order, updatedAt: r.updated_at, deletedAt: r.deleted_at
        });

        const mapWorkspace = (r: any) => ({
            id: r.id, tabId: r.tab_id, userId: r.user_id, name: r.name,
            description: r.description, colour: r.colour, icon: r.icon,
            sortOrder: r.sort_order, updatedAt: r.updated_at, deletedAt: r.deleted_at
        });

        const mapBoard = (r: any) => ({
            id: r.id, workspaceId: r.workspace_id, userId: r.user_id, name: r.name,
            description: r.description, settings: r.settings, isLocked: r.is_locked,
            updatedAt: r.updated_at, deletedAt: r.deleted_at
        });

        const mapCard = (r: any) => ({
            id: r.id, boardId: r.board_id,
            position: { x: r.position_x, y: r.position_y },
            size: { width: r.width, height: r.height },
            colour: r.colour, title: r.title, description: r.description,
            status: r.status, priority: r.priority, content: r.content,
            zIndex: r.z_index, locked: r.locked, tags: r.tags || [],
            projectRef: r.project_ref,
            updatedAt: r.updated_at, deletedAt: r.deleted_at
        });

        const mapConnection = (r: any) => ({
            id: r.id, boardId: r.board_id, fromCardId: r.from_card_id, toCardId: r.to_card_id,
            type: r.type, style: r.style, colour: r.colour, label: r.label,
            animated: r.animated, strokeWidth: r.stroke_width,
            markerStart: r.marker_start, markerEnd: r.marker_end,
            updatedAt: r.updated_at, deletedAt: r.deleted_at
        });

        const mapTagRule = (r: any) => ({
            id: r.id, boardId: r.board_id, tag: r.tag, updatedAt: r.updated_at
        });

        return NextResponse.json({
            success: true,
            pulledAt: new Date().toISOString(),
            data: {
                tabs: tabs.rows.map(mapTab),
                workspaces: workspaces.rows.map(mapWorkspace),
                boards: boards.rows.map(mapBoard),
                cards: cards.rows.map(mapCard),
                connections: connections.rows.map(mapConnection),
                tagRules: tagRules.rows.map(mapTagRule),
            }
        });
    } catch (err: any) {
        console.error('Pull API Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
