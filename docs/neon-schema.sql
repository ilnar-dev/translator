-- Sessions table for Neon Postgres
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  translations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_last_updated
  ON sessions (last_updated);

