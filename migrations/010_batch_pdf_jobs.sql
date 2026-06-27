CREATE TABLE IF NOT EXISTS batch_pdf_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  logs TEXT NOT NULL DEFAULT '[]',
  filename TEXT NOT NULL,
  area_label TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  token TEXT NOT NULL,
  payload TEXT,
  pdf_data BLOB,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batch_pdf_jobs_status ON batch_pdf_jobs (status, updated_at);
