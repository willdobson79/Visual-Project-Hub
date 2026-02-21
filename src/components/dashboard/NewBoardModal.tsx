'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, Type, Palette } from 'lucide-react';
import { db } from '@/lib/db';

interface NewBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export default function NewBoardModal({ isOpen, onClose, workspaceId }: NewBoardModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const id = `board-${Date.now()}`;
        await db.boards.add({
            id,
            workspaceId,
            userId: 'user-1',
            name,
            description,
            settings: {},
            updatedAt: new Date()
        });

        await db.addToSyncQueue('boards', id, 'create');
        onClose();
        setName('');
        setDescription('');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                    className="relative w-full max-w-lg glass-panel bg-slate-900/90 border-white/10 p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Layout className="text-accent-3" size={24} />
                            New Board
                        </h2>
                        <button onClick={onClose} className="icon-box hover:bg-white/10">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Board Name</label>
                            <div className="relative group">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent-3 transition-colors" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Website Overhaul"
                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 outline-none focus:border-accent-3/50 focus:ring-1 focus:ring-accent-3/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What project does this board track?"
                                className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-4 text-white placeholder:text-slate-700 outline-none focus:border-accent-3/50 focus:ring-1 focus:ring-accent-3/50 transition-all min-h-[100px] resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name}
                            className="w-full btn-primary py-4 rounded-xl text-sm font-bold uppercase tracking-widest mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Initialise Board
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
