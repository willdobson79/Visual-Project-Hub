import { NextResponse } from 'next/server';
import { pgQuery } from '@/lib/pg_db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, entityType, data } = body;

        if (!entityType || !data) {
            return NextResponse.json({ error: 'Missing sync data' }, { status: 400 });
        }

        // ═══════════ TABS ═══════════
        if (entityType === 'tabs') {
            if (action === 'create' || action === 'update') {
                await pgQuery(`
                    INSERT INTO tabs (id, user_id, name, sort_order, updated_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                      user_id = EXCLUDED.user_id,
                      name = EXCLUDED.name,
                      sort_order = EXCLUDED.sort_order,
                      updated_at = EXCLUDED.updated_at
                `, [data.id, data.userId, data.name, data.sortOrder, new Date()]);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM tabs WHERE id = $1', [data.id]);
            }
        }

        // ═══════════ WORKSPACES ═══════════
        if (entityType === 'workspaces') {
            if (action === 'create' || action === 'update') {
                await pgQuery(`
                    INSERT INTO workspaces (id, tab_id, user_id, name, description, colour, icon, sort_order, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (id) DO UPDATE SET
                      tab_id = EXCLUDED.tab_id,
                      user_id = EXCLUDED.user_id,
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      colour = EXCLUDED.colour,
                      icon = EXCLUDED.icon,
                      sort_order = EXCLUDED.sort_order,
                      updated_at = EXCLUDED.updated_at
                `, [data.id, data.tabId, data.userId, data.name, data.description, data.colour, data.icon, data.sortOrder, new Date()]);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM workspaces WHERE id = $1', [data.id]);
            }
        }

        // ═══════════ BOARDS ═══════════
        if (entityType === 'boards') {
            if (action === 'create' || action === 'update') {
                await pgQuery(`
                    INSERT INTO boards (id, workspace_id, user_id, name, description, settings, is_locked, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO UPDATE SET
                      workspace_id = EXCLUDED.workspace_id,
                      user_id = EXCLUDED.user_id,
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      settings = EXCLUDED.settings,
                      is_locked = EXCLUDED.is_locked,
                      updated_at = EXCLUDED.updated_at
                `, [data.id, data.workspaceId, data.userId, data.name, data.description,
                JSON.stringify(data.settings || {}), data.isLocked, new Date()]);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM boards WHERE id = $1', [data.id]);
            }
        }

        // ═══════════ CARDS ═══════════
        if (entityType === 'cards') {
            if (action === 'create' || action === 'update') {
                const query = `
                    INSERT INTO cards (
                      id, board_id, position_x, position_y, width, height, colour,
                      title, description, status, priority, content, z_index, locked, tags, project_ref, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (id) DO UPDATE SET
                      board_id = EXCLUDED.board_id,
                      position_x = EXCLUDED.position_x,
                      position_y = EXCLUDED.position_y,
                      width = EXCLUDED.width,
                      height = EXCLUDED.height,
                      colour = EXCLUDED.colour,
                      title = EXCLUDED.title,
                      description = EXCLUDED.description,
                      status = EXCLUDED.status,
                      priority = EXCLUDED.priority,
                      content = EXCLUDED.content,
                      z_index = EXCLUDED.z_index,
                      locked = EXCLUDED.locked,
                      tags = EXCLUDED.tags,
                      project_ref = EXCLUDED.project_ref,
                      updated_at = EXCLUDED.updated_at
                `;
                const params = [
                    data.id, data.boardId, data.position?.x, data.position?.y,
                    data.size?.width, data.size?.height, data.colour,
                    data.title, data.description, data.status, data.priority, data.content,
                    data.zIndex, data.locked, data.tags, data.projectRef, new Date()
                ];
                await pgQuery(query, params);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM cards WHERE id = $1', [data.id]);
            }
        }

        // ═══════════ CONNECTIONS ═══════════
        if (entityType === 'connections') {
            if (action === 'create' || action === 'update') {
                await pgQuery(`
                    INSERT INTO connections (
                      id, board_id, from_card_id, to_card_id, type, style, colour,
                      label, animated, stroke_width, marker_start, marker_end, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO UPDATE SET
                      board_id = EXCLUDED.board_id,
                      from_card_id = EXCLUDED.from_card_id,
                      to_card_id = EXCLUDED.to_card_id,
                      type = EXCLUDED.type,
                      style = EXCLUDED.style,
                      colour = EXCLUDED.colour,
                      label = EXCLUDED.label,
                      animated = EXCLUDED.animated,
                      stroke_width = EXCLUDED.stroke_width,
                      marker_start = EXCLUDED.marker_start,
                      marker_end = EXCLUDED.marker_end,
                      updated_at = EXCLUDED.updated_at
                `, [
                    data.id, data.boardId, data.fromCardId, data.toCardId, data.type, data.style, data.colour,
                    data.label, data.animated, data.strokeWidth, data.markerStart || 'none', data.markerEnd || 'arrow', new Date()
                ]);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM connections WHERE id = $1', [data.id]);
            }
        }

        // ═══════════ TAG RULES ═══════════
        if (entityType === 'tagRules') {
            if (action === 'create' || action === 'update') {
                await pgQuery(`
                    INSERT INTO tag_rules (id, board_id, tag, updated_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id) DO UPDATE SET
                      board_id = EXCLUDED.board_id,
                      tag = EXCLUDED.tag,
                      updated_at = EXCLUDED.updated_at
                `, [data.id, data.boardId, data.tag, new Date()]);
            } else if (action === 'delete') {
                await pgQuery('DELETE FROM tag_rules WHERE id = $1', [data.id]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Sync API Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
