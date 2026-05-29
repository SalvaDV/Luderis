import React from 'react';
import { C, FONT } from '../shared';

function fmt(s) {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function fmtScore(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('es-AR');
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard({ rows = [], accentColor = '#1A6ED8', emptyMsg }) {
  const empty = emptyMsg ?? 'Todavía no hay jugadores. ¡Sé el primero!';

  if (!rows.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '28px 0',
        color: C.muted, fontSize: 13, fontFamily: FONT,
      }}>
        {empty}
      </div>
    );
  }

  // Check if current user is outside top rows (to show separator)
  const topRows  = rows.filter(r => !r.is_me || Number(r.pos) <= 10);
  const myRow    = rows.find(r => r.is_me && Number(r.pos) > 10);

  const renderRow = (row, showSeparator = false) => {
    const medal = MEDALS[Number(row.pos)];
    const isMe  = row.is_me;
    return (
      <React.Fragment key={`${row.pos}-${row.nombre}`}>
        {showSeparator && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px',
            fontSize: 10, color: C.muted,
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span>···</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '30px 1fr 76px 44px 62px',
          gap: 8,
          padding: '9px 10px',
          alignItems: 'center',
          background: isMe ? `${accentColor}12` : 'transparent',
          borderBottom: `1px solid ${C.border}`,
          borderLeft: isMe ? `3px solid ${accentColor}` : '3px solid transparent',
        }}>
          {/* Rank */}
          <span style={{ textAlign: 'center', lineHeight: 1 }}>
            {medal
              ? <span style={{ fontSize: 15 }}>{medal}</span>
              : <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{row.pos}</span>}
          </span>

          {/* Name */}
          <span style={{
            fontSize: 13,
            fontWeight: isMe ? 700 : 500,
            color: isMe ? accentColor : C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {row.nombre}
            {isMe && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: accentColor,
                background: `${accentColor}18`,
                borderRadius: 4, padding: '1px 4px', marginLeft: 5,
                verticalAlign: 'middle',
              }}>
                VOS
              </span>
            )}
          </span>

          {/* Score */}
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: isMe ? accentColor : C.text,
            textAlign: 'right',
          }}>
            {fmtScore(row.total_score)}
          </span>

          {/* Games played */}
          <span style={{ fontSize: 12, color: C.muted, textAlign: 'right' }}>
            {row.games_played}
          </span>

          {/* Best time */}
          <span style={{ fontSize: 12, color: C.muted, textAlign: 'right' }}>
            {fmt(row.best_time)}
          </span>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 76px 44px 62px',
        gap: 8,
        padding: '6px 10px 6px 13px',
        fontSize: 10, fontWeight: 700, color: C.muted,
        textTransform: 'uppercase', letterSpacing: .7,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ textAlign: 'center' }}>#</span>
        <span>Jugador</span>
        <span style={{ textAlign: 'right' }}>Puntos</span>
        <span style={{ textAlign: 'right' }}>⚡</span>
        <span style={{ textAlign: 'right' }}>Mejor</span>
      </div>

      {topRows.map(row => renderRow(row))}
      {myRow && renderRow(myRow, true)}
    </div>
  );
}
