import * as SQLite from 'expo-sqlite';
import { Dream } from '../types';

const db = SQLite.openDatabaseSync('dreams.db');

export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      dateCreated TEXT,
      dateModified TEXT
    )
  `);
};

export const getDreams = (): Dream[] => {
  const result = db.executeSync<Dream>('SELECT * FROM dreams ORDER BY dateModified DESC');
  return result.map(row => ({
    ...row,
    dateCreated: new Date(row.dateCreated),
    dateModified: new Date(row.dateModified),
  }));
};

export const addDream = (content: string): Dream => {
  const now = new Date().toISOString();
  const result = db.executeSync<{ id: number }>(
    'INSERT INTO dreams (content, dateCreated, dateModified) VALUES (?, ?, ?) RETURNING id',
    [content, now, now]
  );
  const newDream: Dream = {
    id: result[0].id.toString(),
    content,
    dateCreated: new Date(now),
    dateModified: new Date(now),
  };
  return newDream;
};

export const updateDream = (dream: Dream): void => {
  const now = new Date().toISOString();
  db.executeSync(
    'UPDATE dreams SET content = ?, dateModified = ? WHERE id = ?',
    [dream.content, now, dream.id]
  );
};