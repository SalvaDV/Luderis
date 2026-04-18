-- ── Puzzles: one row per day ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS puzzles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date UNIQUE NOT NULL,
  grid_size   int  NOT NULL CHECK (grid_size BETWEEN 6 AND 10),
  -- regions: 2D array [row][col] → region index (0-based). Stored as JSON array of arrays.
  regions     jsonb NOT NULL,
  -- hints: array of [row, col] pairs that are pre-placed for the player
  hints       jsonb NOT NULL,
  -- solution: array of [row, col] per region (index = region index)
  solution    jsonb NOT NULL,
  difficulty  text NOT NULL CHECK (difficulty IN ('fácil','medio','difícil')),
  created_at  timestamptz DEFAULT now()
);

-- Any authenticated user can read puzzles (no private data here)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "puzzles_read_authenticated"
  ON puzzles FOR SELECT
  TO authenticated
  USING (true);

-- ── Puzzle results: one row per user per day ──────────────────────────────────
CREATE TABLE IF NOT EXISTS puzzle_results (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_id    uuid REFERENCES puzzles(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  time_seconds int NOT NULL CHECK (time_seconds >= 0),
  UNIQUE(user_id, puzzle_id)
);

ALTER TABLE puzzle_results ENABLE ROW LEVEL SECURITY;

-- Users can only read their own results
CREATE POLICY "results_read_own"
  ON puzzle_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own results (once per puzzle, enforced by UNIQUE)
CREATE POLICY "results_insert_own"
  ON puzzle_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note: no explicit indexes needed — UNIQUE constraints on puzzles(date) and
-- puzzle_results(user_id, puzzle_id) already create implicit B-tree indexes.
-- Puzzle inserts are done via service_role key (bypasses RLS).
