'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, RotateCcw, Clock, Tag, Briefcase, LayoutDashboard, CreditCard, Link2, Zap, Trash2, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { db, ChangeHistory } from '@/lib/db';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ENTITY_ICONS: Record<string, any> = {
    tabs: { icon: Tag, colour: 'text-accent-1' },
    workspaces: { icon: Briefcase, colour: 'text-accent-3' },
    boards: { icon: LayoutDashboard, colour: 'text-accent-2' },
    cards: { icon: CreditCard, colour: 'text-emerald-400' },
    connections: { icon: Link2, colour: 'text-sky-400' },
    tagRules: { icon: Zap, colour: 'text-yellow-400' },
};

const ACTION_STYLES: Record<string, { label: string; colour: string }> = {
    create: { label: 'Created', colour: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    update: { label: 'Updated', colour: 'text-accent-3 bg-accent-3/10 border-accent-3/20' },
    delete: { label: 'Deleted', colour: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
    const [history, setHistory] = useState<ChangeHistory[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const loadHistory = useCallback(async () => {
        const entries = await db.getRecentHistory(200);
        setHistory(entries);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
            // Prune old entries when panel opens
            db.pruneOldHistory();
        }
    }, [isOpen, loadHistory]);

    const handleRestore = async (entry: ChangeHistory) => {
        if (!entry.snapshot) {
            alert('No snapshot data available for this entry.');
            return;
        }

        if (!confirm(`Restore this ${entry.entityType.slice(0, -1)} to its state from ${new Date(entry.timestamp).toLocaleString()}?`)) return;

        setIsRestoring(true);
        try {
            const data = entry.snapshot;
            switch (entry.entityType) {
                case 'tabs':
                    await db.tabs.put(data);
                    break;
                case 'workspaces':
                    await db.workspaces.put(data);
                    break;
                case 'boards':
                    await db.boards.put(data);
                    break;
                case 'cards':
                    await db.cards.put(data);
                    break;
                case 'connections':
                    await db.connections.put(data);
                    break;
                case 'tagRules':
                    await db.tagRules.put(data);
                    break;
            }
            await db.addToSyncQueue(entry.entityType, entry.entityId, 'update');
            alert('✅ Restored successfully!');
            loadHistory();
        } catch (err: any) {
            console.error('Restore failed:', err);
            alert('Failed to restore: ' + err.message);
        }
        setIsRestoring(false);
    };

    const filteredHistory = history.filter(entry => {
        if (filter !== 'all' && entry.entityType !== filter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const snap = entry.snapshot;
            const title = snap?.title || snap?.name || snap?.tag || '';
            return title.toLowerCase().includes(q) || entry.entityId.toLowerCase().includes(q);
        }
        return true;
    });

    // Group by day
    const groupedByDay = filteredHistory.reduce<Record<string, ChangeHistory[]>>((acc, entry) => {
        const day = new Date(entry.timestamp).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[day]) acc[day] = [];
        acc[day].push(entry);
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-stretch justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.aside
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full lg:w-[550px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <header className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="icon-box bg-accent-2/10 border-accent-2/20 text-accent-2">
                                <History size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Change History</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Last 7 days • {history.length} entries</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="icon-box hover:bg-white/10">
                            <X size={20} />
                        </button>
                    </header>

                    {/* Filters */}
                    <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
                        {/* Search */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or ID..."
                                className="w-full bg-slate-900 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-accent-2/50 transition-all"
                            />
                        </div>
                        {/* Entity Type Filter */}
                        <div className="flex flex-wrap gap-1.5">
                            {['all', 'cards', 'boards', 'workspaces', 'tabs', 'connections', 'tagRules'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                                        filter === type
                                            ? "bg-accent-2/20 border-accent-2/30 text-accent-2"
                                            : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"
                                    )}
                                >
                                    {type === 'tagRules' ? 'Tags' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {Object.keys(groupedByDay).length === 0 && (
                            <div className="text-center py-20 text-slate-600">
                                <History size={32} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm font-medium">No history entries found.</p>
                                <p className="text-xs mt-1">Changes will appear here as you work.</p>
                            </div>
                        )}

                        {Object.entries(groupedByDay).map(([day, entries]) => (
                            <div key={day}>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 sticky top-0 bg-slate-950/95 py-1 z-10">{day}</h3>
                                <div className="space-y-1.5">
                                    {entries.map((entry) => {
                                        const entityMeta = ENTITY_ICONS[entry.entityType] || ENTITY_ICONS.cards;
                                        const actionMeta = ACTION_STYLES[entry.action] || ACTION_STYLES.update;
                                        const IconComponent = entityMeta.icon;
                                        const displayName = entry.snapshot?.title || entry.snapshot?.name || entry.snapshot?.tag || entry.entityId;
                                        const isExpanded = expandedId === entry.id;

                                        return (
                                            <div key={entry.id} className="glass-panel overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : (entry.id ?? null))}
                                                    className="w-full text-left p-3 flex items-center gap-3 hover:bg-white/5 transition-all"
                                                >
                                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-slate-900 border border-white/5 shrink-0", entityMeta.colour)}>
                                                        <IconComponent size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", actionMeta.colour)}>
                                                                {actionMeta.label}
                                                            </span>
                                                            <span className="text-[9px] text-slate-600">{entry.entityType}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
                                                    </div>
                                                </button>

                                                {/* Expanded Detail */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-white/5"
                                                        >
                                                            <div className="p-3 space-y-3">
                                                                {/* Snapshot Preview */}
                                                                {entry.snapshot && (
                                                                    <pre className="text-[10px] text-slate-400 bg-slate-900/50 p-3 rounded-lg overflow-x-auto max-h-[200px] overflow-y-auto border border-white/5 font-mono leading-relaxed">
                                                                        {JSON.stringify(entry.snapshot, null, 2)}
                                                                    </pre>
                                                                )}

                                                                {/* Restore Button */}
                                                                {entry.action !== 'delete' && entry.snapshot && (
                                                                    <button
                                                                        onClick={() => handleRestore(entry)}
                                                                        disabled={isRestoring}
                                                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-2/10 border border-accent-2/20 text-accent-2 text-xs font-bold uppercase tracking-widest hover:bg-accent-2 hover:text-white transition-all disabled:opacity-30"
                                                                    >
                                                                        <RotateCcw size={14} />
                                                                        Restore to This Point
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.aside>
            </div>
        </AnimatePresence>
    );
}
