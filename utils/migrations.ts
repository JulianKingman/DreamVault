import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dreams.db');

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => void;
};

const migrations: Migration[] = [
  {
    version: 2,
    up: (db) => {
      db.execSync(`ALTER TABLE dreams ADD COLUMN title TEXT`);
      db.execSync(`ALTER TABLE dreams ADD COLUMN intention TEXT`);
      db.execSync(`ALTER TABLE dreams ADD COLUMN notes TEXT`);
      db.execSync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL
        )
      `);
      db.execSync(`
        CREATE TABLE IF NOT EXISTS dream_tags (
          dream_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (dream_id, tag_id),
          FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `);
    },
  },
  {
    version: 3,
    up: (db) => {
      db.execSync(`ALTER TABLE dreams ADD COLUMN uuid TEXT`);
      db.execSync(`ALTER TABLE dreams ADD COLUMN lastSyncedAt TEXT`);
      db.execSync(`ALTER TABLE dreams ADD COLUMN isDeleted INTEGER DEFAULT 0`);
      // Backfill UUIDs for existing rows
      const rows = db.getAllSync<{ id: number }>('SELECT id FROM dreams WHERE uuid IS NULL');
      for (const row of rows) {
        const uuid = generateUUID();
        db.runSync('UPDATE dreams SET uuid = ? WHERE id = ?', [uuid, row.id]);
      }
      db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_dreams_uuid ON dreams(uuid)`);
    },
  },
  {
    version: 4,
    up: (db) => {
      db.execSync(`ALTER TABLE dreams ADD COLUMN isEncrypted INTEGER DEFAULT 0`);
    },
  },
];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const runMigrations = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    )
  `);

  const row = db.getFirstSync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version'
  );
  const currentVersion = row?.version ?? 1;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.runSync('INSERT INTO schema_version (version) VALUES (?)', [
        migration.version,
      ]);
    }
  }
};
