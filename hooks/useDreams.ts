import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDreams } from '../utils/database';
import { subscribe, DB_CHANGE } from '../utils/events';
import type { Dream } from '../types';

export function useDreams({ search = '', favoritesOnly = false }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  // Monotonic counter that ticks on ANY database write.
  // Components can depend on this to re-derive data (e.g. intentions)
  // even when the dreams array itself hasn't changed.
  const [dataVersion, setDataVersion] = useState(0);

  const reload = useCallback(() => {
    setDreams(getDreams(search, favoritesOnly));
    setDataVersion((v) => v + 1);
  }, [search, favoritesOnly]);

  // Re-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  // Re-fetch on any database write
  useEffect(() => {
    reload(); // initial load
    return subscribe(DB_CHANGE, reload);
  }, [reload]);

  return { dreams, dataVersion, refresh: reload };
}
