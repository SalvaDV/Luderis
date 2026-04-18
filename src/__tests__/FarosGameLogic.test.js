import {
  createCellState,
  toggleCell,
  getConflicts,
  checkWin,
  formatTime,
  REGION_PALETTE,
} from '../FarosGameLogic';

describe('REGION_PALETTE', () => {
  it('has exactly 10 entries', () => {
    expect(REGION_PALETTE).toHaveLength(10);
  });
  it('every entry has bg, border, dark, name', () => {
    REGION_PALETTE.forEach(p => {
      expect(p).toHaveProperty('bg');
      expect(p).toHaveProperty('border');
      expect(p).toHaveProperty('dark');
      expect(p).toHaveProperty('name');
    });
  });
});

describe('createCellState', () => {
  it('creates N×N null grid', () => {
    const state = createCellState(3, []);
    expect(state).toHaveLength(3);
    expect(state[0]).toHaveLength(3);
    expect(state[0][0]).toBeNull();
  });
  it('pre-fills hint cells as faro', () => {
    const state = createCellState(3, [[0, 1], [2, 2]]);
    expect(state[0][1]).toBe('faro');
    expect(state[2][2]).toBe('faro');
    expect(state[1][1]).toBeNull();
  });
});

describe('toggleCell', () => {
  const hints = [[0, 0]];
  it('cycles null → cross → faro → null', () => {
    let s = createCellState(3, hints);
    s = toggleCell(s, 1, 1, hints);
    expect(s[1][1]).toBe('cross');
    s = toggleCell(s, 1, 1, hints);
    expect(s[1][1]).toBe('faro');
    s = toggleCell(s, 1, 1, hints);
    expect(s[1][1]).toBeNull();
  });
  it('does not toggle hint cells', () => {
    let s = createCellState(3, hints);
    s = toggleCell(s, 0, 0, hints);
    expect(s[0][0]).toBe('faro'); // unchanged
  });
  it('returns a new array (immutable)', () => {
    const s = createCellState(3, []);
    const s2 = toggleCell(s, 0, 1, []);
    expect(s).not.toBe(s2);
    expect(s[0][1]).toBeNull(); // original unchanged
  });
});

describe('getConflicts', () => {
  it('returns empty for no faros', () => {
    const s = createCellState(4, []);
    expect(getConflicts(s)).toHaveLength(0);
  });
  it('detects same-row conflict', () => {
    const s = createCellState(4, [[0, 0], [0, 3]]);
    const conflicts = getConflicts(s);
    expect(conflicts).toHaveLength(2);
  });
  it('detects same-col conflict', () => {
    const s = createCellState(4, [[0, 2], [3, 2]]);
    expect(getConflicts(s)).toHaveLength(2);
  });
  it('detects diagonal adjacency conflict', () => {
    const s = createCellState(4, [[0, 0], [1, 1]]);
    expect(getConflicts(s)).toHaveLength(2);
  });
  it('no conflict when faros are 2+ apart diagonally', () => {
    // (0,0) and (2,2) — |dr|=2, |dc|=2 — not adjacent
    const s = createCellState(4, [[0, 0], [2, 2]]);
    expect(getConflicts(s)).toHaveLength(0);
  });
  it('ignores cross-state cells', () => {
    let s = createCellState(4, [[0, 0]]);
    s = toggleCell(s, 0, 1, [[0, 0]]); // cross on (0,1)
    expect(getConflicts(s)).toHaveLength(0);
  });
});

describe('checkWin', () => {
  // 3×3 grid, 3 regions — simple known solution
  const regions = [[0,1,1],[0,2,1],[0,2,2]];
  it('returns false when not enough faros', () => {
    const s = createCellState(3, []);
    expect(checkWin(s, regions)).toBe(false);
  });
  it('returns false when conflicts exist', () => {
    // Same row → conflict
    const s = createCellState(3, [[0,0],[0,2]]);
    expect(checkWin(s, regions)).toBe(false);
  });
  it('returns false with only 2 faros (needs 3)', () => {
    const s = createCellState(3, []);
    s[0][0] = 'faro'; s[1][1] = 'faro'; // only 2 of 3 regions covered
    expect(checkWin(s, regions)).toBe(false);
  });
  it('returns true for a valid 4×4 solved board', () => {
    // Solution: (0,1)=reg0, (1,3)=reg1, (2,0)=reg2, (3,2)=reg3
    // No same row/col, no 8-adjacency between any pair
    const regions4 = [
      [0, 0, 1, 1],
      [0, 2, 2, 1],
      [2, 2, 3, 3],
      [2, 3, 3, 3],
    ];
    const s = createCellState(4, []);
    s[0][1] = 'faro'; s[1][3] = 'faro'; s[2][0] = 'faro'; s[3][2] = 'faro';
    expect(checkWin(s, regions4)).toBe(true);
  });
});

describe('formatTime', () => {
  it('formats 0 as 00:00', () => expect(formatTime(0)).toBe('00:00'));
  it('formats 65 as 01:05', () => expect(formatTime(65)).toBe('01:05'));
  it('formats 3600 as 60:00', () => expect(formatTime(3600)).toBe('60:00'));
});
