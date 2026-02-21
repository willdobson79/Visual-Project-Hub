'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Palette, Scissors, Activity, Trash2, Sliders } from 'lucide-react';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

interface EdgeSidebarProps {
    edge: any;
    isOpen: boolean;
    onClose: () => void;
}

const COLOURS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Violet', value: '#a855f7' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Yellow', value: '#facc15' },
    { name: 'White', value: '#ffffff' },
];

export default function EdgeSidebar({ edge, isOpen, onClose }: EdgeSidebarProps) {
    const [label, setLabel] = useState(edge?.data?.label || '');
    const [type, setType] = useState(edge?.type || 'smoothstep');
    const [style, setStyle] = useState(edge?.data?.style || 'solid');
    const [colour, setColour] = useState(edge?.data?.colour || '#3b82f6');
    const [animated, setAnimated] = useState(edge?.animated || false);
    const [strokeWidth, setStrokeWidth] = useState(edge?.data?.strokeWidth || 2);

    useEffect(() => {
        if (edge) {
            setLabel(edge.data?.label || '');
            setType(edge.type || 'smoothstep');
            setStyle(edge.data?.style || 'solid');
            setColour(edge.data?.colour || '#3b82f6');
            setAnimated(edge.animated || false);
            setStrokeWidth(edge.data?.strokeWidth || 2);
        }
    }, [edge]);

    if (!edge) return null;

    const handleUpdate = async (updates: any) => {
        await db.connections.update(edge.id, updates);
        await db.addToSyncQueue('connections', edge.id, 'update');
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this connection?')) {
            await db.connections.delete(edge.id);
            await db.addToSyncQueue('connections', edge.id, 'delete');
            onClose();
        }
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
                        className="fixed top-0 right-0 h-screen w-full lg:w-[400px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-[120] flex flex-col shadow-2xl"
                    >
                        <header className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={onClose} className="icon-box hover:bg-white/10">
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-accent-2 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connection</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDelete}
                                className="icon-box bg-transparent border-none text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Label */}
                            <section className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Label</label>
                                <div className="relative group">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => {
                                            setLabel(e.target.value);
                                            handleUpdate({ label: e.target.value });
                                        }}
                                        placeholder="Connection Name"
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-800 outline-none focus:border-white/20 transition-all"
                                    />
                                </div>
                            </section>

                            {/* Arrow Logic */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Style & Logic</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase">Animated</span>
                                        <button
                                            onClick={() => {
                                                const newVal = !animated;
                                                setAnimated(newVal);
                                                handleUpdate({ animated: newVal });
                                            }}
                                            className={cn(
                                                "w-10 h-5 rounded-full relative transition-colors",
                                                animated ? "bg-accent-2" : "bg-slate-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                                                animated ? "left-6" : "left-1"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass-panel p-4 space-y-3">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Path Type</span>
                                        <select
                                            value={type}
                                            onChange={(e) => {
                                                setType(e.target.value);
                                                handleUpdate({ type: e.target.value });
                                            }}
                                            className="w-full bg-transparent text-white font-bold text-sm outline-none"
                                        >
                                            <option value="default">Bezier</option>
                                            <option value="straight">Straight</option>
                                            <option value="step">Step</option>
                                            <option value="smoothstep">Smooth</option>
                                        </select>
                                    </div>
                                    <div className="glass-panel p-4 space-y-3">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Line Style</span>
                                        <select
                                            value={style}
                                            onChange={(e) => {
                                                setStyle(e.target.value as any);
                                                handleUpdate({ style: e.target.value as any });
                                            }}
                                            className="w-full bg-transparent text-white font-bold text-sm outline-none focus:bg-slate-900"
                                        >
                                            <option value="solid">Solid</option>
                                            <option value="dashed">Dashed</option>
                                            <option value="dotted">Dotted</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Thickness */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Thickness</label>
                                    <span className="text-xs text-white font-bold">{strokeWidth}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={strokeWidth}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setStrokeWidth(val);
                                        handleUpdate({ strokeWidth: val });
                                    }}
                                    className="w-full accent-accent-2"
                                />
                            </section>

                            {/* Colours */}
                            <section className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Colour Theme</label>
                                <div className="flex flex-wrap gap-3">
                                    {COLOURS.map((col) => (
                                        <button
                                            key={col.value}
                                            onClick={() => {
                                                setColour(col.value);
                                                handleUpdate({ colour: col.value });
                                            }}
                                            className={cn(
                                                "w-10 h-10 rounded-lg border-2 transition-all p-1",
                                                colour === col.value ? "border-white" : "border-transparent"
                                            )}
                                        >
                                            <div className="w-full h-full rounded-md shadow-inner" style={{ backgroundColor: col.value }} />
                                        </button>
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={colour}
                                            onChange={(e) => {
                                                setColour(e.target.value);
                                                handleUpdate({ colour: e.target.value });
                                            }}
                                            className="w-10 h-10 rounded-lg bg-transparent border-2 border-white/10 cursor-pointer overflow-hidden p-0"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Arrow Heads */}
                            <section className="space-y-4 pt-10 border-t border-white/5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Endpoints</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-[10px] text-slate-500 uppercase">Start (Tail)</span>
                                        <select
                                            value={edge.data?.markerStart || 'none'}
                                            onChange={(e) => handleUpdate({ markerStart: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-xs outline-none"
                                        >
                                            <option value="none">None</option>
                                            <option value="arrow">Arrow</option>
                                            <option value="circle">Circle</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] text-slate-500 uppercase">End (Head)</span>
                                        <select
                                            value={edge.data?.markerEnd || 'arrow'}
                                            onChange={(e) => handleUpdate({ markerEnd: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-xs outline-none"
                                        >
                                            <option value="none">None</option>
                                            <option value="arrow">Arrow</option>
                                            <option value="circle">Circle</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
