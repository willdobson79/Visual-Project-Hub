'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Download, Share2, FileSpreadsheet, Tag, Plus, X, Zap } from 'lucide-react';
import { db } from '@/lib/db';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import CSVImportModal from './CSVImportModal';
import { useLiveQuery } from 'dexie-react-hooks';

interface BoardControlsProps {
    board: any;
}

export default function BoardControls({ board }: BoardControlsProps) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAutoTagOpen, setIsAutoTagOpen] = useState(false);
    const [newAutoTag, setNewAutoTag] = useState('');

    // Live query for auto-tag rules
    const autoTagRules = useLiveQuery(
        () => board?.id ? db.tagRules.where('boardId').equals(board.id).toArray() : [],
        [board?.id]
    );

    if (!board) return null;

    const handleToggleLock = async () => {
        const isLocked = !board.isLocked;
        await db.boards.update(board.id, { isLocked });
        await db.addToSyncQueue('boards', board.id, 'update');
    };

    const handleExport = async () => {
        const element = document.querySelector('.react-flow__renderer') as HTMLElement;
        if (!element) return;

        try {
            const dataUrl = await toPng(element, {
                backgroundColor: '#05080f',
                quality: 1,
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = `${board.name.toLowerCase().replace(/\s+/g, '-')}-canvas.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export image.');
        }
    };

    const handleAddAutoTag = async () => {
        const tag = newAutoTag.trim().toLowerCase();
        if (!tag) return;

        // Check if this tag is already an auto-add rule for this board
        const existing = autoTagRules?.find(r => r.tag === tag);
        if (existing) return;

        const id = `tr-${Date.now()}`;
        await db.tagRules.add({
            id,
            boardId: board.id,
            tag,
            updatedAt: new Date()
        });
        setNewAutoTag('');
    };

    const handleRemoveAutoTag = async (ruleId: string) => {
        await db.tagRules.delete(ruleId);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleLock}
                className={cn(
                    "icon-box w-10 h-10 transition-all",
                    board.isLocked ? "bg-accent-1/20 border-accent-1/30 text-accent-1" : "hover:bg-white/10 text-slate-400 hover:text-white"
                )}
                title={board.isLocked ? "Unlock Board" : "Lock Board"}
            >
                {board.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </button>

            <button
                onClick={() => setIsImportModalOpen(true)}
                className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                title="Import from CSV"
            >
                <FileSpreadsheet size={18} />
            </button>

            <button
                onClick={handleExport}
                className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                title="Export as PNG"
            >
                <Download size={18} />
            </button>

            {/* Auto-Tag Button */}
            <button
                onClick={() => setIsAutoTagOpen(!isAutoTagOpen)}
                className={cn(
                    "icon-box w-10 h-10 transition-all relative",
                    isAutoTagOpen ? "bg-accent-2/20 border-accent-2/30 text-accent-2" : "hover:bg-white/10 text-slate-400 hover:text-white"
                )}
                title="Auto-Add Tags"
            >
                <Zap size={18} />
                {autoTagRules && autoTagRules.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-2 text-[9px] font-bold flex items-center justify-center text-white">
                        {autoTagRules.length}
                    </span>
                )}
            </button>

            <div className="w-px h-6 bg-white/5 mx-2" />

            <button
                className="btn-primary py-1.5 px-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                title="Collaboration"
            >
                <Share2 size={14} /> Share
            </button>

            <CSVImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                boardId={board.id}
            />

            {/* Auto-Tag Popover */}
            <AnimatePresence>
                {isAutoTagOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full right-0 mt-2 w-80 glass-panel bg-slate-900/95 border-white/10 p-5 shadow-2xl z-[100]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Zap size={14} className="text-accent-2" />
                                Auto-Add Tags
                            </h3>
                            <button onClick={() => setIsAutoTagOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                            Tags below will be automatically applied to every new card created on this board.
                        </p>

                        {/* Current Auto Tags */}
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                            {(autoTagRules || []).map((rule) => (
                                <span
                                    key={rule.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-accent-2/10 border border-accent-2/20 rounded-full text-[10px] font-semibold text-accent-2"
                                >
                                    <Zap size={8} />
                                    #{rule.tag}
                                    <button
                                        onClick={() => handleRemoveAutoTag(rule.id)}
                                        className="hover:text-red-400 transition-colors ml-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                            {(!autoTagRules || autoTagRules.length === 0) && (
                                <span className="text-[10px] text-slate-600 italic">No auto-add tags configured.</span>
                            )}
                        </div>

                        {/* Add New Auto Tag */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newAutoTag}
                                onChange={(e) => setNewAutoTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddAutoTag();
                                }}
                                placeholder="Enter tag name..."
                                className="flex-1 bg-slate-950 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-white placeholder:text-slate-700 outline-none focus:border-accent-2/50 transition-all"
                            />
                            <button
                                onClick={handleAddAutoTag}
                                className="icon-box bg-accent-2/10 border-accent-2/20 text-accent-2 hover:bg-accent-2 hover:text-white transition-all w-8 h-8"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
