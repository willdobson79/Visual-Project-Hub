'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Type, Palette, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

interface NewWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    tabId: string | null;
}

const COLOURS = [
    { name: 'Orange', class: 'text-accent-1', bg: 'bg-accent-1/20' },
    { name: 'Violet', class: 'text-accent-2', bg: 'bg-accent-2/20' },
    { name: 'Blue', class: 'text-accent-3', bg: 'bg-accent-3/20' },
    { name: 'Green', class: 'text-emerald-400', bg: 'bg-emerald-400/20' },
];

export default function NewWorkspaceModal({ isOpen, onClose, tabId }: NewWorkspaceModalProps) {
    const [name, setName] = useState('');
    const [selectedColour, setSelectedColour] = useState(COLOURS[0]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const id = `ws-${Date.now()}`;
        await db.workspaces.add({
            id,
            userId: 'user-1',
            tabId: tabId || 'tab-master',
            name,
            colour: selectedColour.class,
            icon: 'Briefcase',
            sortOrder: (await db.workspaces.count()) + 1,
            updatedAt: new Date()
        });

        await db.addToSyncQueue('workspaces', id, 'create');
        onClose();
        setName('');
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
                            <Sparkles className="text-accent-1" size={24} />
                            New Workspace
                        </h2>
                        <button onClick={onClose} className="icon-box hover:bg-white/10">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Workspace Name</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent-1 transition-colors" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Freelance Projects"
                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 outline-none focus:border-accent-1/50 focus:ring-1 focus:ring-accent-1/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Accent Colour</label>
                            <div className="flex gap-4">
                                {COLOURS.map((col) => (
                                    <button
                                        key={col.name}
                                        type="button"
                                        onClick={() => setSelectedColour(col)}
                                        className={cn(
                                            "w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center",
                                            selectedColour.name === col.name
                                                ? "border-white/40 scale-110 shadow-lg"
                                                : "border-transparent opacity-50 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("w-6 h-6 rounded-full shadow-inner", col.class.replace('text-', 'bg-'))} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!name}
                            className="w-full btn-primary py-4 rounded-xl text-sm font-bold uppercase tracking-widest mt-4 bg-accent-1/20 border-accent-1/30 text-accent-1 hover:bg-accent-1 hover:text-white disabled:opacity-30 transition-all"
                        >
                            Construct Workspace
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
