import React, { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { fullSync, isCloudAvailable } from '../utils/sync';

const LAST_SYNC_KEY = 'last_sync_time';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncContextValue {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  cloudAvailable: boolean;
  syncNow: () => Promise<void>;
  checkCloudAvailability: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const stored = storage.getString(LAST_SYNC_KEY);
    return stored ? new Date(stored) : null;
  });

  const checkCloudAvailability = useCallback(async () => {
    const available = await isCloudAvailable();
    setCloudAvailable(available);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const since = lastSyncTime ?? new Date(0);
      await fullSync(since);
      const now = new Date();
      storage.set(LAST_SYNC_KEY, now.toISOString());
      setLastSyncTime(now);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  }, [lastSyncTime]);

  return (
    <SyncContext.Provider
      value={{ syncStatus, lastSyncTime, cloudAvailable, syncNow, checkCloudAvailability }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
