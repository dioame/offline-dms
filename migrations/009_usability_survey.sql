-- Encoder feedback survey responses (replaces any legacy usability_survey table)
DROP TABLE IF EXISTS usability_survey_responses;

CREATE TABLE usability_survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  municipality TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at
  ON usability_survey_responses (created_at);

CREATE INDEX IF NOT EXISTS idx_survey_responses_municipality
  ON usability_survey_responses (municipality);
