import { Node } from '@xyflow/react';
import { db } from './db';

type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export async function alignNodes(nodes: Node[], type: AlignmentType) {
    if (nodes.length < 2) return;

    const positions = nodes.map(n => n.position);
    let targetValue: number;

    switch (type) {
        case 'left':
            targetValue = Math.min(...positions.map(p => p.x));
            break;
        case 'right':
            // Assuming average width of 250 if not specified
            targetValue = Math.max(...nodes.map(n => n.position.x + (n.measured?.width || 250)));
            break;
        case 'center':
            const minX = Math.min(...positions.map(p => p.x));
            const maxX = Math.max(...nodes.map(n => n.position.x + (n.measured?.width || 250)));
            targetValue = minX + (maxX - minX) / 2;
            break;
        case 'top':
            targetValue = Math.min(...positions.map(p => p.y));
            break;
        case 'bottom':
            targetValue = Math.max(...nodes.map(n => n.position.y + (n.measured?.height || 150)));
            break;
        case 'middle':
            const minY = Math.min(...positions.map(p => p.y));
            const maxY = Math.max(...nodes.map(n => n.position.y + (n.measured?.height || 150)));
            targetValue = minY + (maxY - minY) / 2;
            break;
    }

    const updates = nodes.map(node => {
        let newX = node.position.x;
        let newY = node.position.y;

        if (type === 'left') newX = targetValue;
        if (type === 'right') newX = targetValue - (node.measured?.width || 250);
        if (type === 'center') newX = targetValue - (node.measured?.width || 250) / 2;
        if (type === 'top') newY = targetValue;
        if (type === 'bottom') newY = targetValue - (node.measured?.height || 150);
        if (type === 'middle') newY = targetValue - (node.measured?.height || 150) / 2;

        return {
            id: node.id,
            position: { x: newX, y: newY }
        };
    });

    // Batch update Dexie and Sync Queue
    for (const update of updates) {
        await db.cards.update(update.id, { position: update.position });
        await db.addToSyncQueue('cards', update.id, 'update');
    }
}

export async function distributeNodes(nodes: Node[], direction: 'horizontal' | 'vertical') {
    if (nodes.length < 3) return;

    const sorted = [...nodes].sort((a, b) =>
        direction === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const range = direction === 'horizontal'
        ? (last.position.x - first.position.x)
        : (last.position.y - first.position.y);

    const step = range / (sorted.length - 1);

    for (let i = 1; i < sorted.length - 1; i++) {
        const node = sorted[i];
        const newPos = direction === 'horizontal'
            ? { x: first.position.x + (step * i), y: node.position.y }
            : { x: node.position.x, y: first.position.y + (step * i) };

        await db.cards.update(node.id, { position: newPos });
        await db.addToSyncQueue('cards', node.id, 'update');
    }
}
