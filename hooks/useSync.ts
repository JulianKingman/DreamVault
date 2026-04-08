import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSync as useSyncContext } from '../contexts/SyncContext';

export function useAutoSync() {
  const { syncNow, cloudAvailable, checkCloudAvailability } = useSyncContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check cloud availability on mount
  useEffect(() => {
    checkCloudAvailability();
  }, [checkCloudAvailability]);

  // Sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && cloudAvailable) {
        // Debounce to avoid rapid repeated syncs
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          syncNow();
        }, 2000);
      }
    });

    return () => {
      subscription.remove();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cloudAvailable, syncNow]);
}
