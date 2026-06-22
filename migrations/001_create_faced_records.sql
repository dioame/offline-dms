-- migration: 001_create_faced_records
CREATE TABLE IF NOT EXISTS faced_records (
  uuid TEXT PRIMARY KEY,
  barangay TEXT NOT NULL,
  city_municipality TEXT,
  province TEXT,
  date_registered TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faced_barangay ON faced_records(barangay);

CREATE INDEX IF NOT EXISTS idx_faced_province ON faced_records(province);
