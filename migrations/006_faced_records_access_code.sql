-- migration: 006_faced_records_access_code
ALTER TABLE faced_records ADD COLUMN access_code TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_faced_access_code ON faced_records(access_code);
