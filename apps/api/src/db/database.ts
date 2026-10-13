import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync as SqliteDatabaseSync } from 'node:sqlite';

export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const database = new SqliteDatabaseSync(path);
  database.exec(`CREATE TABLE IF NOT EXISTS property (
  id           TEXT PRIMARY KEY,
  street       TEXT NOT NULL,
  city         TEXT NOT NULL COLLATE NOCASE,
  state        TEXT NOT NULL CHECK (length(state) = 2),
  zip_code     TEXT NOT NULL CHECK (length(zip_code) = 5),
  lat          REAL NOT NULL,
  long         REAL NOT NULL,
  weather_data TEXT NOT NULL CHECK (json_valid(weather_data)),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;
CREATE INDEX IF NOT EXISTS property_city     ON property (city);
CREATE INDEX IF NOT EXISTS property_state    ON property (state);
CREATE INDEX IF NOT EXISTS property_zip_code ON property (zip_code);`);
  return database;
}
