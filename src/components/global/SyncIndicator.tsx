'use client';

import { useSync } from '@/components/providers/SyncProvider';
import { RefreshCw, CheckCircle2, CloudOff, Cloud, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncIndicator() {
    const { isSyncing, pendingCount, lastSynced, triggerSync, triggerPull } = useSync();

    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <div className="relative">
                    {isSyncing ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-accent-3"
                        >
                            <RefreshCw size={16} />
                        </motion.div>
                    ) : pendingCount > 0 ? (
                        <div className="text-accent-1">
                            <CloudOff size={16} />
                        </div>
                    ) : (
                        <div className="text-green-400">
                            <Cloud size={16} />
                        </div>
                    )}

                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-1 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent-1 text-[8px] font-bold text-white items-center justify-center">
                                {pendingCount}
                            </span>
                        </span>
                    )}
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white leading-none">
                        {isSyncing ? 'Syncing...' : pendingCount > 0 ? 'Local Changes' : 'Cloud Synced'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">
                        {lastSynced ? `Last: ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'PKM Super Hub v1'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={triggerSync}
                    disabled={isSyncing}
                    className={cn(
                        "p-2 rounded-lg transition-all border border-white/5",
                        isSyncing ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 text-slate-400 hover:text-white"
                    )}
                    title="Push to Cloud"
                >
                    <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                </button>

                <button
                    onClick={triggerPull}
                    disabled={isSyncing}
                    className={cn(
                        "p-2 rounded-lg transition-all border border-white/5",
                        isSyncing ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 text-slate-400 hover:text-accent-3"
                    )}
                    title="Pull from Cloud"
                >
                    <Download size={14} />
                </button>
            </div>
        </div>
    );
}
