import { open, type DB } from '@op-engineering/op-sqlite';
import type { Dream, Intention, Tag, SyncDreamPayload } from '../types';
import { runMigrations } from './migrations';
import { emit, DB_CHANGE } from './events';

let db: DB | null = null;

export function initDatabase(encryptionKey: string): void {
  if (db) return;
  // Pass the key in SQLCipher raw-key format (x'<64 hex>') so SQLCipher uses it
  // directly instead of running 256k PBKDF2 iterations on every cold start.
  // The key from generateRandomKey() is always 32 bytes / 64 hex chars.
  db = open({ name: 'dreams.db', encryptionKey: `x'${encryptionKey}'` });
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
  const searchPattern = `%${search}%`;

  if (search.trim()) {
    // Search dreams by content AND also include all dreams from dates
    // where the intention matches the search term
    const query = `
      SELECT DISTINCT d.* FROM dreams d
      LEFT JOIN intentions i ON substr(d.dateCreated, 1, 10) = i.date
      WHERE (d.isDeleted = 0 OR d.isDeleted IS NULL)
        AND (d.content LIKE ? OR i.content LIKE ?)
        ${favoritesOnly ? 'AND d.isFavorite = 1' : ''}
      ORDER BY d.dateCreated DESC
    `;
    const result = getDb().executeSync(query, [searchPattern, searchPattern]);
    return (result.rows ?? []).map((row: any) => attachTags(rowToDream(row)));
  }

  let query = 'SELECT * FROM dreams WHERE (isDeleted = 0 OR isDeleted IS NULL)';
  if (favoritesOnly) {
    query += ' AND isFavorite = 1';
  }
  query += ' ORDER BY dateCreated DESC';

  const result = getDb().executeSync(query);
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

export const addDream = (content: string, title?: string, notes?: string, dateCreated?: Date): Dream => {
  const now = new Date().toISOString();
  const created = dateCreated ? dateCreated.toISOString() : now;
  const uuid = generateUUID();
  const result = getDb().executeSync(
    'INSERT INTO dreams (content, dateCreated, dateModified, title, notes, uuid) VALUES (?, ?, ?, ?, ?, ?)',
    [content, created, now, title ?? null, notes ?? null, uuid]
  );
  emit(DB_CHANGE);
  return {
    id: result.insertId!,
    content,
    dateCreated: new Date(created),
    dateModified: new Date(now),
    isFavorite: false,
    title: title ?? null,
    notes: notes ?? null,
    uuid,
    tags: [],
  };
};

export const updateDream = (dream: Dream): void => {
  const now = new Date().toISOString();
  getDb().executeSync(
    'UPDATE dreams SET content = ?, dateCreated = ?, dateModified = ?, isFavorite = ?, title = ?, notes = ? WHERE id = ?',
    [dream.content, dream.dateCreated.toISOString(), now, dream.isFavorite ? 1 : 0, dream.title, dream.notes, dream.id]
  );
  emit(DB_CHANGE);
};

// Intention operations

export const getIntentionForDate = (date: string): Intention | null => {
  const result = getDb().executeSync('SELECT * FROM intentions WHERE date = ?', [date]);
  const row = result.rows?.[0] as any;
  if (!row) return null;
  return {
    ...row,
    dateCreated: new Date(row.dateCreated),
    dateModified: new Date(row.dateModified),
  };
};

export const setIntention = (date: string, content: string): Intention => {
  const now = new Date().toISOString();
  const trimmed = content.trim();
  const existing = getIntentionForDate(date);
  if (existing) {
    if (trimmed) {
      getDb().executeSync(
        'UPDATE intentions SET content = ?, dateModified = ? WHERE id = ?',
        [trimmed, now, existing.id]
      );
      emit(DB_CHANGE);
      return { ...existing, content: trimmed, dateModified: new Date(now) };
    }
    // Empty content — delete the intention
    getDb().executeSync('DELETE FROM intentions WHERE id = ?', [existing.id]);
    emit(DB_CHANGE);
    return existing;
  }
  if (!trimmed) return { id: 0, date, content: '', dateCreated: new Date(now), dateModified: new Date(now) };
  const result = getDb().executeSync(
    'INSERT INTO intentions (date, content, dateCreated, dateModified) VALUES (?, ?, ?, ?)',
    [date, trimmed, now, now]
  );
  emit(DB_CHANGE);
  return { id: result.insertId!, date, content: trimmed, dateCreated: new Date(now), dateModified: new Date(now) };
};

export const getIntentionsForDates = (dates: string[]): Map<string, Intention> => {
  if (dates.length === 0) return new Map();
  const placeholders = dates.map(() => '?').join(',');
  const result = getDb().executeSync(
    `SELECT * FROM intentions WHERE date IN (${placeholders})`,
    dates
  );
  const map = new Map<string, Intention>();
  for (const row of (result.rows ?? []) as any[]) {
    map.set(row.date, {
      ...row,
      dateCreated: new Date(row.dateCreated),
      dateModified: new Date(row.dateModified),
    });
  }
  return map;
};

export const toggleFavorite = (id: number): void => {
  getDb().executeSync(
    'UPDATE dreams SET isFavorite = ((isFavorite | 1) - (isFavorite & 1)), dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
  emit(DB_CHANGE);
};

export const deleteDream = (id: number): void => {
  getDb().executeSync(
    'UPDATE dreams SET isDeleted = 1, dateModified = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
  emit(DB_CHANGE);
};

// Tag operations

export const getAllTags = (): Tag[] => {
  const result = getDb().executeSync('SELECT * FROM tags ORDER BY name');
  return (result.rows ?? []) as unknown as Tag[];
};

export const getRecentTags = (limit: number = 10): Tag[] => {
  // Try recent first, fall back to all tags if none have been used since migration v5
  const result = getDb().executeSync(
    'SELECT * FROM tags ORDER BY CASE WHEN last_used_at IS NULL THEN 1 ELSE 0 END, last_used_at DESC, name ASC LIMIT ?',
    [limit]
  );
  return (result.rows ?? []) as unknown as Tag[];
};

export const searchTags = (query: string): Tag[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const result = getDb().executeSync(
    'SELECT * FROM tags WHERE name LIKE ? ORDER BY CASE WHEN last_used_at IS NULL THEN 1 ELSE 0 END, last_used_at DESC, name ASC LIMIT 10',
    [`%${trimmed}%`]
  );
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
  const now = new Date().toISOString();
  getDb().executeSync('DELETE FROM dream_tags WHERE dream_id = ?', [dreamId]);
  const tags: Tag[] = [];
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = getOrCreateTag(name);
    getDb().executeSync('INSERT INTO dream_tags (dream_id, tag_id) VALUES (?, ?)', [dreamId, tag.id]);
    getDb().executeSync('UPDATE tags SET last_used_at = ? WHERE id = ?', [now, tag.id]);
    tags.push(tag);
  }
  emit(DB_CHANGE);
  return tags;
};

// Bulk operations

export const addDreamBulk = (dreams: { content: string; title?: string; dateCreated?: string }[]): number[] => {
  const d = getDb();
  const ids: number[] = [];
  d.executeSync('BEGIN TRANSACTION');
  try {
    for (const dream of dreams) {
      const now = new Date().toISOString();
      const created = dream.dateCreated ?? now;
      const uuid = generateUUID();
      const result = d.executeSync(
        'INSERT INTO dreams (content, dateCreated, dateModified, title, uuid) VALUES (?, ?, ?, ?, ?)',
        [dream.content, created, now, dream.title ?? null, uuid]
      );
      if (result.insertId != null) ids.push(result.insertId);
    }
    d.executeSync('COMMIT');
    emit(DB_CHANGE);
  } catch (e) {
    d.executeSync('ROLLBACK');
    throw e;
  }
  return ids;
};

// Import history operations

export interface ImportRecord {
  id: number;
  content_hash: string;
  filename: string;
  imported_at: string;
  entry_count: number;
  dream_ids: number[];
}

export const findImportByHash = (hash: string): ImportRecord | null => {
  const result = getDb().executeSync(
    'SELECT * FROM import_history WHERE content_hash = ? ORDER BY imported_at DESC LIMIT 1',
    [hash]
  );
  const row = result.rows?.[0] as any;
  if (!row) return null;
  return {
    ...row,
    dream_ids: JSON.parse(row.dream_ids),
  };
};

export const recordImport = (hash: string, filename: string, dreamIds: number[]): void => {
  getDb().executeSync(
    'INSERT INTO import_history (content_hash, filename, imported_at, entry_count, dream_ids) VALUES (?, ?, ?, ?, ?)',
    [hash, filename, new Date().toISOString(), dreamIds.length, JSON.stringify(dreamIds)]
  );
};

export const deleteImportedDreams = (dreamIds: number[]): void => {
  if (dreamIds.length === 0) return;
  const d = getDb();
  d.executeSync('BEGIN TRANSACTION');
  try {
    for (const id of dreamIds) {
      d.executeSync('DELETE FROM dream_tags WHERE dream_id = ?', [id]);
      d.executeSync('DELETE FROM dreams WHERE id = ?', [id]);
    }
    d.executeSync('COMMIT');
    emit(DB_CHANGE);
  } catch (e) {
    d.executeSync('ROLLBACK');
    throw e;
  }
};

export const deleteImportRecord = (id: number): void => {
  getDb().executeSync('DELETE FROM import_history WHERE id = ?', [id]);
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
        `UPDATE dreams SET content = ?, title = ?, notes = ?,
         isFavorite = ?, dateModified = ?, isDeleted = ?, lastSyncedAt = ?
         WHERE uuid = ?`,
        [
          payload.content, payload.title, payload.notes,
          payload.isFavorite ? 1 : 0, payload.dateModified,
          payload.isDeleted ? 1 : 0, new Date().toISOString(),
          payload.uuid,
        ]
      );
      if (payload.tags.length > 0) {
        setDreamTags(existing.id, payload.tags);
      }
      if (payload.intention) {
        const date = payload.dateCreated.substring(0, 10);
        setIntention(date, payload.intention);
      }
    }
  } else {
    const uuid = payload.uuid;
    const result = getDb().executeSync(
      `INSERT INTO dreams (content, dateCreated, dateModified, isFavorite, title, notes, uuid, isDeleted, lastSyncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.content, payload.dateCreated, payload.dateModified,
        payload.isFavorite ? 1 : 0, payload.title, payload.notes,
        uuid, payload.isDeleted ? 1 : 0, new Date().toISOString(),
      ]
    );
    if (payload.tags.length > 0) {
      setDreamTags(result.insertId!, payload.tags);
    }
    if (payload.intention) {
      const date = payload.dateCreated.substring(0, 10);
      setIntention(date, payload.intention);
    }
  }
  emit(DB_CHANGE);
};
