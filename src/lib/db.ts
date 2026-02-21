import Dexie, { type Table } from 'dexie';

export interface Tab {
    id: string;
    userId: string;
    name: string;
    sortOrder: number;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface Workspace {
    id: string;
    tabId?: string;
    userId: string;
    name: string;
    description?: string;
    colour: string;
    icon: string;
    sortOrder: number;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface Board {
    id: string;
    workspaceId?: string;
    userId: string;
    name: string;
    description?: string;
    settings: any;
    isLocked?: boolean;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface Card {
    id: string;
    boardId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    colour: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    content: string;
    zIndex: number;
    locked: boolean;
    tags: string[];
    projectRef?: string;
    category?: string;
    isImported?: boolean;
    updatedAt: Date;
    deletedAt?: Date;
}

export const IMPORT_STAGING_BOARD_ID = 'board-import-staging';

export interface Connection {
    id: string;
    boardId: string;
    fromCardId: string;
    toCardId: string;
    type: string; // 'default', 'straight', 'step', 'smoothstep'
    style: 'solid' | 'dashed' | 'dotted';
    colour: string;
    label?: string;
    animated?: boolean;
    strokeWidth?: number;
    markerStart?: string; // 'arrow' | 'circle' | 'none'
    markerEnd?: string;   // 'arrow' | 'circle' | 'none'
    updatedAt: Date;
    deletedAt?: Date;
}

export interface TagRule {
    id: string;
    boardId: string;
    tag: string;
    updatedAt: Date;
}

export interface ChangeHistory {
    id?: number; // auto-increment
    entityType: string; // 'tabs' | 'workspaces' | 'boards' | 'cards' | 'connections' | 'tagRules'
    entityId: string;
    action: 'create' | 'update' | 'delete';
    snapshot: any; // full JSON snapshot of the entity at that moment
    timestamp: Date;
}

export class ProjectCanvasDB extends Dexie {
    tabs!: Table<Tab>;
    workspaces!: Table<Workspace>;
    boards!: Table<Board>;
    cards!: Table<Card>;
    connections!: Table<Connection>;
    tagRules!: Table<TagRule>;
    changeHistory!: Table<ChangeHistory>;
    syncQueue!: Table<any>;

    constructor() {
        super('ProjectCanvasDB');
        this.version(1).stores({
            workspaces: 'id, userId, name, sortOrder, updatedAt, deletedAt',
            boards: 'id, workspaceId, userId, name, updatedAt, deletedAt',
            cards: 'id, boardId, title, status, updatedAt, deletedAt, *tags',
            connections: 'id, boardId, fromCardId, toCardId, updatedAt, deletedAt',
            syncQueue: '++id, entityType, entityId, action, timestamp, synced'
        });

        this.version(2).stores({
            tabs: 'id, userId, name, sortOrder, updatedAt, deletedAt',
            workspaces: 'id, tabId, userId, name, sortOrder, updatedAt, deletedAt',
        }).upgrade(tx => {
            // Provide a default tab to existing workspaces
            return tx.table('workspaces').toCollection().modify(workspace => {
                workspace.tabId = 'tab-master';
            });
        });

        this.version(3).stores({
            tagRules: 'id, boardId, tag, updatedAt',
        });

        this.version(4).stores({
            changeHistory: '++id, entityType, entityId, action, timestamp, [entityType+entityId]',
        });

        this.version(5).stores({
            cards: 'id, boardId, title, status, updatedAt, deletedAt, *tags, category, isImported',
        });
    }

    /** Find all cards across all boards that share at least one tag with the given card */
    async findRelatedCards(cardId: string): Promise<Card[]> {
        const card = await this.cards.get(cardId);
        if (!card || !card.tags || card.tags.length === 0) return [];

        const allCards = await this.cards.toArray();
        return allCards.filter(c =>
            c.id !== cardId &&
            c.tags &&
            c.tags.some(t => card.tags.includes(t))
        );
    }

    /** Get all unique tags used across every card in the database */
    async getAllTags(): Promise<string[]> {
        const allCards = await this.cards.toArray();
        const tagSet = new Set<string>();
        for (const card of allCards) {
            if (card.tags) card.tags.forEach(t => tagSet.add(t));
        }
        return Array.from(tagSet).sort();
    }

    /** Get auto-add tag rules for a specific board */
    async getAutoTags(boardId: string): Promise<string[]> {
        const rules = await this.tagRules.where('boardId').equals(boardId).toArray();
        return rules.map(r => r.tag);
    }

    /** Log a change to the local history buffer (snapshot at point-in-time) */
    async logChange(entityType: string, entityId: string, action: 'create' | 'update' | 'delete', snapshot: any) {
        await this.changeHistory.add({
            entityType,
            entityId,
            action,
            snapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : null,
            timestamp: new Date()
        });
    }

    /** Purge history entries older than 7 days */
    async pruneOldHistory() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const oldEntries = await this.changeHistory
            .where('timestamp')
            .below(cutoff)
            .toArray();
        if (oldEntries.length > 0) {
            await this.changeHistory.bulkDelete(oldEntries.map(e => e.id!));
            console.log(`🗑️ Pruned ${oldEntries.length} history entries older than 7 days.`);
        }
    }

    /** Get change history for a specific entity, most recent first */
    async getEntityHistory(entityType: string, entityId: string): Promise<ChangeHistory[]> {
        return this.changeHistory
            .where('[entityType+entityId]')
            .equals([entityType, entityId])
            .reverse()
            .sortBy('timestamp');
    }

    /** Get all change history within the last 7 days, most recent first */
    async getRecentHistory(limit: number = 100): Promise<ChangeHistory[]> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return this.changeHistory
            .where('timestamp')
            .above(cutoff)
            .reverse()
            .sortBy('timestamp');
    }

    /** Get all unique category values used across every card in the database */
    async getAllCategories(): Promise<string[]> {
        const allCards = await this.cards.toArray();
        const categorySet = new Set<string>();
        for (const card of allCards) {
            if (card.category) categorySet.add(card.category);
        }
        return Array.from(categorySet).sort();
    }

    async addToSyncQueue(entityType: string, entityId: string, action: 'create' | 'update' | 'delete') {
        // Capture snapshot for the history buffer
        let snapshot: any = null;
        if (action !== 'delete') {
            switch (entityType) {
                case 'tabs': snapshot = await this.tabs.get(entityId); break;
                case 'workspaces': snapshot = await this.workspaces.get(entityId); break;
                case 'boards': snapshot = await this.boards.get(entityId); break;
                case 'cards': snapshot = await this.cards.get(entityId); break;
                case 'connections': snapshot = await this.connections.get(entityId); break;
                case 'tagRules': snapshot = await this.tagRules.get(entityId); break;
            }
        }

        // Log to history buffer
        await this.logChange(entityType, entityId, action, snapshot);

        // Queue for cloud sync
        await this.syncQueue.add({
            entityType,
            entityId,
            action,
            timestamp: new Date(),
            synced: 0
        });
    }
}

export const db = new ProjectCanvasDB();
