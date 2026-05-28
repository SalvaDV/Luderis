-- ═══════════════════════════════════════════════════════════════════════════
-- Shikaku puzzle results
-- Stores the outcome of each daily Shikaku puzzle per user.
-- Puzzle data lives entirely on the client (deterministic generator),
-- so we only need the date to identify which puzzle was played.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE shikaku_results (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id   uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_date  date        NOT NULL,
  time_seconds integer,
  completed_at timestamptz DEFAULT now(),

  UNIQUE (usuario_id, puzzle_date)
);

-- Fast lookup for "did I already solve today?"
CREATE INDEX idx_shikaku_results_user_date
  ON shikaku_results (usuario_id, puzzle_date DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE shikaku_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shikaku_select_own" ON shikaku_results
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "shikaku_insert_own" ON shikaku_results
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- No UPDATE/DELETE — results are immutable
