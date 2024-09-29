import * as SQLite from 'expo-sqlite';
import type { Dream } from '../types';

const db = SQLite.openDatabaseSync('dreams.db');

export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      dateCreated TEXT,
      dateModified TEXT,
      isFavorite INTEGER DEFAULT 0
    )
  `);
};

export const getDreams = (search = '', favoritesOnly = false): Dream[] => {
  let query = 'SELECT * FROM dreams WHERE content LIKE ?';
  const params: string[] = [`%${search}%`];

  if (favoritesOnly) {
    query += ' AND isFavorite = 1';
  }

  query += ' ORDER BY dateModified DESC';

  const result = db.getAllSync<Dream>(query, params);
  return result.map(row => ({
    ...row,
    dateCreated: new Date(row.dateCreated),
    dateModified: new Date(row.dateModified),
    isFavorite: Boolean(row.isFavorite),
  }));
};

export const addDream = (content: string): Dream => {
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO dreams (content, dateCreated, dateModified) VALUES (?, ?, ?) RETURNING id',
    [content, now, now]
  );
  const newDream: Dream = {
    id: result.lastInsertRowId,
    content,
    dateCreated: new Date(now),
    dateModified: new Date(now),
    isFavorite: false,
  };
  return newDream;
};

export const updateDream = (dream: Dream): void => {
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE dreams SET content = ?, dateModified = ?, isFavorite = ? WHERE id = ?',
    [dream.content, now, dream.isFavorite ? 1 : 0, dream.id]
  );
};

export const toggleFavorite = (id: number): void => {
  db.runSync(
    'UPDATE dreams SET isFavorite = ((isFavorite | 1) - (isFavorite & 1)) WHERE id = ?',
    [id]
  );
};