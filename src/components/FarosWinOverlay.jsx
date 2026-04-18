import React from 'react';
import { C, FONT } from '../shared';
import { formatTime } from '../FarosGameLogic';

/**
 * Victory overlay. Non-dismissable (game is locked on win).
 * Props:
 *   show        - boolean
 *   timeSeconds - integer
 *   streak      - integer (consecutive days)
 *   puzzleNum   - integer
 *   difficulty  - 'fácil'|'medio'|'difícil'
 *   gridSize    - integer
 *   onShare     - () => void
 *   onBack      - () => void
 */
export default function FarosWinOverlay({
  show, timeSeconds, streak, puzzleNum, difficulty, gridSize, onShare, onBack,
}) {
  if (!show) return null;

  const diffEmoji = difficulty === 'fácil' ? '🟡' : difficulty === 'medio' ? '🟠' : '🔴';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,63,122,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: C.card,
        borderRadius: 24,
        padding: '28px 32px',
        textAlign: 'center',
        maxWidth: 300,
        width: '90%',
        fontFamily: FONT,
        boxShadow: '0 24px 64px rgba(0,0,0,.25)',
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>
          ¡Resuelto!
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
          Faros #{puzzleNum} · {diffEmoji} {difficulty} ({gridSize}×{gridSize})
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 18,
          padding: 14,
          background: C.surface,
          borderRadius: 12,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>
              {formatTime(timeSeconds)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Tiempo</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E8881A' }}>
              🔥 {streak}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Racha</div>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={onShare}
          style={{
            width: '100%', padding: '12px 0',
            borderRadius: 11, border: 'none',
            background: `linear-gradient(135deg,${C.accent},#2EC4A0)`,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: FONT,
            marginBottom: 8,
          }}
        >
          📤 Compartir resultado
        </button>
        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '11px 0',
            borderRadius: 11,
            border: `1.5px solid ${C.border}`,
            background: 'transparent',
            color: C.muted, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          Volver a Explorar
        </button>
      </div>
    </div>
  );
}
