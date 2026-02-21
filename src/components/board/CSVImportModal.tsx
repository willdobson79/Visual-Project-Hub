'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, Download, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useReactFlow } from '@xyflow/react';

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
}

export default function CSVImportModal({ isOpen, onClose, boardId }: CSVImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [colourMode, setColourMode] = useState<'auto' | 'single'>('auto');
    const [singleColour, setSingleColour] = useState('#3b82f6');
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const { getNodes } = useReactFlow();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccessCount(null);
        }
    };

    const generateTemplate = () => {
        const headers = ['Title', 'Reference', 'Description', 'Priority', 'Status', 'Colour', 'Notes', 'Tags'];
        const exampleRow = ['Example Task', '#PRJ-001', 'This is a description', 'medium', 'not-started', '#3b82f6', '<h1>Rich Text Notes</h1>', 'frontend,ui'];

        const csvContent = [
            headers.join(','),
            exampleRow.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'card_import_template.csv');
        link.click();
    };

    const handleImport = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as any[];
                    if (rows.length === 0) {
                        setError('CSV file is empty');
                        setIsLoading(false);
                        return;
                    }

                    // Get current max Z-Index to place new cards on top
                    const existingNodes = await db.cards.where('boardId').equals(boardId).toArray();
                    const maxZ = existingNodes.reduce((max, card) => Math.max(max, card.zIndex || 0), 0);

                    // Helper for random color
                    const randomColor = () => {
                        const colors = ['#f97316', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
                        return colors[Math.floor(Math.random() * colors.length)];
                    };

                    const newCards = rows.map((row, index) => {
                        const id = `card-${Date.now()}-${index}`;

                        // Layout logic: spread them out in a grid or stack
                        // Simple stack with offset for now
                        const x = 100 + (index * 20) % 400;
                        const y = 100 + (Math.floor(index / 20) * 50) + (index * 20);

                        // Generate default Ref if missing: YY-MM-DD-HH-mm-ss
                        const now = new Date();
                        const defaultRef = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

                        return {
                            id,
                            boardId,
                            title: row.Title || 'Untitled Card',
                            projectRef: row.Reference || defaultRef,
                            description: row.Description || '',
                            priority: (row.Priority || 'medium').toLowerCase(),
                            status: (row.Status || 'not-started').toLowerCase(),
                            colour: colourMode === 'single' ? singleColour : (row.Colour || randomColor()),
                            content: row.Notes || '',
                            position: { x, y },
                            size: { width: 250, height: 150 },
                            zIndex: maxZ + index + 1,
                            locked: false,
                            tags: row.Tags ? row.Tags.split(',').map((t: string) => t.trim()) : [],
                            updatedAt: new Date()
                        };
                    });

                    // Batch add
                    await db.cards.bulkAdd(newCards);

                    // Add to sync queue
                    for (const card of newCards) {
                        await db.addToSyncQueue('cards', card.id, 'create');
                    }

                    setSuccessCount(newCards.length);
                    setTimeout(() => {
                        onClose();
                        setFile(null);
                        setSuccessCount(null);
                    }, 1500);

                } catch (err) {
                    console.error("Import error:", err);
                    setError('Failed to import cards. Please check file format.');
                } finally {
                    setIsLoading(false);
                }
            },
            error: (err) => {
                setError(`CSV Parsing Error: ${err.message}`);
                setIsLoading(false);
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <header className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FileSpreadsheet size={20} className="text-accent-2" />
                                    Import Cards via CSV
                                </h2>
                                <button onClick={onClose} className="icon-box w-8 h-8 hover:bg-white/10 border-none">
                                    <X size={16} />
                                </button>
                            </header>

                            <div className="p-6 space-y-6">
                                {/* Instructions & Template */}
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Upload a CSV file to bulk create cards. Does not support image attachments yet.
                                    </p>
                                    <button
                                        onClick={generateTemplate}
                                        className="text-xs flex items-center gap-2 text-accent-3 hover:underline"
                                    >
                                        <Download size={14} /> Download CSV Template
                                    </button>
                                </div>

                                {/* File Upload */}
                                <div
                                    className={cn(
                                        "border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:border-accent-1/50 hover:bg-white/5",
                                        file ? "border-emerald-500/50 bg-emerald-500/5" : ""
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {file ? (
                                        <>
                                            <FileSpreadsheet size={32} className="text-emerald-500" />
                                            <p className="text-sm font-bold text-white">{file.name}</p>
                                            <p className="text-xs text-slate-500">Click to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={32} className="text-slate-600" />
                                            <p className="text-sm font-bold text-slate-400">Click to Upload CSV</p>
                                        </>
                                    )}
                                </div>

                                {/* Import Options */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Colour Settings</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="colourMode"
                                                checked={colourMode === 'auto'}
                                                onChange={() => setColourMode('auto')}
                                                className="accent-accent-2"
                                            />
                                            Auto / From CSV
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="colourMode"
                                                checked={colourMode === 'single'}
                                                onChange={() => setColourMode('single')}
                                                className="accent-accent-2"
                                            />
                                            Single Colour
                                        </label>
                                    </div>

                                    {colourMode === 'single' && (
                                        <div className="flex items-center gap-3 animate-fade-in">
                                            <input
                                                type="color"
                                                value={singleColour}
                                                onChange={(e) => setSingleColour(e.target.value)}
                                                className="w-full h-8 rounded bg-transparent border border-white/20 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {error && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg">
                                        <AlertCircle size={14} /> {error}
                                    </div>
                                )}

                                {successCount !== null && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                                        <Check size={14} /> Successfully imported {successCount} cards!
                                    </div>
                                )}
                            </div>

                            <footer className="p-4 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!file || isLoading}
                                    className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Importing...' : 'Import Cards'}
                                </button>
                            </footer>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
