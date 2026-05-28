import React from 'react';
import { Lightbulb, Flame, Share2 } from 'lucide-react';
import { C, FONT } from '../shared';
import { formatTime } from '../FarosGameLogic';
import CountdownTimer from './CountdownTimer';

const DIFF_COLOR={fácil:'#EAB308',medio:'#F97316',difícil:'#EF4444'};
const DiffDot=({difficulty})=>(<span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:DIFF_COLOR[difficulty]||'#888',verticalAlign:'middle',marginRight:3}}/>);

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
          <div style={{ marginBottom: 6 }}><Lightbulb size={40} color="#fff" strokeWidth={1.5}/></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            ¡Ya jugaste hoy!
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>
            Faros #{puzzleNum} · <DiffDot difficulty={difficulty}/>{difficulty} · {gridSize}×{gridSize}
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
            <div style={{ fontSize: 24, fontWeight: 800, color: '#E8881A', display:'flex', alignItems:'center', gap:4 }}>
              <Flame size={20} color="#E8881A" strokeWidth={1.8}/>{streak}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
              {streak === 1 ? 'día seguido' : 'días seguidos'}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{ padding: '20px 24px' }}>
          <CountdownTimer label="Próximo Faros en" accentColor={C.accent} />
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
            <Share2 size={14} strokeWidth={2} style={{marginRight:6}}/> Compartir resultado
          </button>
        </div>
      </div>
    </div>
  );
}

