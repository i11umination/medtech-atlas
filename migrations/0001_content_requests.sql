CREATE TABLE IF NOT EXISTS content_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('disease', 'clinical_problem', 'domain', 'technology', 'research', 'other')),
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  depth TEXT NOT NULL CHECK (depth IN ('plain', 'research', 'evidence')),
  source_hint TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'classified', 'queued', 'researching', 'medical-review', 'published', 'duplicate', 'rejected', 'needs-clarification')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_requests_status_created
  ON content_requests (status, created_at DESC);
