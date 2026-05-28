import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { C, FONT } from '../shared';

// ── 20-color accessible palette ──────────────────────────────────────────────
const PALETTE = [
  '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE',
  '#805AD5', '#D53F8C', '#2B6CB0', '#276749', '#C05621',
  '#6B46C1', '#B7791F', '#2C7A7B', '#702459', '#1A365D',
  '#744210', '#276366', '#553C9A', '#97266D', '#2D3748',
];

export const SHIKAKU_PALETTE = PALETTE;

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeRect(r1, c1, r2, c2) {
  return {
    r: Math.min(r1, r2),
    c: Math.min(c1, c2),
    h: Math.abs(r2 - r1) + 1,
    w: Math.abs(c2 - c1) + 1,
  };
}

function inRect(r, c, rect) {
  return r >= rect.r && r < rect.r + rect.h &&
         c >= rect.c && c < rect.c + rect.w;
}

function overlaps(a, b) {
  return a.r < b.r + b.h && a.r + a.h > b.r &&
         a.c < b.c + b.w && a.c + a.w > b.c;
}

function cluesInside(rect, clues) {
  return clues.filter(cl => inRect(cl.r, cl.c, rect));
}

function isValidPlacement(rect, clues, placedRects) {
  const inside = cluesInside(rect, clues);
  if (inside.length !== 1) return false;
  if (inside[0].area !== rect.h * rect.w) return false;
  for (const p of placedRects) {
    if (overlaps(rect, p)) return false;
  }
  return true;
}

