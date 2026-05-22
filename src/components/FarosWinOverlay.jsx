import React from 'react';
import { Trophy, Flame, Share2 } from 'lucide-react';
import { C, FONT } from '../shared';
import { formatTime } from '../FarosGameLogic';

const DIFF_COLOR={fácil:'#EAB308',medio:'#F97316',difícil:'#EF4444'};
const DiffDot=({difficulty})=>(
  <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:DIFF_COLOR[difficulty]||'#888',verticalAlign:'middle',marginRight:3}}/>
);

export default function FarosWinOverlay({
  show, timeSeconds, streak, puzzleNum, difficulty, gridSize, onShare, onBack,
}) {
  if (!show) return null;
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
        <div style={{ marginBottom: 8, display:'flex', justifyContent:'center' }}>
          <Trophy size={44} color="#F59E0B" strokeWidth={1.5}/>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>
          ¡Resuelto!
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          Faros #{puzzleNum} · <DiffDot difficulty={difficulty}/>{difficulty} ({gridSize}×{gridSize})
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
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E8881A', display:'flex', alignItems:'center', gap:4 }}>
              <Flame size={20} color="#E8881A" strokeWidth={1.8}/>{streak}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Share2 size={14} strokeWidth={2}/> Compartir resultado
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
