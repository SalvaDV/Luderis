-- ═══════════════════════════════════════════════════════════════════════════
-- Leaderboard & community stats functions
-- All use SECURITY DEFINER to aggregate across all users (bypassing RLS).
-- auth.uid() still works inside SECURITY DEFINER in Supabase because
-- PostgREST injects the JWT claims into the session settings before
-- executing any query.
--
-- Score formula: GREATEST(1, ROUND(10000 / time_seconds))
-- Continuous and strictly decreasing — every extra second costs points.
-- Examples: 30s→333pts, 60s→167pts, 120s→83pts, 300s→33pts
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Faros: community average time for a specific puzzle ───────────────────

CREATE OR REPLACE FUNCTION get_avg_time_faros(p_puzzle_id UUID)
RETURNS TABLE(avg_seconds INT, player_count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ROUND(AVG(time_seconds))::INT,
    COUNT(*)::BIGINT
  FROM puzzle_results
  WHERE puzzle_id = p_puzzle_id
    AND time_seconds > 0;
$$;
GRANT EXECUTE ON FUNCTION get_avg_time_faros(UUID) TO authenticated;

-- ── Shikaku: community average time for a specific date ──────────────────

CREATE OR REPLACE FUNCTION get_avg_time_shikaku(p_date TEXT)
RETURNS TABLE(avg_seconds INT, player_count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ROUND(AVG(time_seconds))::INT,
    COUNT(*)::BIGINT
  FROM shikaku_results
  WHERE puzzle_date = p_date::date
    AND time_seconds > 0;
$$;
GRANT EXECUTE ON FUNCTION get_avg_time_shikaku(TEXT) TO authenticated;

-- ── Faros leaderboard: top lim + always the current user ─────────────────

CREATE OR REPLACE FUNCTION get_leaderboard_faros(lim INT DEFAULT 10)
RETURNS TABLE(
  pos         BIGINT,
  nombre      TEXT,
  total_score BIGINT,
  games_played BIGINT,
  best_time   INT,
  is_me       BOOLEAN
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH scores AS (
    SELECT
      u.id,
      u.nombre,
      SUM(GREATEST(1, ROUND(10000.0 / NULLIF(pr.time_seconds, 0))))::BIGINT AS total_score,
      COUNT(*)::BIGINT                                                        AS games_played,
      MIN(pr.time_seconds)::INT                                               AS best_time
    FROM puzzle_results pr
    JOIN usuarios u ON pr.user_id = u.id
    WHERE pr.time_seconds > 0
    GROUP BY u.id, u.nombre
  ),
  ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY total_score DESC) AS pos, * FROM scores
  )
  SELECT
    pos,
    nombre,
    total_score,
    games_played,
    best_time,
    (id = auth.uid()) AS is_me
  FROM ranked
  WHERE pos <= lim OR id = auth.uid()
  ORDER BY pos;
$$;
GRANT EXECUTE ON FUNCTION get_leaderboard_faros(INT) TO authenticated;

-- ── Shikaku leaderboard: top lim + always the current user ───────────────

CREATE OR REPLACE FUNCTION get_leaderboard_shikaku(lim INT DEFAULT 10)
RETURNS TABLE(
  pos          BIGINT,
  nombre       TEXT,
  total_score  BIGINT,
  games_played BIGINT,
  best_time    INT,
  is_me        BOOLEAN
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH scores AS (
    SELECT
      u.id,
      u.nombre,
      SUM(GREATEST(1, ROUND(10000.0 / NULLIF(sr.time_seconds, 0))))::BIGINT AS total_score,
      COUNT(*)::BIGINT                                                        AS games_played,
      MIN(sr.time_seconds)::INT                                               AS best_time
    FROM shikaku_results sr
    JOIN usuarios u ON sr.usuario_id = u.id
    WHERE sr.time_seconds > 0
    GROUP BY u.id, u.nombre
  ),
  ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY total_score DESC) AS pos, * FROM scores
  )
  SELECT
    pos,
    nombre,
    total_score,
    games_played,
    best_time,
    (id = auth.uid()) AS is_me
  FROM ranked
  WHERE pos <= lim OR id = auth.uid()
  ORDER BY pos;
$$;
GRANT EXECUTE ON FUNCTION get_leaderboard_shikaku(INT) TO authenticated;
