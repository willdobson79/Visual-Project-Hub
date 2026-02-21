import { db } from './db';

export let isSyncing = false;

// ═══════════ PUSH: Local → Cloud ═══════════
export async function processSyncQueue() {
    if (isSyncing) return;

    const pendingItems = await db.syncQueue
        .where('synced')
        .equals(0)
        .sortBy('id');

    if (pendingItems.length === 0) return;

    isSyncing = true;
    console.log(`🔄 Pushing ${pendingItems.length} items to cloud...`);

    for (const item of pendingItems) {
        try {
            // Fetch the actual data for the entity
            let data: any = null;
            if (item.action !== 'delete') {
                switch (item.entityType) {
                    case 'tabs':
                        data = await db.tabs.get(item.entityId);
                        break;
                    case 'workspaces':
                        data = await db.workspaces.get(item.entityId);
                        break;
                    case 'boards':
                        data = await db.boards.get(item.entityId);
                        break;
                    case 'cards':
                        data = await db.cards.get(item.entityId);
                        break;
                    case 'connections':
                        data = await db.connections.get(item.entityId);
                        break;
                    case 'tagRules':
                        data = await db.tagRules.get(item.entityId);
                        break;
                }
            } else {
                // For delete, we just need the ID
                data = { id: item.entityId };
            }

            if (!data && item.action !== 'delete') {
                console.warn(`⚠️ Entity ${item.entityId} not found for sync, skipping.`);
                await db.syncQueue.update(item.id, { synced: 1 });
                continue;
            }

            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: item.action,
                    entityType: item.entityType,
                    data: data
                })
            });

            if (response.ok) {
                await db.syncQueue.update(item.id, { synced: 1 });
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to sync');
            }
        } catch (err: any) {
            console.error(`❌ Push failed for ${item.entityType}:${item.entityId} - ${err.message}`);
            // Stop processing the queue on error to maintain order
            break;
        }
    }

    isSyncing = false;
}

// ═══════════ PULL: Cloud → Local ═══════════
let lastPulledAt: string | null = null;

export async function pullFromCloud() {
    if (isSyncing) return;

    isSyncing = true;
    const since = lastPulledAt || localStorage.getItem('pkm_last_pulled') || '1970-01-01T00:00:00Z';
    const deviceId = getDeviceId();

    console.log(`📥 Pulling changes from cloud since ${since}...`);

    try {
        const response = await fetch(`/api/sync/pull?since=${encodeURIComponent(since)}&deviceId=${encodeURIComponent(deviceId)}`);

        if (!response.ok) {
            throw new Error('Pull request failed');
        }

        const result = await response.json();
        const { data, pulledAt } = result;

        // Merge cloud data into local Dexie (upsert — cloud wins on conflict)
        if (data.tabs?.length) {
            await db.tabs.bulkPut(data.tabs);
            console.log(`  ↳ Merged ${data.tabs.length} tabs`);
        }
        if (data.workspaces?.length) {
            await db.workspaces.bulkPut(data.workspaces);
            console.log(`  ↳ Merged ${data.workspaces.length} workspaces`);
        }
        if (data.boards?.length) {
            await db.boards.bulkPut(data.boards);
            console.log(`  ↳ Merged ${data.boards.length} boards`);
        }
        if (data.cards?.length) {
            await db.cards.bulkPut(data.cards);
            console.log(`  ↳ Merged ${data.cards.length} cards`);
        }
        if (data.connections?.length) {
            await db.connections.bulkPut(data.connections);
            console.log(`  ↳ Merged ${data.connections.length} connections`);
        }
        if (data.tagRules?.length) {
            await db.tagRules.bulkPut(data.tagRules);
            console.log(`  ↳ Merged ${data.tagRules.length} tag rules`);
        }

        // Store the timestamp for incremental pulls
        lastPulledAt = pulledAt;
        localStorage.setItem('pkm_last_pulled', pulledAt);
        console.log(`✅ Pull complete at ${pulledAt}`);

    } catch (err: any) {
        console.error(`❌ Pull failed: ${err.message}`);
    }

    isSyncing = false;
}

/** Generate or retrieve a persistent device ID for sync tracking */
function getDeviceId(): string {
    let id = localStorage.getItem('pkm_device_id');
    if (!id) {
        id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('pkm_device_id', id);
    }
    return id;
}

// ═══════════ LIFECYCLE ═══════════

/** Global pulse for the sync service — both push and pull */
export function startSyncService(pushIntervalMs: number = 5000, pullIntervalMs: number = 30000) {
    console.log('📡 PKM Sync Service Started (Push + Pull)');

    // Push cycle
    setInterval(() => {
        processSyncQueue();
    }, pushIntervalMs);

    // Pull cycle (less frequent to reduce server load)
    setInterval(() => {
        pullFromCloud();
    }, pullIntervalMs);

    // Initial pull on startup
    setTimeout(() => {
        pullFromCloud();
    }, 3000);
}
