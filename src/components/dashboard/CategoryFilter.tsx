'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, ExternalLink, Tag } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const PRIORITY_COLOURS: Record<string, string> = {
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export default function CategoryFilter() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const allCards = useLiveQuery(
        () => db.cards.filter(c => !c.isImported && !c.deletedAt).toArray(),
        []
    );

    const categories = [...new Set((allCards ?? []).map(c => c.category).filter((c): c is string => Boolean(c)))].sort();

    const filteredCards = selectedCategory
        ? (allCards ?? []).filter(c => c.category === selectedCategory)
        : (allCards ?? []);

    const countForCategory = (cat: string) =>
        (allCards ?? []).filter(c => c.category === cat).length;

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Filter className="text-accent-2" size={24} />
                    By Category
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Browse all cards across every board, filtered by category.
                </p>
            </div>

            <div className="flex gap-8">
                {/* Left: Category list */}
                <div className="w-56 flex-shrink-0">
                    <div className="glass-panel p-4 space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                                selectedCategory === null
                                    ? 'bg-accent-2/20 text-accent-2'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Tag size={14} />
                                All Cards
                            </span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                {(allCards ?? []).length}
                            </span>
                        </button>

                        {categories.length === 0 ? (
                            <p className="text-xs text-slate-600 px-3 py-2">No categories yet.</p>
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                                        selectedCategory === cat
                                            ? 'bg-accent-2/20 text-accent-2'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <span className="truncate">{cat}</span>
                                    <span className={cn(
                                        'text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0',
                                        selectedCategory === cat
                                            ? 'bg-accent-2/20 text-accent-2'
                                            : 'bg-slate-800 text-slate-400'
                                    )}>
                                        {countForCategory(cat)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Card grid */}
                <div className="flex-1 min-w-0">
                    {filteredCards.length === 0 ? (
                        <div className="glass-panel flex flex-col items-center justify-center p-16 text-center">
                            <Filter size={48} className="text-slate-700 mb-4" />
                            <p className="text-slate-400 font-medium">No cards in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredCards.map((card, i) => (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="glass-card p-5 group cursor-pointer hover:-translate-y-1 transition-transform"
                                    onClick={() => router.push(`/board/${card.boardId}`)}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="text-white font-semibold text-sm leading-snug">{card.title}</h3>
                                        <ExternalLink size={12} className="text-slate-600 group-hover:text-accent-2 flex-shrink-0 mt-0.5 transition-colors" />
                                    </div>

                                    {card.description && (
                                        <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">{card.description}</p>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap">
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
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
