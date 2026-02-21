'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Layout, FileText, ChevronRight, X } from 'lucide-react';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ boards: any[], cards: any[] }>({ boards: [], cards: [] });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!query) {
            setResults({ boards: [], cards: [] });
            return;
        }

        const search = async () => {
            const boards = await db.boards
                .filter(b => b.name.toLowerCase().includes(query.toLowerCase()))
                .limit(5)
                .toArray();

            const cards = await db.cards
                .filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
                .limit(5)
                .toArray();

            setResults({ boards, cards });
            setSelectedIndex(0);
        };

        const timer = setTimeout(search, 150);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item: any, type: 'board' | 'card') => {
        if (type === 'board') {
            router.push(`/board/${item.id}`);
        } else {
            router.push(`/board/${item.boardId}?card=${item.id}`);
        }
        setIsOpen(false);
        setQuery('');
    };

    const totalResults = results.boards.length + results.cards.length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-slate-950/50">
                            <Search className="text-slate-500" size={20} />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search boards, cards, tasks..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-700"
                            />
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-500 border border-white/5">
                                ESC
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {query && totalResults === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-slate-500 text-sm">No results found for "<span className="text-white">{query}</span>"</p>
                                </div>
                            )}

                            {!query && (
                                <div className="p-8 text-center">
                                    <Command className="mx-auto text-slate-700 mb-4" size={32} />
                                    <p className="text-slate-400 text-sm font-medium">Type to search across all your workspaces</p>
                                </div>
                            )}

                            {results.boards.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-accent-3">Boards</h3>
                                    {results.boards.map((board, i) => (
                                        <button
                                            key={board.id}
                                            onClick={() => handleSelect(board, 'board')}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-accent-3 border border-white/5 group-hover:scale-110 transition-transform">
                                                <Layout size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-bold">{board.name}</p>
                                                <p className="text-xs text-slate-500">Board</p>
                                            </div>
                                            <ChevronRight className="text-slate-700 group-hover:text-white transition-colors" size={16} />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.cards.length > 0 && (
                                <div>
                                    <h3 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-accent-1">Cards & Tasks</h3>
                                    {results.cards.map((card, i) => (
                                        <button
                                            key={card.id}
                                            onClick={() => handleSelect(card, 'card')}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-accent-1 border border-white/5 group-hover:scale-110 transition-transform">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-bold">{card.title}</p>
                                                <p className="text-xs text-slate-500">Card in Board ID: {card.boardId.substring(0, 8)}...</p>
                                            </div>
                                            <ChevronRight className="text-slate-700 group-hover:text-white transition-colors" size={16} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-950/80 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
                                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5 text-slate-400">↑↓</span> to navigate</span>
                                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5 text-slate-400">ENTER</span> to select</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Willpowered Insight</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
