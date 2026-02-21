'use client';

import { Plus, X, Calendar, Tag, AlertCircle, Trash2, Copy, Lock, Unlock, Link2, ExternalLink, FileText, Palette, Files } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Card } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import RichTextEditor from './RichTextEditor';
import DrawingCanvas from './DrawingCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useRouter } from 'next/navigation';

interface CardSidebarProps {
    card: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function CardSidebar({ card, isOpen, onClose }: CardSidebarProps) {
    const router = useRouter();
    const [title, setTitle] = useState(card?.data?.title || "");
    const [status, setStatus] = useState(card?.data?.status || "not-started");
    const [priority, setPriority] = useState(card?.data?.priority || "medium");
    const [colour, setColour] = useState(card?.data?.colour || "#3b82f6");

    // Tag state
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [allTags, setAllTags] = useState<string[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    // Related cards state
    const [relatedCards, setRelatedCards] = useState<(Card & { boardName?: string })[]>([]);

    useEffect(() => {
        if (card) {
            setTitle(card.data?.title || "");
            setStatus(card.data?.status || "not-started");
            setPriority(card.data?.priority || "medium");
            setColour(card.data?.colour || "#3b82f6");
            loadTags();
        }
    }, [card]);

    const loadTags = useCallback(async () => {
        if (!card) return;
        const dbCard = await db.cards.get(card.id);
        const currentTags = dbCard?.tags || [];
        setTags(currentTags);

        // Load all available tags for suggestions
        const existing = await db.getAllTags();
        setAllTags(existing);

        // Load related cards
        if (currentTags.length > 0) {
            const related = await db.findRelatedCards(card.id);
            // Enrich with board names
            const enriched = await Promise.all(related.map(async (c) => {
                const board = await db.boards.get(c.boardId);
                return { ...c, boardName: board?.name || 'Unknown Board' };
            }));
            setRelatedCards(enriched);
        } else {
            setRelatedCards([]);
        }
    }, [card]);

    if (!card) return null;

    const handleUpdate = async (updates: any) => {
        await db.cards.update(card.id, updates);
        await db.addToSyncQueue('cards', card.id, 'update');
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this card?')) {
            await db.cards.delete(card.id);
            await db.addToSyncQueue('cards', card.id, 'delete');
            onClose();
        }
    };

    const handleAddTag = async (tagName: string) => {
        const tag = tagName.trim().toLowerCase();
        if (!tag || tags.includes(tag)) return;

        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput('');
        setShowTagSuggestions(false);
        await handleUpdate({ tags: newTags });
        // Refresh related cards after tag change
        setTimeout(loadTags, 100);
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);
        await handleUpdate({ tags: newTags });
        setTimeout(loadTags, 100);
    };

    const filteredSuggestions = allTags.filter(t =>
        t.includes(tagInput.toLowerCase()) && !tags.includes(t)
    );

