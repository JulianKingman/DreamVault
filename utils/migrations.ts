import type { DB } from '@op-engineering/op-sqlite';

type Migration = {
  version: number;
  up: (db: DB) => void;
};

const migrations: Migration[] = [
  // v1 is the initial schema created in createSchema() — no migration needed.
  {
    version: 2,
    up: (db) => {
      db.executeSync(`
        CREATE TABLE IF NOT EXISTS import_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_hash TEXT NOT NULL,
          filename TEXT NOT NULL,
          imported_at TEXT NOT NULL,
          entry_count INTEGER NOT NULL,
          dream_ids TEXT NOT NULL
        )
      `);
      db.executeSync(
        'CREATE INDEX IF NOT EXISTS idx_import_hash ON import_history(content_hash)'
      );
    },
  },
  {
    version: 3,
    up: (db) => {
      db.executeSync(`ALTER TABLE dreams ADD COLUMN isEncrypted INTEGER DEFAULT 0`);
    },
  },
  {
    version: 4,
    up: (db) => {
      db.executeSync(`ALTER TABLE dreams ADD COLUMN imageUri TEXT`);
    },
  },
  {
    version: 5,
    up: (db) => {
      db.executeSync(`ALTER TABLE tags ADD COLUMN last_used_at TEXT`);
    },
  },
  {
    version: 6,
    up: (db) => {
      // Seed common dream vibes
      const seeds = [
        'lucid', 'nightmare', 'recurring', 'flying', 'falling',
        'chasing', 'water', 'animals', 'people', 'places',
        'surreal', 'vivid', 'peaceful', 'anxious', 'prophetic',
        'childhood', 'adventure', 'transformation', 'spiritual', 'symbolic',
      ];
      for (const name of seeds) {
        db.executeSync('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
      }
    },
  },
  {
    version: 7,
    up: (db) => {
      // Create intentions table
      db.executeSync(`
        CREATE TABLE IF NOT EXISTS intentions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          dateCreated TEXT NOT NULL,
          dateModified TEXT NOT NULL
        )
      `);
      // The `intention` column only exists on databases that were created
      // before it was removed from createSchema(). On fresh installs the column
      // never existed, so we'd hit "no such column: intention" if we ran the
      // copy-then-drop blindly. Check first.
      const columns = db.executeSync(`PRAGMA table_info(dreams)`);
      const hasIntention = (columns.rows ?? []).some(
        (r: any) => r.name === 'intention',
      );
      if (!hasIntention) return;

      // Migrate existing intentions from dreams into the new table.
      // For each date, take the first non-empty intention.
      db.executeSync(`
        INSERT OR IGNORE INTO intentions (date, content, dateCreated, dateModified)
        SELECT
          substr(dateCreated, 1, 10) as date,
          intention,
          MIN(dateCreated) as dateCreated,
          MIN(dateCreated) as dateModified
        FROM dreams
        WHERE intention IS NOT NULL AND intention != '' AND isDeleted = 0
        GROUP BY substr(dateCreated, 1, 10)
      `);
      db.executeSync(`ALTER TABLE dreams DROP COLUMN intention`);
    },
  },
];

export function runMigrations(db: DB): void {
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    )
  `);

  const result = db.executeSync('SELECT MAX(version) as version FROM schema_version');
  const currentVersion = (result.rows?.[0] as any)?.version ?? 1;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.executeSync('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
    }
  }
}