// ── ShikakuGrid ───────────────────────────────────────────────────────────────
// Props:
//   N            — grid size
//   clues        — [{ r, c, area }]
//   placedRects  — [{ r, c, h, w, colorIdx }]
//   onPlace(rect)— called with { r, c, h, w } when a valid rect is dragged
//   onRemove(rect)— called when user taps a cell inside an existing rect
//   won          — disables interaction
export default function ShikakuGrid({ N, clues, placedRects, onPlace, onRemove, won }) {
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(0);
  const cellSizeRef = useRef(0);
  const [drag, setDrag] = useState(null); // { startR, startC, curR, curC }

  // ── Measure container width once mounted + on resize ─────────────────────
  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const cs = Math.floor(w / N);
      setCellSize(cs);
      cellSizeRef.current = cs;
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    return () => ro?.disconnect();
  }, [N]);

  // ── Cell from pointer position ─────────────────────────────────────────────
  const getCell = useCallback((e) => {
    if (!containerRef.current) return null;
    const bounds = containerRef.current.getBoundingClientRect();
    const cs = cellSizeRef.current;
    if (!cs) return null;
    const r = Math.floor((e.clientY - bounds.top)  / cs);
    const c = Math.floor((e.clientX - bounds.left) / cs);
    if (r < 0 || r >= N || c < 0 || c >= N) return null;
    return { r, c };
  }, [N]);

  // ── Pointer handlers ───────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (won) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const cell = getCell(e);
    if (!cell) return;
    setDrag({ startR: cell.r, startC: cell.c, curR: cell.r, curC: cell.c });
  }, [won, getCell]);

  const onPointerMove = useCallback((e) => {
    if (!drag) return;
    const cell = getCell(e);
    if (!cell) return;
    setDrag(d => d ? { ...d, curR: cell.r, curC: cell.c } : null);
  }, [drag, getCell]);

  const onPointerUp = useCallback((e) => {
    if (!drag) return;
    const cell = getCell(e);
    const endR = cell ? cell.r : drag.curR;
    const endC = cell ? cell.c : drag.curC;
    const rect = normalizeRect(drag.startR, drag.startC, endR, endC);

    if (isValidPlacement(rect, clues, placedRects)) {
      onPlace(rect);
    } else if (rect.h === 1 && rect.w === 1) {
      // Tap: remove existing rect that contains this cell
      const existing = placedRects.find(p => inRect(rect.r, rect.c, p));
      if (existing) onRemove(existing);
    }
    setDrag(null);
  }, [drag, getCell, clues, placedRects, onPlace, onRemove]); // eslint-disable-line

  // ── Derived: preview rect ──────────────────────────────────────────────────
  const preview = drag
    ? normalizeRect(drag.startR, drag.startC, drag.curR, drag.curC)
    : null;
  const previewOk = preview ? isValidPlacement(preview, clues, placedRects) : false;

  // ── Render ─────────────────────────────────────────────────────────────────
  const gridPx = cellSize * N;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: won ? 'default' : 'crosshair',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      {cellSize > 0 && (
        <div style={{
          width: gridPx,
          height: gridPx,
          position: 'relative',
          margin: '0 auto',
          // Outer border
          border: `2px solid ${C.border}`,
          boxSizing: 'border-box',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          {/* ── Layer 1: base grid lines ──────────────────────────────────── */}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => (
              <div key={`cell-${r}-${c}`} style={{
                position: 'absolute',
                left: c * cellSize,
                top:  r * cellSize,
                width: cellSize,
                height: cellSize,
                borderRight:  c < N - 1 ? `1px solid ${C.border}` : 'none',
                borderBottom: r < N - 1 ? `1px solid ${C.border}` : 'none',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }} />
            ))
          )}

          {/* ── Layer 2: placed rectangles ────────────────────────────────── */}
          {placedRects.map((rect, i) => {
            const color = PALETTE[(rect.colorIdx ?? i) % PALETTE.length];
            return (
              <div key={`rect-${i}`} style={{
                position: 'absolute',
                left:   rect.c * cellSize + 1,
                top:    rect.r * cellSize + 1,
                width:  rect.w * cellSize - 2,
                height: rect.h * cellSize - 2,
                background: color + '28',
                border: `2.5px solid ${color}`,
                borderRadius: 3,
                boxSizing: 'border-box',
                pointerEvents: 'none',
                zIndex: 2,
              }} />
            );
          })}

          {/* ── Layer 3: clue numbers ─────────────────────────────────────── */}
          {clues.map((cl, i) => {
            // Find if this clue is inside a placed rect (to set matching text color)
            const placed = placedRects.find(p => inRect(cl.r, cl.c, p));
            const color  = placed
              ? PALETTE[(placed.colorIdx ?? placedRects.indexOf(placed)) % PALETTE.length]
              : C.text;
            const circleSize = Math.max(18, Math.min(cellSize * 0.62, 32));
            const fontSize   = Math.max(9,  Math.min(cellSize * 0.36, 15));
            return (
              <div key={`clue-${i}`} style={{
                position: 'absolute',
                left:   cl.c * cellSize,
                top:    cl.r * cellSize,
                width:  cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}>
                <div style={{
                  width:  circleSize,
                  height: circleSize,
                  borderRadius: '50%',
                  background: placed ? color + '22' : C.bg,
                  border: `2px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize,
                  fontWeight: 800,
                  fontFamily: FONT,
                  color,
                  lineHeight: 1,
                  transition: 'all .15s',
                }}>
                  {cl.area}
                </div>
              </div>
            );
          })}

          {/* ── Layer 4: drag preview ─────────────────────────────────────── */}
          {preview && (
            <div style={{
              position: 'absolute',
              left:   preview.c * cellSize + 1,
              top:    preview.r * cellSize + 1,
              width:  preview.w * cellSize - 2,
              height: preview.h * cellSize - 2,
              background: previewOk ? '#1A6ED814' : '#E5373714',
              border: `2px dashed ${previewOk ? '#1A6ED8' : '#E53737'}88`,
              borderRadius: 3,
              boxSizing: 'border-box',
              pointerEvents: 'none',
              zIndex: 10,
              transition: 'background .05s',
            }} />
          )}
        </div>
      )}
    </div>
  );
}
