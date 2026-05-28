import React, { useRef } from 'react';
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
 *   onCellClick - (r, c) => void  (tap)
 *   onDragFill  - (r, c, action) => void  action: 'fill'|'clear'
 */
export default function FarosGrid({
  gridSize, regions, cellState, conflicts, hints, onCellClick, onDragFill,
}) {
  const N = gridSize;
  const conflictSet = new Set(conflicts.map(([r, c]) => `${r},${c}`));
  const hintSet = new Set(hints.map(([r, c]) => `${r},${c}`));

  // Max grid width: fills available space, capped at 380px
  const maxPx = Math.min(380, (typeof window !== 'undefined' ? window.innerWidth : 440) - 48);

  const dragRef = useRef(null);

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

  // Walk up DOM tree to find the nearest element with data-cell-key
  function getCellFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && !el.dataset?.cellKey) {
      el = el.parentElement;
    }
    if (!el?.dataset?.cellKey) return null;
    const [r, c] = el.dataset.cellKey.split(',').map(Number);
    return { r, c };
  }

  function handlePointerDown(e) {
    if (!e.isPrimary) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    // Capture so we keep receiving move events even when finger leaves the grid
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startR: cell.r,
      startC: cell.c,
      startX: e.clientX,
      startY: e.clientY,
      direction: null,   // 'row' | 'col', locked once threshold exceeded
      action: null,      // 'fill' | 'clear', determined by first cell
      seen: new Set(),
      dragging: false,
    };
  }

  function handlePointerMove(e) {
    const ds = dragRef.current;
    if (!ds) return;

    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    // Lock direction once movement exceeds 8px threshold
    if (!ds.direction) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      ds.direction = Math.abs(dx) > Math.abs(dy) ? 'row' : 'col';
      ds.dragging = true;
      ds.action = cellState[ds.startR][ds.startC] === 'cross' ? 'clear' : 'fill';
      // Apply action to the starting cell
      ds.seen.add(`${ds.startR},${ds.startC}`);
      onDragFill(ds.startR, ds.startC, ds.action);
    }

    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    // Only fill along the locked direction
    const inLine = ds.direction === 'row' ? cell.r === ds.startR : cell.c === ds.startC;
    if (!inLine) return;

    const key = `${cell.r},${cell.c}`;
    if (ds.seen.has(key)) return;
    ds.seen.add(key);
    onDragFill(cell.r, cell.c, ds.action);
  }

  function handlePointerUp() {
    const ds = dragRef.current;
    dragRef.current = null;
    if (!ds) return;
    // No drag happened → treat as a tap
    if (!ds.dragging) {
      onCellClick(ds.startR, ds.startC);
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        gap: 2,
        borderRadius: 14,
        overflow: 'hidden',
        width: maxPx,
        border: '3px solid #CBD5E8',
        background: '#CBD5E8',
        flexShrink: 0,
        touchAction: 'none',  // grid drag takes priority over page scroll
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragRef.current = null; }}
    >
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const reg = regions[r][c];
          const key = `${r},${c}`;
          return (
            <FarosCell
              key={key}
              cellKey={key}
              state={cellState[r][c]}
              isHint={hintSet.has(key)}
              isConflict={conflictSet.has(key)}
              colorIndex={reg % 10}
              gridSize={N}
              borderStyle={getBorderStyle(r, c)}
            />
          );
        })
      )}
    </div>
  );
}