    const navigateToRelatedCard = (relatedCard: Card & { boardName?: string }) => {
        onClose();
        router.push(`/board/${relatedCard.boardId}?card=${relatedCard.id}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden"
                    />

                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-full lg:w-[600px] xl:w-[800px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-[120] flex flex-col shadow-2xl"
                    >
                        <header className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={onClose} className="icon-box hover:bg-white/10">
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-accent-1 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Card Detail</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colour}
                                    onChange={(e) => {
                                        const newColour = e.target.value;
                                        setColour(newColour);
                                        if ((window as any).colorUpdateTimeout) {
                                            clearTimeout((window as any).colorUpdateTimeout);
                                        }
                                        (window as any).colorUpdateTimeout = setTimeout(() => {
                                            handleUpdate({ colour: newColour });
                                        }, 300);
                                    }}
                                    className="w-8 h-8 rounded bg-transparent border-none cursor-pointer"
                                />
                                <button className="icon-box bg-transparent border-none text-slate-500 hover:text-white transition-colors">
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="icon-box bg-transparent border-none text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            <section>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        handleUpdate({ title: e.target.value });
                                    }}
                                    className="w-full bg-transparent text-4xl lg:text-5xl font-bold text-white outline-none placeholder:text-slate-800"
                                    placeholder="Untitled Card"
                                />
                                <p className="text-large text-slate-500 mt-4">
                                    Created on Feb 1, 2026 • Live Preview
                                </p>
                            </section>

                            <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="glass-panel p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <Tag size={12} className="text-accent-3" />
                                        <span>Status</span>
                                    </div>
                                    <select
                                        value={status}
                                        onChange={(e) => {
                                            setStatus(e.target.value);
                                            handleUpdate({ status: e.target.value });
                                        }}
                                        className="bg-transparent text-white font-bold outline-none w-full"
                                    >
                                        <option value="not-started">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="complete">Complete</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                                <div className="glass-panel p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <AlertCircle size={12} className="text-accent-1" />
                                        <span>Priority</span>
                                    </div>
                                    <select
                                        value={priority}
                                        onChange={(e) => {
                                            setPriority(e.target.value);
                                            handleUpdate({ priority: e.target.value });
                                        }}
                                        className="bg-transparent text-white font-bold outline-none w-full"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="glass-panel p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <Calendar size={12} className="text-accent-2" />
                                        <span>Last Updated</span>
                                    </div>
                                    <div className="text-white font-bold text-sm">Just now</div>
                                </div>
                            </section>

                            {/* ═══════════ TAG MANAGEMENT ═══════════ */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <Tag size={12} className="text-accent-2" />
                                    <span>Tags</span>
                                    <span className="text-accent-3 ml-1">({tags.length})</span>
                                </div>

                                {/* Current Tags */}
                                <div className="flex flex-wrap gap-2 min-h-[32px]">
                                    {tags.map((tag) => (
                                        <motion.span
                                            key={tag}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-3/10 border border-accent-3/20 rounded-full text-xs font-semibold text-accent-3"
                                        >
                                            #{tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.span>
                                    ))}
                                    {tags.length === 0 && (
                                        <span className="text-xs text-slate-600 italic">No tags yet. Add tags to link cards across boards.</span>
                                    )}
                                </div>

                                {/* Tag Input */}
                                <div className="relative">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => {
                                                setTagInput(e.target.value);
                                                setShowTagSuggestions(true);
                                            }}
                                            onFocus={() => setShowTagSuggestions(true)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && tagInput.trim()) {
                                                    handleAddTag(tagInput);
                                                }
                                            }}
                                            placeholder="Type a tag name..."
                                            className="flex-1 bg-slate-900 border border-white/5 rounded-lg py-2 px-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-accent-3/50 transition-all"
                                        />
                                        <button
                                            onClick={() => tagInput.trim() && handleAddTag(tagInput)}
                                            className="icon-box bg-accent-3/10 border-accent-3/20 text-accent-3 hover:bg-accent-3 hover:text-white transition-all"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute left-0 right-12 top-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10 max-h-[150px] overflow-y-auto"
                                        >
                                            {filteredSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => handleAddTag(suggestion)}
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-accent-3/10 hover:text-accent-3 transition-all flex items-center gap-2"
                                                >
                                                    <Tag size={12} className="opacity-40" />
                                                    #{suggestion}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </section>

                            {/* ═══════════ RELATED CARDS (Cross-Board) ═══════════ */}
                            {relatedCards.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <Link2 size={12} className="text-accent-1" />
                                        <span>Related Cards</span>
                                        <span className="text-accent-1 ml-1">({relatedCards.length})</span>
                                    </div>

                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {relatedCards.map((rc) => {
                                            const sharedTags = rc.tags?.filter(t => tags.includes(t)) || [];
                                            return (
                                                <motion.button
                                                    key={rc.id}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    onClick={() => navigateToRelatedCard(rc)}
                                                    className="w-full text-left glass-panel p-4 hover:border-accent-1/30 transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-white group-hover:text-accent-1 transition-colors truncate">
                                                                {rc.title}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-3/50" />
                                                                {rc.boardName}
                                                            </p>
                                                        </div>
                                                        <ExternalLink size={14} className="text-slate-600 group-hover:text-accent-1 transition-colors mt-1 shrink-0" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {sharedTags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[9px] px-1.5 py-0.5 rounded bg-accent-1/10 border border-accent-1/20 text-accent-1 font-semibold"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <section className="flex-1 min-h-[500px] flex flex-col">
                                <Tabs defaultValue="notes">
                                    <TabsList className="mb-6">
                                        <TabsTrigger value="notes">
                                            <FileText size={14} />
                                            <span>Notes</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="canvas">
                                            <Palette size={14} />
                                            <span>Canvas</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="files">
                                            <Files size={14} />
                                            <span>Files</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="notes">
                                        <RichTextEditor
                                            content={card.data?.content || ""}
                                            onChange={(html) => handleUpdate({ content: html })}
                                        />
                                    </TabsContent>

                                    <TabsContent value="canvas">
                                        <DrawingCanvas onSave={(img) => console.log('Sketch updated')} />
                                    </TabsContent>

                                    <TabsContent value="files">
                                        <div className="glass-panel p-20 border-dashed border-2 border-white/5 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-slate-300 hover:border-white/20 cursor-pointer transition-all">
                                            <Files size={32} />
                                            <div className="text-center">
                                                <p className="font-bold text-white mb-1">Upload Assets</p>
                                                <p className="text-xs">Drag and drop images or documents</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </section>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
