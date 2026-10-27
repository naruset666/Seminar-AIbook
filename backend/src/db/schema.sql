-- Reading Soundscape - Phase 1 schema (see CLAUDE.md section 11)
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presets (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  level         TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  pleasantness  REAL NOT NULL DEFAULT 0,   -- -1..1, used by phase 2 recommender
  eventfulness  REAL NOT NULL DEFAULT 0,   -- -1..1, used by phase 2 recommender
  tags          TEXT[] NOT NULL DEFAULT '{}',  -- sound characteristics matched by the questionnaire
  sort_order    INT NOT NULL DEFAULT 0
);
-- Columns added after the first release; no-ops on fresh databases.
ALTER TABLE presets ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE presets ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sound_layers (
  id              TEXT PRIMARY KEY,
  preset_id       TEXT NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  default_volume  REAL NOT NULL DEFAULT 0.5,
  default_pan     REAL NOT NULL DEFAULT 0,
  source_type     TEXT NOT NULL DEFAULT 'library' CHECK (source_type IN ('library', 'generated')),
  prompt          TEXT,
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id                     SERIAL PRIMARY KEY,
  user_id                INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers                JSONB NOT NULL,
  score                  INT NOT NULL,
  level                  TEXT NOT NULL,
  recommended_preset_id  TEXT REFERENCES presets(id),
  label                  TEXT,                          -- user-given mood name, e.g. "อ่านสอบ"
  chosen_preset_id       TEXT REFERENCES presets(id),   -- place the user picked from this result
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questionnaire_user ON questionnaire_responses (user_id, created_at DESC);
-- Saved-preferences columns added after the first release; no-ops on fresh databases.
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS chosen_preset_id TEXT REFERENCES presets(id);
UPDATE questionnaire_responses SET chosen_preset_id = recommended_preset_id WHERE chosen_preset_id IS NULL;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id             INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_preset_id   TEXT REFERENCES presets(id),
  layer_settings      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {layer_id: {volume, pan, muted}}
  open_tabs           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [document_id, ...]
  active_tab_doc_id   INT
);

CREATE TABLE IF NOT EXISTS documents (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name   TEXT NOT NULL,
  stored_path     TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  page_count      INT,
  last_page       INT NOT NULL DEFAULT 1,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_opened_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents (user_id, uploaded_at DESC);

-- Highlighter / pen strokes drawn on a document, one row per document.
-- strokes: {"<page number>": [{tool, color, width, points: [[x, y], ...]}]}
-- Coordinates are PDF.js viewport units at scale 1 (top-left origin).
CREATE TABLE IF NOT EXISTS document_annotations (
  document_id  INT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  strokes      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
