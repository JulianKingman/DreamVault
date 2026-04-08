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
