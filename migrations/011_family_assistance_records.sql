-- migration: 011_family_assistance_records
CREATE TABLE IF NOT EXISTS family_assistance_record (
  uuid TEXT PRIMARY KEY,
  faced_record_uuid TEXT NOT NULL,
  access_code TEXT NOT NULL DEFAULT '',
  date_provided TEXT NOT NULL,
  receiving_member_name TEXT NOT NULL,
  assistance_received TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  quantity TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_assistance_faced_uuid
  ON family_assistance_record(faced_record_uuid);

CREATE INDEX IF NOT EXISTS idx_family_assistance_date
  ON family_assistance_record(date_provided);
