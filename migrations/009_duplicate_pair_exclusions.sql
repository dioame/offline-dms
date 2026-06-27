-- Admin-verified pairs that share first+last name but are distinct families
CREATE TABLE IF NOT EXISTS duplicate_pair_exclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid_a TEXT NOT NULL,
  uuid_b TEXT NOT NULL,
  name_key TEXT NOT NULL,
  excluded_at TEXT NOT NULL,
  excluded_by TEXT NOT NULL DEFAULT 'admin',
  note TEXT NOT NULL DEFAULT '',
  UNIQUE(uuid_a, uuid_b)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_pair_exclusions_name_key
  ON duplicate_pair_exclusions(name_key);

CREATE INDEX IF NOT EXISTS idx_duplicate_pair_exclusions_uuid_a
  ON duplicate_pair_exclusions(uuid_a);

CREATE INDEX IF NOT EXISTS idx_duplicate_pair_exclusions_uuid_b
  ON duplicate_pair_exclusions(uuid_b);
