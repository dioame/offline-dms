-- migration: 002_add_enumerator_name
ALTER TABLE faced_records ADD COLUMN enumerator_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_faced_enumerator ON faced_records(enumerator_name);
