import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import type { Dream } from '../types';
import { getDreams } from '../utils/database';

const db = SQLite.openDatabaseSync('dreams.db');

export function useDreams({ search = '', favoritesOnly = false }) {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    const loadDreams = () => {
      const fetchedDreams = getDreams(search, favoritesOnly);
      setDreams(fetchedDreams);
    };

    loadDreams();

    const subscription = SQLite.addDatabaseChangeListener(
      ({ databaseName, databaseFilePath, tableName, rowId }) => {
        if (databaseName === 'dreams.db' && tableName === 'dreams') {
          loadDreams();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [search, favoritesOnly]);

  return dreams;
}