-- Admin-managed evacuation center sites (per municipality + barangay)
CREATE TABLE IF NOT EXISTS ec_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  site_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ec_library_location
  ON ec_library(city_municipality, barangay);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ec_library_unique_site
  ON ec_library(city_municipality, barangay, site_name);
