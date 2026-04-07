import { open, type DB } from '@op-engineering/op-sqlite';
import type { Dream, Tag, SyncDreamPayload } from '../types';
import { runMigrations } from './migrations';

let db: DB | null = null;

export function initDatabase(encryptionKey: string): void {
  if (db) return;
  db = open({ name: 'dreams.db', encryptionKey });
  createSchema();
  runMigrations(db);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDb(): DB {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

function createSchema(): void {
  if (!db) return;
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      dateCreated TEXT,
      dateModified TEXT,
      isFavorite INTEGER DEFAULT 0,
      title TEXT,
      intention TEXT,
      notes TEXT,
      uuid TEXT UNIQUE,
      lastSyncedAt TEXT,
      isDeleted INTEGER DEFAULT 0
    )
  `);
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS dream_tags (
      dream_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (dream_id, tag_id),
      FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
  db.executeSync('CREATE UNIQUE INDEX IF NOT EXISTS idx_dreams_uuid ON dreams(uuid)');
}

// Helpers

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function rowToDream(row: any): Dream {
  return {
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
  };
}

export function attachTags(dream: Dream): Dream {
  const result = getDb().executeSync(
    `SELECT t.id, t.name FROM tags t
     JOIN dream_tags dt ON dt.tag_id = t.id
     WHERE dt.dream_id = ?`,
    [dream.id]
  );
  return { ...dream, tags: (result.rows ?? []) as unknown as Tag[] };
}

// Read operations

export const getDreams = (search = '', favoritesOnly = false): Dream[] => {
  let query = 'SELECT * FROM dreams WHERE content LIKE ? AND (isDeleted = 0 OR isDeleted IS NULL)';
  const params: (string | number)[] = [`%${search}%`];

  if (favoritesOnly) {
    query += ' AND isFavorite = 1';
  }

  query += ' ORDER BY dateModified DESC';

  const result = getDb().executeSync(query, params);
  return (result.rows ?? []).map((row: any) => attachTags(rowToDream(row)));
};

export const getDreamById = (id: number): Dream | null => {
  const result = getDb().executeSync('SELECT * FROM dreams WHERE id = ?', [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  return attachTags(rowToDream(row));
};

export const getDreamByUUID = (uuid: string): Dream | null => {
  const result = getDb().executeSync('SELECT * FROM dreams WHERE uuid = ?', [uuid]);
  const row = result.rows?.[0];
  if (!row) return null;
  return attachTags(rowToDream(row));
};

// Write operations

export const addDream = (content: string, title?: string, intention?: string, notes?: string): Dream => {
  const now = new Date().toISOString();
  const uuid = generateUUID();
  const result = getDb().executeSync(
    'INSERT INTO dreams (content, dateCreated, dateModified, title, intention, notes, uuid) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [content, now, now, title ?? null, intention ?? null, notes ?? null, uuid]
  );
  return {
    id: result.insertId!,
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
  getDb().executeSync(
    'UPDATE dreams SET content = ?, dateModified = ?, isFavorite = ?, title = ?, intention = ?, notes = ? WHERE id = ?',
    [dream.content, now, dream.isFavorite ? 1 : 0, dream.title, dream.intention, dream.notes, dream.id]
  );
};

export const toggleFavorite = (id: number): void => {
  getDb().executeSync(
    'UPDATE dreams SET isFavorite = ((isFavorite | 1) - (isFavorite & 1)), dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

export const deleteDream = (id: number): void => {
  getDb().executeSync(
    'UPDATE dreams SET isDeleted = 1, dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

// Tag operations

export const getAllTags = (): Tag[] => {
  const result = getDb().executeSync('SELECT * FROM tags ORDER BY name');
  return (result.rows ?? []) as unknown as Tag[];
};

export const getOrCreateTag = (name: string): Tag => {
  const trimmed = name.trim().toLowerCase();
  const existing = getDb().executeSync('SELECT * FROM tags WHERE name = ?', [trimmed]);
  if (existing.rows?.[0]) return existing.rows[0] as unknown as Tag;

  const result = getDb().executeSync('INSERT INTO tags (name) VALUES (?)', [trimmed]);
  return { id: result.insertId!, name: trimmed };
};

export const setDreamTags = (dreamId: number, tagNames: string[]): Tag[] => {
  getDb().executeSync('DELETE FROM dream_tags WHERE dream_id = ?', [dreamId]);
  const tags: Tag[] = [];
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = getOrCreateTag(name);
    getDb().executeSync('INSERT INTO dream_tags (dream_id, tag_id) VALUES (?, ?)', [dreamId, tag.id]);
    tags.push(tag);
  }
  return tags;
};

// Bulk operations

export const addDreamBulk = (dreams: { content: string; title?: string; dateCreated?: string }[]): void => {
  const d = getDb();
  d.executeSync('BEGIN TRANSACTION');
  try {
    for (const dream of dreams) {
      const now = new Date().toISOString();
      const created = dream.dateCreated ?? now;
      const uuid = generateUUID();
      d.executeSync(
        'INSERT INTO dreams (content, dateCreated, dateModified, title, uuid) VALUES (?, ?, ?, ?, ?)',
        [dream.content, created, now, dream.title ?? null, uuid]
      );
    }
    d.executeSync('COMMIT');
  } catch (e) {
    d.executeSync('ROLLBACK');
    throw e;
  }
};

// Sync operations

export const getModifiedSince = (since: Date): Dream[] => {
  const result = getDb().executeSync(
    'SELECT * FROM dreams WHERE dateModified > ? ORDER BY dateModified ASC',
    [since.toISOString()]
  );
  return (result.rows ?? []).map((row: any) => attachTags(rowToDream(row)));
};

export const markSynced = (ids: number[]): void => {
  const now = new Date().toISOString();
  for (const id of ids) {
    getDb().executeSync('UPDATE dreams SET lastSyncedAt = ? WHERE id = ?', [now, id]);
  }
};

export const upsertFromSync = (payload: SyncDreamPayload): void => {
  const existing = getDreamByUUID(payload.uuid);
  if (existing) {
    const remoteModified = new Date(payload.dateModified);
    if (remoteModified > existing.dateModified) {
      getDb().executeSync(
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
    const uuid = payload.uuid;
    const result = getDb().executeSync(
      `INSERT INTO dreams (content, dateCreated, dateModified, isFavorite, title, intention, notes, uuid, isDeleted, lastSyncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.content, payload.dateCreated, payload.dateModified,
        payload.isFavorite ? 1 : 0, payload.title, payload.intention, payload.notes,
        uuid, payload.isDeleted ? 1 : 0, new Date().toISOString(),
      ]
    );
    if (payload.tags.length > 0) {
      setDreamTags(result.insertId!, payload.tags);
    }
  }
};
