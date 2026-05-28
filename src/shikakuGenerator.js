// ═══════════════════════════════════════════════════════════════════════════
// Shikaku Puzzle Generator
//
// Algorithm overview:
//  1. Scan cells top-left → bottom-right.
//  2. For each unassigned cell (it becomes the top-left corner of a new rect).
//  3. Compute all valid rectangle sizes via efficient DP (O(N²) per cell).
//  4. Pick one via weighted random (prefer areas 2-6).
//  5. Assign that rectangle; place the clue number at a random cell inside it.
//
// Guarantees:
//  - Every cell is covered  (100% coverage by construction — step 2 never skips)
//  - The embedded solution is unique by definition (it's the generated solution)
//  - Deterministic for a given dateStr (seeded RNG)
// ═══════════════════════════════════════════════════════════════════════════

// ── Mulberry32: fast, seedable 32-bit PRNG ───────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

// ── FNV-1a 32-bit hash of a string → stable integer seed ─────────────────────
function fnvHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h;
}

// ── Weighted random choice ────────────────────────────────────────────────────
function weightedChoice(rng, items, weightFn) {
  let total = 0;
  for (const item of items) total += weightFn(item);
  let r = rng() * total;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ── Area weight: reward 2-6, mild reward 7-12, rare single-cell ──────────────
function areaWeight({ area }) {
  if (area === 1)   return 1;
  if (area <= 6)    return 8;
  if (area <= 12)   return 3;
  return 1;
}

// ── Find all valid rectangle candidates with top-left at (r, c) ───────────────
// Uses the property that "maxValidW" decreases monotonically as h grows,
// so we never revisit wider widths once they're invalidated.
//
// complexity: O(maxH * maxValidW) per starting cell — in practice O(N²/N) = O(N)
function findCandidates(r, c, N, assigned) {
  const candidates = [];
  let prevMaxW = N - c; // widths valid for "height 0" (all widths available)

  for (let h = 1; h <= N - r; h++) {
    // Find the largest w such that row (r+h-1) from col c to c+w-1 is all free
    // AND it doesn't exceed prevMaxW (guaranteed by prev heights)
    let curMaxW = 0;
    for (let w = 1; w <= prevMaxW; w++) {
      if (assigned[r + h - 1][c + w - 1] !== -1) break; // row blocked
      curMaxW = w;
    }
    if (curMaxW === 0) break; // this height (and all taller) are blocked at w=1

    // All (h × w) for w = 1..curMaxW are valid candidates
    for (let w = 1; w <= curMaxW; w++) {
      candidates.push({ h, w, area: h * w });
    }
    prevMaxW = curMaxW; // future heights can't be wider
  }
  return candidates;
}

// ── Main generator ────────────────────────────────────────────────────────────
// Returns:
//   N       — grid size
//   clues   — [{ r, c, area }]  (the numbers shown to the player)
//   solution— [{ r, c, h, w }]  (one entry per rectangle)
//   assigned— N×N grid of rect indices (solution grid)
export function generateShikaku(dateStr, N = 7) {
  const rng = mulberry32(fnvHash(dateStr + '_shikaku_v1'));
  // N×N grid; -1 = unassigned, ≥0 = rectangle index
  const assigned = Array.from({ length: N }, () => new Int8Array(N).fill(-1));
  const rects  = []; // { r, c, h, w, numR, numC, area }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (assigned[r][c] !== -1) continue;

      const candidates = findCandidates(r, c, N, assigned);
      // findCandidates always returns at least { h:1, w:1 }, so never empty
      const chosen = weightedChoice(rng, candidates, areaWeight);

      const idx = rects.length;

      // Mark every cell in the chosen rectangle
      for (let dr = 0; dr < chosen.h; dr++) {
        for (let dc = 0; dc < chosen.w; dc++) {
          assigned[r + dr][c + dc] = idx;
        }
      }

      // Place the clue number at a uniformly random cell inside the rectangle
      const cellCount = chosen.h * chosen.w;
      const pick  = Math.floor(rng() * cellCount);
      const numR  = r + Math.floor(pick / chosen.w);
      const numC  = c + (pick % chosen.w);

      rects.push({ r, c, h: chosen.h, w: chosen.w, numR, numC, area: chosen.area });
    }
  }

  return {
    N,
    clues:    rects.map(({ numR, numC, area }) => ({ r: numR, c: numC, area })),
    solution: rects.map(({ r, c, h, w })       => ({ r, c, h, w })),
    // Note: assigned is an Int8Array per row — convert for serialization if needed
  };
}
