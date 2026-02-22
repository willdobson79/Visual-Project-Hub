'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronRight } from 'lucide-react';
import { db, IMPORT_STAGING_BOARD_ID } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';

interface HierarchySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    cardIds: string[];
    onDispatched: (cardIds: string[]) => void;
}

export default function HierarchySelector({ isOpen, onClose, cardIds, onDispatched }: HierarchySelectorProps) {
    const [selectedTab, setSelectedTab] = useState<string | null>(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
    const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const tabs = useLiveQuery(() => db.tabs.orderBy('sortOrder').toArray());
    const workspaces = useLiveQuery(
        () => selectedTab
            ? db.workspaces.where('tabId').equals(selectedTab).toArray()
            : Promise.resolve([] as import('@/lib/db').Workspace[]),
        [selectedTab]
    );
    const boards = useLiveQuery(
        () => selectedWorkspace
            ? db.boards.where('workspaceId').equals(selectedWorkspace).toArray()
            : Promise.resolve([] as import('@/lib/db').Board[]),
        [selectedWorkspace]
    );

    const handleTabSelect = (tabId: string) => {
        setSelectedTab(tabId);
        setSelectedWorkspace(null);
        setSelectedBoard(null);
    };

    const handleWorkspaceSelect = (wsId: string) => {
        setSelectedWorkspace(wsId);
        setSelectedBoard(null);
    };

    const handleConfirm = async () => {
        if (!selectedBoard || cardIds.length === 0) return;
        setIsSending(true);

        for (let i = 0; i < cardIds.length; i++) {
            const cardId = cardIds[i];
            await db.cards.update(cardId, {
                boardId: selectedBoard,
                isImported: false,
                position: { x: 100 + i * 220, y: 100 + i * 20 },
                updatedAt: new Date(),
            });
            await db.addToSyncQueue('cards', cardId, 'update');
        }

        setIsSending(false);
        onDispatched(cardIds);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md glass-panel bg-slate-900/90 border-white/10 p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Send className="text-accent-2" size={20} />
                            Send to Board
                        </h2>
                        <button onClick={onClose} className="icon-box hover:bg-white/10">
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-sm text-slate-400 mb-6">
                        Sending <span className="text-white font-semibold">{cardIds.length} card{cardIds.length !== 1 ? 's' : ''}</span> to a board.
                    </p>

                    {/* Step 1: Tab */}
                    <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">1. Select Tab</label>
                        <div className="flex flex-wrap gap-2">
                            {(tabs || []).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabSelect(tab.id)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                                        selectedTab === tab.id
                                            ? 'bg-accent-2/20 border-accent-2/50 text-accent-2'
                                            : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                    )}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Workspace */}
                    {selectedTab && (
                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">2. Select Workspace</label>
                            <div className="flex flex-wrap gap-2">
                                {(workspaces || []).length === 0 ? (
                                    <p className="text-sm text-slate-500">No workspaces in this tab.</p>
                                ) : (
                                    (workspaces || []).map(ws => (
                                        <button
                                            key={ws.id}
                                            onClick={() => handleWorkspaceSelect(ws.id)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                                                selectedWorkspace === ws.id
                                                    ? 'bg-accent-2/20 border-accent-2/50 text-accent-2'
                                                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                            )}
                                        >
                                            {ws.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Board */}
                    {selectedWorkspace && (
                        <div className="mb-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">3. Select Board</label>
                            <div className="flex flex-wrap gap-2">
                                {(boards || []).filter(b => b.id !== IMPORT_STAGING_BOARD_ID).length === 0 ? (
                                    <p className="text-sm text-slate-500">No boards in this workspace.</p>
                                ) : (
                                    (boards || []).filter(b => b.id !== IMPORT_STAGING_BOARD_ID).map(board => (
                                        <button
                                            key={board.id}
                                            onClick={() => setSelectedBoard(board.id)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                                                selectedBoard === board.id
                                                    ? 'bg-accent-2/20 border-accent-2/50 text-accent-2'
                                                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                            )}
                                        >
                                            {board.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedBoard || isSending}
                        className="w-full btn-primary py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                        {isSending ? 'Sending...' : `Confirm — Send to Board`}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
