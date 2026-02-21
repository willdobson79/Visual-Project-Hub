'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startSyncService, processSyncQueue, pullFromCloud, isSyncing as syncServiceIsSyncing } from '@/lib/sync_service';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SyncContextType {
    isSyncing: boolean;
    pendingCount: number;
    lastSynced: Date | null;
    triggerSync: () => Promise<void>;
    triggerPull: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export default function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Track pending items in Dexie
    const pendingCount = useLiveQuery(
        () => db.syncQueue.where('synced').equals(0).count()
    ) || 0;

    const triggerSync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await processSyncQueue();
            if (pendingCount === 0) {
                setLastSynced(new Date());
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, pendingCount]);

    const triggerPull = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await pullFromCloud();
            setLastSynced(new Date());
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    useEffect(() => {
        // Start background service (push every 5s, pull every 30s)
        startSyncService(5000, 30000);

        // Periodically sync component state with global service state
        const interval = setInterval(() => {
            setIsSyncing(syncServiceIsSyncing);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <SyncContext.Provider value={{ isSyncing, pendingCount, lastSynced, triggerSync, triggerPull }}>
            {children}
        </SyncContext.Provider>
    );
}

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within a SyncProvider');
    return context;
};
