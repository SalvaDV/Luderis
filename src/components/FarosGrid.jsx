import React from 'react';
import FarosCell from './FarosCell';
import { REGION_PALETTE } from '../FarosGameLogic';

/**
 * NxN puzzle grid.
 * Props:
 *   gridSize    - integer 6-10
 *   regions     - 2D array [row][col] → region index
 *   cellState   - 2D array [row][col] → null|'cross'|'faro'
 *   conflicts   - array of [r,c] in conflict
 *   hints       - array of [r,c] that are locked
 *   onCellClick - (r, c) => void
 */
export default function FarosGrid({
  gridSize, regions, cellState, conflicts, hints, onCellClick,
}) {
  const N = gridSize;
  const conflictSet = new Set(conflicts.map(([r, c]) => `${r},${c}`));
  const hintSet = new Set(hints.map(([r, c]) => `${r},${c}`));

  // Max grid width: fills available space, capped at 380px
  const maxPx = Math.min(380, (typeof window !== 'undefined' ? window.innerWidth : 440) - 48);

  function getBorderStyle(r, c) {
    const reg = regions[r][c];
    const palette = REGION_PALETTE[reg % 10];
    const thick = `3px solid ${palette.border}`;
    const thin = `1px solid ${palette.border}40`;
    return {
      borderTop:    (r === 0     || regions[r - 1]?.[c] !== reg) ? thick : thin,
      borderRight:  (c === N - 1 || regions[r]?.[c + 1] !== reg) ? thick : thin,
      borderBottom: (r === N - 1 || regions[r + 1]?.[c] !== reg) ? thick : thin,
      borderLeft:   (c === 0     || regions[r]?.[c - 1] !== reg) ? thick : thin,
    };
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${N}, 1fr)`,
      gap: 2,
      borderRadius: 14,
      overflow: 'hidden',
      width: maxPx,
      border: '3px solid #CBD5E8',
      background: '#CBD5E8',
      flexShrink: 0,
    }}>
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const reg = regions[r][c];
          const key = `${r},${c}`;
          return (
            <FarosCell
              key={key}
              state={cellState[r][c]}
              isHint={hintSet.has(key)}
              isConflict={conflictSet.has(key)}
              colorIndex={reg % 10}
              gridSize={N}
              borderStyle={getBorderStyle(r, c)}
              onClick={() => onCellClick(r, c)}
            />
          );
        })
      )}
    </div>
  );
}
