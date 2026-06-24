-- migration: 007_soft_delete_faced_records
ALTER TABLE faced_records ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_faced_deleted_at ON faced_records(deleted_at);
