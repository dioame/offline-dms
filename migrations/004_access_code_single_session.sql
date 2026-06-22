-- Bind each code to a single device session (one-time use)
ALTER TABLE access_codes ADD COLUMN session_id TEXT;
ALTER TABLE access_codes ADD COLUMN used_at TEXT;
