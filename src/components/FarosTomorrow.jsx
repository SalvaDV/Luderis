import React, { useState, useEffect, useRef } from 'react';
import { C, FONT } from '../shared';
import { formatTime } from '../FarosGameLogic';

/**
 * Pantalla "Volvé mañana" — se muestra cuando el usuario ya ganó hoy
 * y vuelve a abrir la sección Juegos.
 *
 * Props:
 *   streak    - integer: racha actual de días consecutivos
 *   winTime   - integer: segundos que tardó hoy
 *   difficulty - 'fácil' | 'medio' | 'difícil'
 *   gridSize  - integer: tamaño del grid de hoy
 *   puzzleNum - integer: número del puzzle de hoy
 *   onShare   - () => void
 */
export default function FarosTomorrow({
  streak, winTime, difficulty, gridSize, puzzleNum, onShare,
}) {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsToMidnight());
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(getSecondsToMidnight());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const diffEmoji = difficulty === 'fácil' ? '🟡' : difficulty === 'medio' ? '🟠' : '🔴';
  const ready = secondsLeft <= 0;

  return (
    <div style={{
      maxWidth: 400,
      margin: '0 auto',
      fontFamily: FONT,
      padding: '0 0 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Header card */}
      <div style={{
        width: '100%',
        background: C.card,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(26,110,216,.05)',
      }}>
        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0)',
          padding: '20px 24px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🔦</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            ¡Ya jugaste hoy!
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>
            Faros #{puzzleNum} · {diffEmoji} {difficulty} · {gridSize}×{gridSize}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          padding: '18px 24px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>
              {formatTime(winTime)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
              Tu tiempo
            </div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#E8881A' }}>
              🔥 {streak}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
              {streak === 1 ? 'día seguido' : 'días seguidos'}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          {ready ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 4 }}>
                ¡El nuevo puzzle ya está disponible!
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Recargá la página para jugar
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Próximo Faros en
              </div>
              <div style={{
                fontSize: 36, fontWeight: 800,
                color: C.text,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 2,
              }}>
                {formatCountdown(secondsLeft)}
              </div>
            </>
          )}
        </div>

        {/* Share button */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={onShare}
            style={{
              width: '100%', padding: 12,
              borderRadius: 11, border: 'none',
              background: `linear-gradient(135deg,${C.accent},#2EC4A0)`,
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            📤 Compartir resultado
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSecondsToMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // próxima medianoche hora local
  return Math.max(0, Math.floor((midnight - now) / 1000));
}

function formatCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
