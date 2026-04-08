import * as SQLite from 'expo-sqlite';
import type { Dream, Tag, SyncDreamPayload } from '../types';
import { runMigrations } from './migrations';
import { encrypt, decrypt } from './crypto';

const db = SQLite.openDatabaseSync('dreams.db');

let initialized = false;

export const initDatabase = (): void => {
  if (initialized) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      dateCreated TEXT,
      dateModified TEXT,
      isFavorite INTEGER DEFAULT 0
    )
  `);
  // Ensure isFavorite exists on tables created before it was in the schema
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(dreams)`);
  const colNames = columns.map(c => c.name);
  if (!colNames.includes('isFavorite')) {
    db.execSync(`ALTER TABLE dreams ADD COLUMN isFavorite INTEGER DEFAULT 0`);
  }
  runMigrations();
  initialized = true;
};

// Eagerly initialize so queries never run against an unmigrated schema
initDatabase();

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const rowToDream = (row: any): Dream => ({
  ...row,
  dateCreated: new Date(row.dateCreated),
  dateModified: new Date(row.dateModified),
  isFavorite: Boolean(row.isFavorite),
  title: row.title ?? null,
  intention: row.intention ?? null,
  notes: row.notes ?? null,
  uuid: row.uuid ?? undefined,
  lastSyncedAt: row.lastSyncedAt ? new Date(row.lastSyncedAt) : null,
  isDeleted: Boolean(row.isDeleted),
});

const attachTags = (dream: Dream): Dream => {
  const tags = db.getAllSync<Tag>(
    `SELECT t.id, t.name FROM tags t
     JOIN dream_tags dt ON dt.tag_id = t.id
     WHERE dt.dream_id = ?`,
    [dream.id]
  );
  return { ...dream, tags };
};

export const getDreams = (search = '', favoritesOnly = false): Dream[] => {
  let query = 'SELECT * FROM dreams WHERE content LIKE ? AND (isDeleted = 0 OR isDeleted IS NULL)';
  const params: string[] = [`%${search}%`];

  if (favoritesOnly) {
    query += ' AND isFavorite = 1';
  }

  query += ' ORDER BY dateModified DESC';

  const result = db.getAllSync<any>(query, params);
  return result.map(row => attachTags(rowToDream(row)));
};

export const getDreamById = (id: number): Dream | null => {
  const row = db.getFirstSync<any>(
    'SELECT * FROM dreams WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return attachTags(rowToDream(row));
};

export const getDreamByUUID = (uuid: string): Dream | null => {
  const row = db.getFirstSync<any>(
    'SELECT * FROM dreams WHERE uuid = ?',
    [uuid]
  );
  if (!row) return null;
  return attachTags(rowToDream(row));
};

export const addDream = (content: string, title?: string, intention?: string, notes?: string): Dream => {
  const now = new Date().toISOString();
  const uuid = generateUUID();
  const result = db.runSync(
    'INSERT INTO dreams (content, dateCreated, dateModified, title, intention, notes, uuid) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [content, now, now, title ?? null, intention ?? null, notes ?? null, uuid]
  );
  return {
    id: result.lastInsertRowId,
    content,
    dateCreated: new Date(now),
    dateModified: new Date(now),
    isFavorite: false,
    title: title ?? null,
    intention: intention ?? null,
    notes: notes ?? null,
    uuid,
    tags: [],
  };
};

export const updateDream = (dream: Dream): void => {
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE dreams SET content = ?, dateModified = ?, isFavorite = ?, title = ?, intention = ?, notes = ? WHERE id = ?',
    [dream.content, now, dream.isFavorite ? 1 : 0, dream.title, dream.intention, dream.notes, dream.id]
  );
};

