-- Access codes for enumerator login
CREATE TABLE IF NOT EXISTS access_codes (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  rejected_at TEXT,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);
