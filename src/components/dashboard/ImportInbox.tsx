'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Trash2, Send, CheckSquare, Square } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';
import HierarchySelector from './HierarchySelector';

const PRIORITY_COLOURS: Record<string, string> = {
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export default function ImportInbox() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [hierarchyCardIds, setHierarchyCardIds] = useState<string[]>([]);
    const [isHierarchyOpen, setIsHierarchyOpen] = useState(false);

    // isImported is stored as boolean but Dexie indexes it as 1/0 for comparison
    const inboxCards = useLiveQuery(
        () => db.cards.filter(c => c.isImported === true && !c.deletedAt).toArray(),
        []
    );

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        }
    };

    const handleSendSingle = (cardId: string) => {
        setHierarchyCardIds([cardId]);
        setIsHierarchyOpen(true);
    };

    const handleSendSelected = () => {
        if (selectedIds.size === 0) return;
        setHierarchyCardIds(Array.from(selectedIds));
        setIsHierarchyOpen(true);
    };

    const handleDelete = async (cardId: string) => {
        await db.cards.delete(cardId);
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(cardId);
            return next;
        });
    };

    const handleDispatched = (cardIds: string[]) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            cardIds.forEach(id => next.delete(id));
            return next;
        });
    };

    const cards = inboxCards || [];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Inbox className="text-accent-1" size={24} />
                        Import Inbox
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {cards.length} card{cards.length !== 1 ? 's' : ''} awaiting dispatch to a board.
                    </p>
                </div>

                {selectedIds.size > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleSendSelected}
                        className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <Send size={16} />
                        Send {selectedIds.size} Selected
                    </motion.button>
                )}
            </div>

            {cards.length === 0 ? (
                <div className="glass-panel flex flex-col items-center justify-center p-16 text-center">
                    <Inbox size={48} className="text-slate-700 mb-4" />
                    <p className="text-slate-400 font-medium">Your inbox is empty.</p>
                    <p className="text-slate-600 text-sm mt-1">Use the Import button to parse notes into cards.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {cards.map(card => (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                onClick={(e) => toggleSelect(card.id, e)}
                                className={cn(
                                    'glass-card p-5 cursor-pointer transition-all relative',
                                    selectedIds.has(card.id) && 'border-accent-2/60 bg-accent-2/5 shadow-lg shadow-accent-2/10'
                                )}
                            >
                                {/* Selection indicator */}
                                <div className="absolute top-3 right-3">
                                    {selectedIds.has(card.id)
                                        ? <CheckSquare size={16} className="text-accent-2" />
                                        : <Square size={16} className="text-slate-600 opacity-0 group-hover:opacity-100" />
                                    }
                                </div>

                                {/* Emoji + Title */}
                                <div className="flex items-start gap-3 mb-3 pr-6">
                                    {card.content && card.content.length <= 4 && (
                                        <span className="text-2xl leading-none mt-0.5">{card.content}</span>
                                    )}
                                    <h3 className="text-white font-semibold text-sm leading-snug">{card.title}</h3>
                                </div>

                                {/* Description */}
                                {card.description && (
                                    <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">{card.description}</p>
                                )}

                                {/* Meta row */}
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    {card.category && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-accent-2/20 border border-accent-2/30 text-accent-2 rounded-full">
                                            {card.category}
                                        </span>
                                    )}
                                    {card.priority && (
                                        <span className={cn(
                                            'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border',
                                            PRIORITY_COLOURS[card.priority] ?? PRIORITY_COLOURS.low
                                        )}>
                                            {card.priority}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSendSingle(card.id); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-2/20 border border-accent-2/30 text-accent-2 text-xs font-semibold hover:bg-accent-2/30 transition-all"
                                    >
                                        <Send size={12} />
                                        Send to Board
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <HierarchySelector
                isOpen={isHierarchyOpen}
                onClose={() => setIsHierarchyOpen(false)}
                cardIds={hierarchyCardIds}
                onDispatched={handleDispatched}
            />
        </div>
    );
}
