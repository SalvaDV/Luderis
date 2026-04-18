/**
 * Supabase Edge Function: generate-faros
 * Generates Faros puzzle(s) for the next 7 days algorithmically.
 * Uses backtracking for solution, flood-fill for regions,
 * constraint propagation to pick minimal hints, then validates logic-solvability.
 *
 * Deploy: supabase functions deploy generate-faros
 * CRON:   0 3 * * * (3 AM UTC daily)
 *
 * Secrets used: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// ── Step 1: Generate valid solution ──────────────────────────────────────────
// Place N faros: one per row, unique cols, no 8-directional adjacency between any pair.
function generateSolution(N: number): [number, number][] | null {
  function isValid(r: number, c: number, placed: [number, number][]): boolean {
    for (const [pr, pc] of placed) {
      if (pc === c) return false;
      if (Math.abs(pr - r) <= 1 && Math.abs(pc - c) <= 1) return false;
    }
    return true;
  }

  function bt(row: number, placed: [number, number][]): [number, number][] | null {
    if (row === N) return [...placed];
    for (const col of shuffle(Array.from({ length: N }, (_, i) => i))) {
      if (isValid(row, col, placed)) {
        const result = bt(row + 1, [...placed, [row, col]]);
        if (result) return result;
      }
    }
    return null;
  }

  return bt(0, []);
}

// ── Step 2: Generate regions via flood-fill ───────────────────────────────────
// Each region starts from its solution cell and expands to fill the grid.
function generateRegions(N: number, solution: [number, number][]): number[][] {
  const regions: number[][] = Array.from({ length: N }, () => Array(N).fill(-1));
  solution.forEach(([r, c], i) => { regions[r][c] = i; });

  const frontiers: Array<[number, number][]> = solution.map(([r, c]) => [[r, c]]);
  let remaining = N * N - N;
  const dirs: [number, number][] = [[0,1],[0,-1],[1,0],[-1,0]];

  while (remaining > 0) {
    let expanded = false;

    for (const ri of shuffle(Array.from({ length: N }, (_, i) => i))) {
      const frontier = shuffle([...frontiers[ri]]);
      for (const [fr, fc] of frontier) {
        for (const [dr, dc] of shuffle([...dirs])) {
          const [nr, nc] = [fr + dr, fc + dc];
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && regions[nr][nc] === -1) {
            regions[nr][nc] = ri;
            frontiers[ri].push([nr, nc]);
            remaining--;
            expanded = true;
            break;
          }
        }
        if (expanded) break;
      }
      if (expanded) break;
    }

    // Fallback: fill any orphaned cell by nearest assigned neighbor
    if (!expanded) {
      let broke = false;
      for (let r = 0; r < N && !broke; r++) {
        for (let c = 0; c < N && !broke; c++) {
          if (regions[r][c] !== -1) continue;
          for (const [dr, dc] of dirs) {
            const [nr, nc] = [r + dr, c + dc];
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && regions[nr][nc] !== -1) {
              regions[r][c] = regions[nr][nc];
              remaining--;
              broke = true;
              break;
            }
          }
        }
      }
      if (!broke) break; // truly stuck — outer loop will give up
    }
  }

  return regions;
}

// ── Step 3: Constraint propagation solver ────────────────────────────────────
// Returns true if the puzzle is solvable by pure deduction (no backtracking needed).
function isSolvableByPropagation(
  N: number,
  regions: number[][],
  hints: [number, number][]
): boolean {
  // candidates[i] = set of "r,c" still available for region i
  const candidates: Set<string>[] = Array.from({ length: N }, (_, i) => {
    const s = new Set<string>();
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (regions[r][c] === i) s.add(`${r},${c}`);
    return s;
  });

  const placed = new Set<string>(hints.map(([r, c]) => `${r},${c}`));
  const usedRows = new Set<number>(hints.map(([r]) => r));
  const usedCols = new Set<number>(hints.map(([, c]) => c));
  const regionDone = new Set<number>(hints.map(([r, c]) => regions[r][c]));

  const adjDirs: [number, number][] = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  function eliminate(key: string) {
    for (const cset of candidates) cset.delete(key);
  }

  function applyPlaced(r: number, c: number) {
    for (let i = 0; i < N; i++) {
      if (i !== c) eliminate(`${r},${i}`);
      if (i !== r) eliminate(`${i},${c}`);
    }
    for (const [dr, dc] of adjDirs) eliminate(`${r+dr},${c+dc}`);
    eliminate(`${r},${c}`);
  }

  for (const [r, c] of hints) applyPlaced(r, c);

  let changed = true;
  while (changed) {
    changed = false;

    // Eliminate by used rows/cols
    for (const cset of candidates) {
      for (const key of [...cset]) {
        if (placed.has(key)) continue;
        const [r, c] = key.split(',').map(Number);
        if (usedRows.has(r) || usedCols.has(c)) { cset.delete(key); changed = true; }
      }
    }

    // Forced placements
    for (let i = 0; i < N; i++) {
      if (regionDone.has(i)) continue;
      const avail = [...candidates[i]].filter(k => !placed.has(k));
      if (avail.length === 0) return false;
      if (avail.length === 1) {
        const [r, c] = avail[0].split(',').map(Number);
        placed.add(avail[0]);
        usedRows.add(r);
        usedCols.add(c);
        regionDone.add(i);
        applyPlaced(r, c);
        changed = true;
      }
    }
  }

  return placed.size === N;
}

// ── Step 4: Find minimal hints ────────────────────────────────────────────────
// Try pairs first; fall back to triples if no pair makes the puzzle logic-solvable.
function findHints(
  N: number,
  solution: [number, number][],
  regions: number[][]
): [number, number][] {
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const h: [number, number][] = [solution[i], solution[j]];
      if (isSolvableByPropagation(N, regions, h)) return h;
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      for (let k = j + 1; k < N; k++) {
        const h: [number, number][] = [solution[i], solution[j], solution[k]];
        if (isSolvableByPropagation(N, regions, h)) return h;
      }
    }
  }
  return [solution[0], solution[1], solution[2]];
}

// ── Step 5: Classify difficulty ───────────────────────────────────────────────
function classifyDifficulty(N: number, hintCount: number): "fácil" | "medio" | "difícil" {
  if (N <= 7 && hintCount >= 2) return "fácil";
  if (N <= 8) return "medio";
  return "difícil";
}

// ── Step 6: Generate one complete puzzle ─────────────────────────────────────
interface PuzzleRow {
  date: string;
  grid_size: number;
  regions: number[][];
  hints: [number, number][];
  solution: [number, number][];
  difficulty: string;
}

function generatePuzzle(date: string): PuzzleRow | null {
  const sizes = [6, 6, 7, 7, 8, 8, 9, 10];
  const N = sizes[Math.floor(Math.random() * sizes.length)];

  for (let attempt = 0; attempt < 20; attempt++) {
    const solution = generateSolution(N);
    if (!solution) continue;

    const regions = generateRegions(N, solution);
    if (regions.flat().includes(-1)) continue;

    const hints = findHints(N, solution, regions);

    return {
      date,
      grid_size: N,
      regions,
      hints,
      solution,
      difficulty: classifyDifficulty(N, hints.length),
    };
  }
  return null;
}

// ── HTTP handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const dates = Array.from({ length: 7 }, (_, i) => dateStr(i));

    // Check which dates already have puzzles
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/puzzles?date=in.(${dates.join(',')})&select=date`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const existing: { date: string }[] = await checkRes.json();
    const existingDates = new Set(existing.map(r => r.date));
    const missing = dates.filter(d => !existingDates.has(d));

    const results: string[] = [];

    for (const date of missing) {
      const puzzle = generatePuzzle(date);
      if (!puzzle) {
        results.push(`${date}: FAILED (no valid puzzle after 20 attempts)`);
        continue;
      }

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/puzzles`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(puzzle),
      });

      if (insertRes.ok) {
        results.push(`${date}: OK (${puzzle.grid_size}×${puzzle.grid_size} ${puzzle.difficulty})`);
      } else {
        const err = await insertRes.text();
        results.push(`${date}: INSERT ERROR — ${err}`);
      }
    }

    return new Response(
      JSON.stringify({ generated: missing.length, skipped: dates.length - missing.length, results }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
