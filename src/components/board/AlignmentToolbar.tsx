'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    AlignLeft,
    AlignCenterHorizontal,
    AlignRight,
    AlignVerticalJustifyStart,
    AlignCenterVertical,
    AlignVerticalJustifyEnd,
    AlignHorizontalDistributeCenter,
    AlignVerticalDistributeCenter,
    Trash2,
    Palette,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { alignNodes, distributeNodes } from '@/lib/canvas_utils';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

interface AlignmentToolbarProps {
    selectedNodes: any[];
    onClearSelection: () => void;
}

export default function AlignmentToolbar({ selectedNodes, onClearSelection }: AlignmentToolbarProps) {
    if (selectedNodes.length === 0) return null;

    const handleDeleteSelected = async () => {
        if (confirm(`Delete ${selectedNodes.length} selected cards?`)) {
            for (const node of selectedNodes) {
                await db.cards.delete(node.id);
                await db.addToSyncQueue('cards', node.id, 'delete');
            }
            onClearSelection();
        }
    };

    const handleBulkUpdate = async (updates: any) => {
        for (const node of selectedNodes) {
            await db.cards.update(node.id, updates);
            await db.addToSyncQueue('cards', node.id, 'update');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 20, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                exit={{ y: 20, opacity: 0, x: '-50%' }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="flex items-center gap-1 px-3 border-r border-white/5 mr-1">
                    <div className="w-6 h-6 rounded-md bg-accent-1/20 flex items-center justify-center text-[10px] font-bold text-accent-1">
                        {selectedNodes.length}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Selected</span>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1">
                    {/* Color Picker */}
                    <div className="relative group">
                        <input
                            type="color"
                            onChange={(e) => handleBulkUpdate({ colour: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <button className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Change Color">
                            <Palette size={18} />
                        </button>
                    </div>

                    {/* Priority */}
                    <div className="relative group">
                        <select
                            onChange={(e) => handleBulkUpdate({ priority: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            value=""
                        >
                            <option value="" disabled>Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <button className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Set Priority">
                            <AlertCircle size={18} />
                        </button>
                    </div>

                    {/* Status */}
                    <div className="relative group">
                        <select
                            onChange={(e) => handleBulkUpdate({ status: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            value=""
                        >
                            <option value="" disabled>Status</option>
                            <option value="not-started">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="complete">Complete</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <button className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Set Status">
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

                {/* Alignment Tools */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => alignNodes(selectedNodes, 'left')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Left"
                    >
                        <AlignLeft size={18} />
                    </button>
                    <button
                        onClick={() => alignNodes(selectedNodes, 'center')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Center"
                    >
                        <AlignCenterHorizontal size={18} />
                    </button>
                    <button
                        onClick={() => alignNodes(selectedNodes, 'right')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Right"
                    >
                        <AlignRight size={18} />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => alignNodes(selectedNodes, 'top')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Top"
                    >
                        <AlignVerticalJustifyStart size={18} />
                    </button>
                    <button
                        onClick={() => alignNodes(selectedNodes, 'middle')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Middle"
                    >
                        <AlignCenterVertical size={18} />
                    </button>
                    <button
                        onClick={() => alignNodes(selectedNodes, 'bottom')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Align Bottom"
                    >
                        <AlignVerticalJustifyEnd size={18} />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => distributeNodes(selectedNodes, 'horizontal')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Distribute Horizontally"
                    >
                        <AlignHorizontalDistributeCenter size={18} />
                    </button>
                    <button
                        onClick={() => distributeNodes(selectedNodes, 'vertical')}
                        className="icon-box w-10 h-10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Distribute Vertically"
                    >
                        <AlignVerticalDistributeCenter size={18} />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

                <button
                    onClick={handleDeleteSelected}
                    className="icon-box w-10 h-10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Selection"
                >
                    <Trash2 size={18} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
