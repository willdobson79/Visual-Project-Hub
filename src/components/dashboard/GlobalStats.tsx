'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, CheckCircle2, Clock, Box, BarChart3, PieChart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface GlobalStatsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalStats({ isOpen, onClose }: GlobalStatsProps) {
    const boards = useLiveQuery(() => db.boards.toArray());
    const cards = useLiveQuery(() => db.cards.toArray());

    const totalBoards = boards?.length || 0;
    const totalCards = cards?.length || 0;
    const completedCards = cards?.filter(c => c.status === 'complete').length || 0;
    const inProgressCards = cards?.filter(c => c.status === 'in-progress').length || 0;
    const highPriority = cards?.filter(c => c.priority === 'high').length || 0;

    const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

    const stats = [
        { label: 'Total Boards', value: totalBoards, icon: Box, color: 'text-accent-3', bg: 'bg-accent-3/10' },
        { label: 'Total Tasks', value: totalCards, icon: BarChart3, color: 'text-accent-2', bg: 'bg-accent-2/10' },
        { label: 'Completion', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
        { label: 'Urgent Ops', value: highPriority, icon: TrendingUp, color: 'text-accent-1', bg: 'bg-accent-1/10' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Global Insight</h2>
                                <p className="text-slate-500 text-sm">Real-time performance across all workspaces</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="icon-box hover:bg-white/5 text-slate-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                                {stats.map((s, i) => (
                                    <div key={i} className="glass-panel p-6 border-white/5">
                                        <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4`}>
                                            <s.icon size={20} />
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium mb-1">{s.label}</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-panel p-8 border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <PieChart size={120} className="text-accent-2" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-6">Task Distribution</h3>
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <div className="flex justify-between mb-2 text-sm">
                                                <span className="text-slate-400">Completed</span>
                                                <span className="text-green-400 font-bold">{completedCards}</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(completedCards / totalCards) * 100}%` }}
                                                    className="h-full bg-green-400"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2 text-sm">
                                                <span className="text-slate-400">In Progress</span>
                                                <span className="text-accent-3 font-bold">{inProgressCards}</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(inProgressCards / totalCards) * 100}%` }}
                                                    className="h-full bg-accent-3"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2 text-sm">
                                                <span className="text-slate-400">Not Started</span>
                                                <span className="text-slate-600 font-bold">{totalCards - completedCards - inProgressCards}</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((totalCards - completedCards - inProgressCards) / totalCards) * 100}%` }}
                                                    className="h-full bg-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-8 border-white/5 bg-accent-1/5 border-accent-1/10 flex flex-col justify-center items-center text-center">
                                    <TrendingUp size={48} className="text-accent-1 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Efficiency Rating</h3>
                                    <p className="text-slate-400 text-sm mb-6 max-w-xs">Your workspace completion rate is currently <span className="text-accent-1 font-bold">{completionRate}%</span>. Focus on completing in-progress tasks to increase efficiency.</p>
                                    <button
                                        onClick={onClose}
                                        className="btn-primary py-2 px-6"
                                    >
                                        Optimise Workflow
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-950/50 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Willpowered Metrics Engine v2.0</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Global Status: <span className="text-green-400">Optimal</span></p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
