import { useState, useEffect, useCallback } from 'react';
import { getDb, getDreams, rowToDream, attachTags } from '../utils/database';
import type { Dream } from '../types';

export function useDreams({ search = '', favoritesOnly = false }) {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    const db = getDb();

    let query = 'SELECT * FROM dreams WHERE content LIKE ? AND (isDeleted = 0 OR isDeleted IS NULL)';
    const params: (string | number)[] = [`%${search}%`];
    if (favoritesOnly) query += ' AND isFavorite = 1';
    query += ' ORDER BY dateModified DESC';

    // reactiveExecute re-runs the query whenever the specified tables change
    // and fires the callback with the new results.
    const unsubscribe = db.reactiveExecute({
      query,
      arguments: params,
      fireOn: [{ table: 'dreams' }],
      callback: (result) => {
        const rows = result.rows ?? [];
        setDreams(rows.map((row: any) => attachTags(rowToDream(row))));
      },
    });

    // Load initial data — reactiveExecute may not fire on subscribe
    setDreams(getDreams(search, favoritesOnly));

    return () => {
      unsubscribe();
    };
  }, [search, favoritesOnly]);

  return dreams;
}
