'use client';

import { motion } from 'framer-motion';
import { Search, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface BoardListViewProps {
    cards: any[];
    onCardClick: (card: any) => void;
}

export default function BoardListView({ cards, onCardClick }: BoardListViewProps) {
    const [search, setSearch] = useState('');

    const filteredCards = cards.filter(card =>
        card.data.title?.toLowerCase().includes(search.toLowerCase()) ||
        card.data.projectRef?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Search Bar */}
                <div className="glass-panel p-4 flex items-center gap-3 sticky top-0 bg-slate-900/80 z-10 backdrop-blur-xl">
                    <Search className="text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search cards by title or reference..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* List */}
                <div className="space-y-2">
                    {filteredCards.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">No cards found.</div>
                    ) : (
                        filteredCards.map((card) => (
                            <motion.div
                                key={card.id}
                                layoutId={card.id}
                                onClick={() => onCardClick(card)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 hover:border-accent-3/30 transition-all border-l-4"
                                style={{ borderLeftColor: card.data.colour || '#3b82f6' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-800 text-[10px] font-mono px-2 py-1 rounded text-slate-400 min-w-[60px] text-center">
                                        {card.data.projectRef || '#'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">
                                            {card.data.title || 'Untitled Card'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm",
                                                card.data.priority === 'urgent' ? "text-red-500 bg-red-500/10" :
                                                    card.data.priority === 'high' ? "text-orange-500 bg-orange-500/10" :
                                                        card.data.priority === 'medium' ? "text-yellow-500 bg-yellow-500/10" :
                                                            "text-slate-500 bg-slate-500/10"
                                            )}>
                                                {card.data.priority}
                                            </span>
                                            <span className="text-[10px] text-slate-600">•</span>
                                            <span className="text-[10px] text-slate-500">
                                                {card.data.updatedAt ? new Date(card.data.updatedAt).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium border",
                                        card.data.status === 'complete' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" :
                                            card.data.status === 'in-progress' ? "border-blue-500/20 text-blue-500 bg-blue-500/5" :
                                                "border-slate-700 text-slate-500 bg-slate-800/50"
                                    )}>
                                        {card.data.status === 'not-started' ? 'To Do' : card.data.status.replace('-', ' ')}
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-accent-3 transition-colors" size={18} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
