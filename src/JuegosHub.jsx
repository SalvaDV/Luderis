import React, { useState, useEffect } from 'react';
import { Lightbulb, Grid3x3, Flame, CheckCircle } from 'lucide-react';
import { C, FONT, Spinner } from './shared';
import * as sb from './supabase';

function todayStr() {
  return new Date().toLocaleDateString('sv');
}

// ── Single game card ──────────────────────────────────────────────────────────
function GameCard({ icon, gradient, title, tagline, rules, done, streak, timeStr, onClick, color }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        borderRadius: 20,
        border: `1.5px solid ${done ? color + '55' : C.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: done
          ? `0 4px 24px ${color}18`
          : '0 2px 12px rgba(0,0,0,.06)',
        transition: 'box-shadow .15s, border-color .15s, transform .1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {/* Gradient header */}
      <div style={{
        background: gradient,
        padding: '18px 20px 14px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            {icon}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>{tagline}</div>
        </div>

        {/* Status badge */}
        <div>
          {done ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,.18)',
              borderRadius: 20, padding: '5px 10px',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              <CheckCircle size={13} strokeWidth={2.5} />
              {timeStr}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,.18)',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              Nuevo
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 20px 18px' }}>
        {/* Rules mini */}
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          {rules}
        </div>

        {/* Footer: streak + button */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700,
            color: streak > 0 ? '#F97316' : C.muted,
          }}>
            <Flame size={15} color={streak > 0 ? '#F97316' : C.muted} strokeWidth={2} />
            {streak} {streak === 1 ? 'día' : 'días'}
          </div>
          <div style={{
            padding: '8px 20px',
            borderRadius: 10,
            background: done ? 'transparent' : color,
            border: done ? `1.5px solid ${color}` : 'none',
            color: done ? color : '#fff',
            fontSize: 13, fontWeight: 700,
            fontFamily: FONT,
          }}>
            {done ? 'Ver resultado' : 'Jugar'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── JuegosHub ─────────────────────────────────────────────────────────────────
// Props:
//   session          — Supabase session
//   onPlayFaros      — () => void
//   onPlayShikaku    — () => void
//   farosWonToday    — boolean (override desde App.js; true = ya ganó hoy)
//   shikakuWonToday  — boolean (override desde App.js; true = ya ganó hoy)
//
// Los props *WonToday se usan como valor inicial del estado para evitar la
// race condition entre el guardado en DB y la carga del hub.
// La consulta a DB puede actualizar el estado hacia 'true' (para mostrar el
// tiempo), pero nunca lo pisa hacia 'false' si el prop ya dijo 'true'.
export default function JuegosHub({ session, onPlayFaros, onPlayShikaku,
                                    farosWonToday = false, shikakuWonToday = false }) {
  const [farosDone,   setFarosDone]   = useState(farosWonToday);
  const [farosTime,   setFarosTime]   = useState(0);
  const [farosStreak, setFarosStreak] = useState(0);
  const [shikDone,    setShikDone]    = useState(shikakuWonToday);
  const [shikTime,    setShikTime]    = useState(0);
  const [shikStreak,  setShikStreak]  = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!session?.access_token) { setLoading(false); return; }
    const token = session.access_token;
    const today = todayStr();

    Promise.allSettled([
      // Faros status
      sb.getTodaysPuzzle(token)
        .then(p => p ? sb.getTodaysPuzzleResult(token, p.id) : null),
      // Faros streak
      sb.db('puzzle_results?select=completed_at,puzzles(date)&order=completed_at.desc&limit=30',
             'GET', null, token)
        .then(rows => (rows || []).map(r => r.puzzles?.date).filter(Boolean)),
      // Shikaku status
      sb.getShikakuResult(token, today),
      // Shikaku streak
      sb.getShikakuStreak(token),
    ]).then(([farosRes, farosStreakRes, shikRes, shikStreakRes]) => {
      // Faros done? — solo se actualiza hacia true (el prop ya pudo haberlo marcado)
      if (farosRes.status === 'fulfilled' && farosRes.value) {
        setFarosDone(true);
        setFarosTime(farosRes.value.time_seconds ?? 0);
      }
      // Faros streak
      if (farosStreakRes.status === 'fulfilled') {
        const dates = farosStreakRes.value ?? [];
        setFarosStreak(calcStreak(dates));
      }
      // Shikaku done? — ídem
      if (shikRes.status === 'fulfilled' && shikRes.value) {
        setShikDone(true);
        setShikTime(shikRes.value.time_seconds ?? 0);
      }
      // Shikaku streak
      if (shikStreakRes.status === 'fulfilled') {
        const dates = shikStreakRes.value ?? [];
        setShikStreak(calcStreak(dates));
      }
      setLoading(false);
    });
  }, [session?.access_token]); // eslint-disable-line

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '64px 16px', fontFamily: FONT,
      }}>
        <Spinner />
      </div>
    );
  }

  function fmt(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      fontFamily: FONT, padding: '4px 0 48px',
    }}>
      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          Juegos
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Un puzzle nuevo cada día
        </div>
      </div>

      {/* Game cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GameCard
          icon={<Lightbulb size={22} color="#fff" strokeWidth={2} />}
          gradient="linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0)"
          title="Faros"
          tagline="Puzzle de lógica"
          rules="Colocá faros en cada región de color. Solo uno por fila y columna, sin que se toquen."
          done={farosDone}
          streak={farosStreak}
          timeStr={farosDone ? (farosTime > 0 ? fmt(farosTime) : '···') : null}
          onClick={onPlayFaros}
          color="#1A6ED8"
        />
        <GameCard
          icon={<Grid3x3 size={22} color="#fff" strokeWidth={2} />}
          gradient="linear-gradient(135deg,#4A1D96,#805AD5,#553C9A)"
          title="Shikaku"
          tagline="Puzzle de rectángulos"
          rules="Rodeá cada número con un rectángulo cuya área sea exactamente ese número. Todos los casilleros deben quedar cubiertos."
          done={shikDone}
          streak={shikStreak}
          timeStr={shikDone ? (shikTime > 0 ? fmt(shikTime) : '···') : null}
          onClick={onPlayShikaku}
          color="#805AD5"
        />
      </div>
    </div>
  );
}

// Kept local (not exported) — same logic as in ShikakuPage/FarosPage
function calcStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = new Date().toLocaleDateString('sv');
  for (const d of sorted) {
    const diff = (new Date(cursor) - new Date(d)) / 86400000;
    if (diff === 0 || diff === 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}
