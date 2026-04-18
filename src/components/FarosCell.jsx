import React from 'react';
import { REGION_PALETTE, LIGHTHOUSE_SVG } from '../FarosGameLogic';

/**
 * Single grid cell.
 * Props:
 *   state       - null | 'cross' | 'faro'
 *   isHint      - boolean: locked pre-placed faro
 *   isConflict  - boolean: overlapping with another faro
 *   colorIndex  - 0-9 index into REGION_PALETTE
 *   gridSize    - N (affects icon sizing)
 *   borderStyle - {borderTop, borderRight, borderBottom, borderLeft}
 *   onClick     - () => void
 */
export default function FarosCell({
  state, isHint, isConflict, colorIndex, gridSize, borderStyle, onClick,
}) {
  const palette = REGION_PALETTE[colorIndex] || REGION_PALETTE[0];
  const isLarge = gridSize >= 9;
  const iconPct = isLarge ? '55%' : '62%';
  const crossPx = isLarge ? 13 : 17;

  return (
    <div
      onClick={isHint ? undefined : onClick}
      style={{
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isHint ? 'default' : 'pointer',
        position: 'relative',
        userSelect: 'none',
        background: palette.bg,
        transition: 'filter .1s',
        ...borderStyle,
      }}
    >
      {/* Conflict overlay */}
      {isConflict && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(229,62,62,.30)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {/* Faro (lighthouse icon) */}
      {state === 'faro' && (
        <div
          style={{
            position: 'relative', zIndex: 3,
            width: iconPct, height: iconPct,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isConflict ? '#E53E3E' : palette.dark,
            boxShadow: isHint
              ? '0 2px 8px rgba(0,0,0,.28),0 0 0 2.5px rgba(255,255,255,.85)'
              : '0 2px 8px rgba(0,0,0,.28)',
            padding: '14%',
          }}
          dangerouslySetInnerHTML={{ __html: LIGHTHOUSE_SVG }}
        />
      )}

      {/* Cruz de marcado (✕) */}
      {state === 'cross' && (
        <div style={{
          position: 'relative', zIndex: 3,
          fontSize: crossPx, fontWeight: 900,
          color: palette.border,
          lineHeight: 1, opacity: 0.4,
          pointerEvents: 'none',
        }}>
          ✕
        </div>
      )}
    </div>
  );
}