export const toggleFavorite = (id: number): void => {
  db.runSync(
    'UPDATE dreams SET isFavorite = ((isFavorite | 1) - (isFavorite & 1)), dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

export const deleteDream = (id: number): void => {
  // Soft-delete for sync support
  db.runSync(
    'UPDATE dreams SET isDeleted = 1, dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

// Tag operations

export const getAllTags = (): Tag[] => {
  return db.getAllSync<Tag>('SELECT * FROM tags ORDER BY name');
};

export const getOrCreateTag = (name: string): Tag => {
  const trimmed = name.trim().toLowerCase();
  const existing = db.getFirstSync<Tag>(
    'SELECT * FROM tags WHERE name = ?',
    [trimmed]
  );
  if (existing) return existing;

  const result = db.runSync('INSERT INTO tags (name) VALUES (?)', [trimmed]);
  return { id: result.lastInsertRowId, name: trimmed };
};

export const setDreamTags = (dreamId: number, tagNames: string[]): Tag[] => {
  db.runSync('DELETE FROM dream_tags WHERE dream_id = ?', [dreamId]);
  const tags: Tag[] = [];
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = getOrCreateTag(name);
    db.runSync('INSERT INTO dream_tags (dream_id, tag_id) VALUES (?, ?)', [dreamId, tag.id]);
    tags.push(tag);
  }
  return tags;
};

// Bulk operations

export const addDreamBulk = (dreams: { content: string; title?: string; dateCreated?: string }[]): void => {
  db.execSync('BEGIN TRANSACTION');
  try {
    for (const dream of dreams) {
      const now = new Date().toISOString();
      const created = dream.dateCreated ?? now;
      const uuid = generateUUID();
      db.runSync(
        'INSERT INTO dreams (content, dateCreated, dateModified, title, uuid) VALUES (?, ?, ?, ?, ?)',
        [dream.content, created, now, dream.title ?? null, uuid]
      );
    }
    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
};

// Sync operations

export const getModifiedSince = (since: Date): Dream[] => {
  const result = db.getAllSync<any>(
    'SELECT * FROM dreams WHERE dateModified > ? ORDER BY dateModified ASC',
    [since.toISOString()]
  );
  return result.map(row => attachTags(rowToDream(row)));
};

export const markSynced = (ids: number[]): void => {
  const now = new Date().toISOString();
  for (const id of ids) {
    db.runSync('UPDATE dreams SET lastSyncedAt = ? WHERE id = ?', [now, id]);
  }
};

// Encryption operations

export async function encryptDream(id: number): Promise<void> {
  const row = db.getFirstSync<any>('SELECT * FROM dreams WHERE id = ?', [id]);
  if (!row || row.isEncrypted) return;

  const encContent = row.content ? await encrypt(row.content) : null;
  const encTitle = row.title ? await encrypt(row.title) : null;
  const encIntention = row.intention ? await encrypt(row.intention) : null;
  const encNotes = row.notes ? await encrypt(row.notes) : null;

  db.runSync(
    'UPDATE dreams SET content = ?, title = ?, intention = ?, notes = ?, isEncrypted = 1 WHERE id = ?',
    [encContent, encTitle, encIntention, encNotes, id]
  );
}

export async function decryptDreamFields(dream: Dream): Promise<Dream> {
  const row = db.getFirstSync<any>('SELECT isEncrypted FROM dreams WHERE id = ?', [dream.id]);
  if (!row?.isEncrypted) return dream;

  return {
    ...dream,
    content: dream.content ? await decrypt(dream.content) : dream.content,
    title: dream.title ? await decrypt(dream.title) : dream.title,
    intention: dream.intention ? await decrypt(dream.intention) : dream.intention,
    notes: dream.notes ? await decrypt(dream.notes) : dream.notes,
  };
}

export async function encryptAllDreams(onProgress?: (done: number, total: number) => void): Promise<number> {
  const rows = db.getAllSync<{ id: number }>('SELECT id FROM dreams WHERE isEncrypted = 0 OR isEncrypted IS NULL');
  let done = 0;
  for (const row of rows) {
    await encryptDream(row.id);
    done++;
    onProgress?.(done, rows.length);
  }
  return done;
}

export const upsertFromSync = (payload: SyncDreamPayload): void => {
  const existing = getDreamByUUID(payload.uuid);
  if (existing) {
    // Last-write-wins: only update if remote is newer
    const remoteModified = new Date(payload.dateModified);
    if (remoteModified > existing.dateModified) {
      db.runSync(
        `UPDATE dreams SET content = ?, title = ?, intention = ?, notes = ?,
         isFavorite = ?, dateModified = ?, isDeleted = ?, lastSyncedAt = ?
         WHERE uuid = ?`,
        [
          payload.content, payload.title, payload.intention, payload.notes,
          payload.isFavorite ? 1 : 0, payload.dateModified,
          payload.isDeleted ? 1 : 0, new Date().toISOString(),
          payload.uuid,
        ]
      );
      if (payload.tags.length > 0) {
        setDreamTags(existing.id, payload.tags);
      }
    }
  } else {
    // Insert new dream from cloud
    const uuid = payload.uuid;
    const result = db.runSync(
      `INSERT INTO dreams (content, dateCreated, dateModified, isFavorite, title, intention, notes, uuid, isDeleted, lastSyncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.content, payload.dateCreated, payload.dateModified,
        payload.isFavorite ? 1 : 0, payload.title, payload.intention, payload.notes,
        uuid, payload.isDeleted ? 1 : 0, new Date().toISOString(),
      ]
    );
    if (payload.tags.length > 0) {
      setDreamTags(result.lastInsertRowId, payload.tags);
    }
  }
};
