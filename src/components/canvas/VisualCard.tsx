'use client';

import { Handle, Position } from '@xyflow/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/db';

export default function VisualCard({ id, data, selected }: { id: string, data: any, selected: boolean }) {
    const { title, description, status, priority, colour } = data;
    const [isEditingRef, setIsEditingRef] = React.useState(false);
    const [projectRef, setProjectRef] = React.useState(data.projectRef || '#');

    // Live query for tags on this card
    const dbCard = useLiveQuery(() => db.cards.get(id), [id]);
    const cardTags = dbCard?.tags || [];

    // Update local state when prop changes to keep in sync
    React.useEffect(() => {
        setProjectRef(data.projectRef || '#');
    }, [data.projectRef, id]);

    const handleRefSubmit = async () => {
        setIsEditingRef(false);
        if (projectRef !== data.projectRef) {
            try {
                await db.cards.update(id, { projectRef });
                await db.addToSyncQueue('cards', id, 'update');
            } catch (error) {
                console.error("Failed to update project ref", error);
            }
        }
    };

    return (
        <motion.div
            className={cn(
                "glass-panel min-w-[240px] overflow-hidden group transition-all duration-300",
                selected && "ring-2 ring-accent-1 shadow-[0_0_30px_rgba(249,115,22,0.3)]",
                !selected && "hover:border-white/20"
            )}
        >
            {/* Top Accent Bar */}
            <div
                className="h-1 w-full"
                style={{ backgroundColor: colour || 'var(--accent-1)' }}
            />

            <div className="p-3 flex flex-col gap-2">
                {/* Header Tags */}
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex gap-2">
                        <div className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            priority === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                priority === 'medium' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                    "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        )}>
                            {priority || 'Medium'}
                        </div>
                    </div>

                    {isEditingRef ? (
                        <input
                            autoFocus
                            type="text"
                            value={projectRef}
                            onChange={(e) => setProjectRef(e.target.value)}
                            onBlur={handleRefSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleRefSubmit()}
                            className="text-[10px] bg-slate-800/50 text-white border border-accent-1/30 rounded px-1 py-0.5 w-[80px] focus:outline-none focus:border-accent-1"
                        />
                    ) : (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingRef(true);
                            }}
                            className="text-[10px] text-slate-500 font-medium tracking-wider hover:text-accent-1 cursor-pointer transition-colors"
                        >
                            {projectRef}
                        </div>
                    )}
                </div>

                {/* Title & Description */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-accent-3 transition-colors line-clamp-1">
                        {title || data.label}
                    </h3>
                    {description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Tag Pills */}
                {cardTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {cardTags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[8px] px-1.5 py-0.5 rounded-full bg-accent-3/10 border border-accent-3/20 text-accent-3 font-semibold"
                            >
                                #{tag}
                            </span>
                        ))}
                        {cardTags.length > 3 && (
                            <span className="text-[8px] px-1 py-0.5 text-slate-500 font-medium">
                                +{cardTags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock size={10} />
                        <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Just now'}</span>
                    </div>
                    <div className={cn(
                        "text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
                        status === 'complete' ? "bg-emerald-500/10 text-emerald-500" :
                            status === 'blocked' ? "bg-red-500/10 text-red-500" :
                                "bg-slate-800 text-slate-300"
                    )}>
                        {status || 'To Do'}
                    </div>
                </div>
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} className="!bg-accent-1 !border-none !w-2 !h-2" />
            <Handle type="target" position={Position.Left} className="!bg-accent-1 !border-none !w-2 !h-2" />
            <Handle type="source" position={Position.Right} className="!bg-accent-1 !border-none !w-2 !h-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-accent-1 !border-none !w-2 !h-2" />
        </motion.div>
    );
}
