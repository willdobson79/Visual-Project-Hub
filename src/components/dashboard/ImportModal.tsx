'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, FileText, Sparkles, Loader2, Save, Edit2, Tag
} from 'lucide-react';
import { db, IMPORT_STAGING_BOARD_ID } from '@/lib/db';
import { cn } from '@/lib/utils';

interface ParsedCard {
    title: string;
    description: string;
    category: string;
    emoji: string;
    suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
}

interface EditableCard extends ParsedCard {
    _editing?: boolean;
}

interface AiSettings {
    provider: 'claude' | 'gemini' | 'openai';
    claudeKey: string;
    geminiKey: string;
    openaiKey: string;
}

const SETTINGS_KEY = 'pkm_ai_settings';
const PRIORITY_COLOURS: Record<string, string> = {
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export default function ImportModal({ isOpen, onClose, onSaved }: ImportModalProps) {
    const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
    const [pasteText, setPasteText] = useState('');
    const [splitByParagraph, setSplitByParagraph] = useState(false);
    const [settings, setSettings] = useState<AiSettings>({
        provider: 'claude',
        claudeKey: '',
        geminiKey: '',
        openaiKey: '',
    });
    const [parsedCards, setParsedCards] = useState<EditableCard[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load settings from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            try {
                const saved = JSON.parse(raw) as AiSettings;
                setSettings(prev => ({ ...prev, ...saved }));
            } catch {
                // ignore
            }
        }
    }, []);

    const saveSettings = (updated: AiSettings) => {
        setSettings(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        }
    };

    const currentApiKey = () => {
        switch (settings.provider) {
            case 'claude': return settings.claudeKey;
            case 'gemini': return settings.geminiKey;
            case 'openai': return settings.openaiKey;
        }
    };

    const setCurrentApiKey = (key: string) => {
        const updated = { ...settings };
        switch (settings.provider) {
            case 'claude': updated.claudeKey = key; break;
            case 'gemini': updated.geminiKey = key; break;
            case 'openai': updated.openaiKey = key; break;
        }
        saveSettings(updated);
    };

    const handleFileRead = (file: File) => {
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            setError('Only .txt and .md files are supported.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setPasteText(text);
            setActiveTab('paste');
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileRead(file);
    };

    const handleParse = async () => {
        const textToSend = pasteText.trim();
        if (!textToSend) { setError('Please enter some text to parse.'); return; }

        const apiKey = currentApiKey();
        if (!apiKey) { setError(`Please enter your ${settings.provider} API key.`); return; }

        setIsParsing(true);
        setError(null);
        setParsedCards([]);

        const segments = splitByParagraph
            ? textToSend.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
            : [textToSend];

        const existingCategories = await db.getAllCategories();

        try {
            const allCards: EditableCard[] = [];
            for (const segment of segments) {
                const res = await fetch('/api/ai/parse-note', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: segment,
                        provider: settings.provider,
                        apiKey,
                        existingCategories,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'API error');
                allCards.push(...(data.cards as EditableCard[]));
            }
            setParsedCards(allCards);
        } catch (err: any) {
            setError(err.message ?? 'Failed to parse.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleSaveToInbox = async () => {
        if (parsedCards.length === 0) return;
        setIsSaving(true);
        try {
            const now = new Date();
            const newCards = parsedCards.map((card, i) => ({
                id: `card-import-${Date.now()}-${i}`,
                boardId: IMPORT_STAGING_BOARD_ID,
                position: { x: 0, y: 0 },
                size: { width: 280, height: 160 },
                colour: 'bg-slate-800',
                title: card.title,
                description: card.description,
                status: 'todo' as const,
                priority: card.suggestedPriority,
                content: card.emoji || '',
                zIndex: 1,
                locked: false,
                tags: [],
                category: card.category,
                isImported: true,
                updatedAt: now,
            }));

            await db.cards.bulkAdd(newCards);

            for (const card of newCards) {
                await db.addToSyncQueue('cards', card.id, 'create');
            }

            setParsedCards([]);
            setPasteText('');
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message ?? 'Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateCard = (index: number, field: keyof EditableCard, value: string) => {
        setParsedCards(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    if (!isOpen) return null;

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
                    className="relative w-full max-w-2xl glass-panel bg-slate-900/95 border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Sparkles className="text-accent-1" size={24} />
                            AI Import
                        </h2>
                        <button onClick={onClose} className="icon-box hover:bg-white/10">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Input tabs */}
                    <div className="flex gap-2 mb-6">
                        {(['paste', 'upload'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-semibold transition-all border',
                                    activeTab === tab
                                        ? 'bg-accent-1/20 border-accent-1/50 text-accent-1'
                                        : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                                )}
                            >
                                {tab === 'paste' ? <><FileText size={14} className="inline mr-1.5 -mt-0.5" />Paste Text</> : <><Upload size={14} className="inline mr-1.5 -mt-0.5" />Upload File</>}
                            </button>
                        ))}
                    </div>

                    {/* Paste Text */}
                    {activeTab === 'paste' && (
                        <textarea
                            value={pasteText}
                            onChange={e => setPasteText(e.target.value)}
                            placeholder="Paste your notes, ideas, or text here..."
                            className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-4 text-white placeholder:text-slate-700 outline-none focus:border-accent-1/50 focus:ring-1 focus:ring-accent-1/50 transition-all min-h-[140px] resize-none text-sm"
                        />
                    )}

                    {/* Upload File */}
                    {activeTab === 'upload' && (
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all',
                                isDragOver ? 'border-accent-1/60 bg-accent-1/5' : 'border-white/10 hover:border-white/20'
                            )}
                        >
                            <Upload size={32} className="text-slate-600 mb-3" />
                            <p className="text-slate-400 text-sm font-medium">Drop a .txt or .md file here</p>
                            <p className="text-slate-600 text-xs mt-1">or click to browse</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileRead(f); }}
                            />
                        </div>
                    )}

                    {/* Options */}
                    <div className="mt-4 flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={splitByParagraph}
                                onChange={e => setSplitByParagraph(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-slate-800 accent-orange-500"
                            />
                            <span className="text-xs text-slate-400">Split by paragraph (double line-break)</span>
                        </label>
                    </div>

                    {/* Provider selector */}
                    <div className="mt-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">AI Provider</label>
                        <div className="flex gap-2 mb-4">
                            {(['claude', 'gemini', 'openai'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => saveSettings({ ...settings, provider: p })}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-semibold transition-all border capitalize',
                                        settings.provider === p
                                            ? 'bg-accent-2/20 border-accent-2/50 text-accent-2'
                                            : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                                    )}
                                >
                                    {p === 'claude' ? 'Claude' : p === 'gemini' ? 'Gemini' : 'OpenAI'}
                                </button>
                            ))}
                        </div>
                        <input
                            type="password"
                            value={currentApiKey()}
                            onChange={e => setCurrentApiKey(e.target.value)}
                            placeholder={`${settings.provider === 'claude' ? 'sk-ant-...' : settings.provider === 'gemini' ? 'AI...' : 'sk-...'} API key`}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 outline-none focus:border-accent-2/50 focus:ring-1 focus:ring-accent-2/50 transition-all text-sm"
                        />
                        <p className="text-[10px] text-slate-600 mt-1.5 px-1">Keys are stored locally and never sent to a database.</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Parse button */}
                    <button
                        onClick={handleParse}
                        disabled={isParsing || !pasteText.trim()}
                        className="w-full btn-primary py-4 rounded-xl text-sm font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isParsing ? 'Parsing...' : 'Parse with AI'}
                    </button>

                    {/* Parsed Results */}
                    {parsedCards.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                                    {parsedCards.length} Card{parsedCards.length !== 1 ? 's' : ''} Parsed
                                </h3>
                                <p className="text-xs text-slate-500">Click a card to edit title or category.</p>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {parsedCards.map((card, i) => (
                                    <div key={i} className="glass-card p-4">
                                        {editingIndex === i ? (
                                            <div className="space-y-2">
                                                <input
                                                    autoFocus
                                                    value={card.title}
                                                    onChange={e => updateCard(i, 'title', e.target.value)}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-1/50"
                                                    placeholder="Title"
                                                />
                                                <input
                                                    value={card.category}
                                                    onChange={e => updateCard(i, 'category', e.target.value)}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-2/50"
                                                    placeholder="Category"
                                                />
                                                <button
                                                    onClick={() => setEditingIndex(null)}
                                                    className="text-xs text-accent-2 hover:underline"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-start gap-3 cursor-pointer group"
                                                onClick={() => setEditingIndex(i)}
                                            >
                                                <span className="text-xl leading-none mt-0.5 flex-shrink-0">{card.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold leading-snug group-hover:text-accent-1 transition-colors">{card.title}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{card.description}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        {card.category && (
                                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-accent-2/20 border border-accent-2/30 text-accent-2 rounded-full">
                                                                <Tag size={8} className="inline mr-1" />{card.category}
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border',
                                                            PRIORITY_COLOURS[card.suggestedPriority] ?? PRIORITY_COLOURS.low
                                                        )}>
                                                            {card.suggestedPriority}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Edit2 size={12} className="text-slate-600 group-hover:text-slate-300 flex-shrink-0 mt-1" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveToInbox}
                                disabled={isSaving}
                                className="w-full mt-4 py-4 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-accent-1/20 border border-accent-1/50 text-accent-1 hover:bg-accent-1/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Saving...' : `Save ${parsedCards.length} Card${parsedCards.length !== 1 ? 's' : ''} to Inbox`}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
