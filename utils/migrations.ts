import type { DB } from '@op-engineering/op-sqlite';

type Migration = {
  version: number;
  up: (db: DB) => void;
};

const migrations: Migration[] = [
  // v1 is the initial schema created in createSchema() — no migration needed.
  // Future migrations go here, e.g.:
  // {
  //   version: 2,
  //   up: (db) => {
  //     db.executeSync('ALTER TABLE dreams ADD COLUMN newField TEXT');
  //   },
  // },
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
