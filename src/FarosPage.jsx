import React, { useState, useEffect, useCallback } from 'react';
import { C, FONT, toast } from './shared';
import * as sb from './supabase';
import {
  createCellState, toggleCell, getConflicts, checkWin, formatTime, REGION_PALETTE, PUZZLE_EPOCH,
} from './FarosGameLogic';
import FarosGrid from './components/FarosGrid';
import FarosWinOverlay from './components/FarosWinOverlay';
import FarosStreakBar from './components/FarosStreakBar';
import FarosTomorrow from './components/FarosTomorrow';

// Puzzle number: #1 en el día de lanzamiento (PUZZLE_EPOCH), +1 por día
function getPuzzleNumber(dateStr) {
  const epoch = new Date(PUZZLE_EPOCH);
  const d = new Date(dateStr);
  return Math.max(1, Math.floor((d - epoch) / 86400000) + 1);
}

// How many consecutive days the user has completed (newest-first sorted dates)
function calcStreak(resultDates) {
  if (!resultDates.length) return 0;
  const sorted = [...resultDates].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else break;
  }
  return streak;
}

/**
 * FarosPage — daily logic puzzle page.
 * Props:
 *   session  - Supabase session object
 *   onBack   - () => void (navigate to Explorar)
 *   onWin    - () => void (tell App to clear the badge)
 */
export default function FarosPage({ session, onBack, onWin }) {
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cellState, setCellState] = useState(null);
  const [won, setWon] = useState(false);
  const [wonOnLoad, setWonOnLoad] = useState(false); // ganado en sesión anterior
  const [winTime, setWinTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const startTimeRef = React.useRef(Date.now());

  // ── Load puzzle + check if already won today ────────────────────────────────
  useEffect(() => {
    if (!session?.access_token) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    sb.getTodaysPuzzle(session.access_token)
      .then(async p => {
        if (!mounted) return;
        if (!p) { setError('no_puzzle'); setLoading(false); return; }

        setPuzzle(p);
        setCellState(createCellState(p.grid_size, p.hints));

        // Check if already solved today
        const result = await sb.getTodaysPuzzleResult(session.access_token, p.id).catch(() => null);
        if (!mounted) return;
        if (result) {
          setWon(true);
          setWonOnLoad(true);
          setWinTime(result.time_seconds);
          // Show full solution in won state
          setCellState(createCellState(p.grid_size, p.solution));
        } else {
          startTimeRef.current = Date.now();
        }

        // Fetch streak from last 30 results
        sb.db(
          'puzzle_results?select=completed_at,puzzles(date)&order=completed_at.desc&limit=30',
          'GET', null, session.access_token
        ).then(rows => {
          if (!mounted) return;
          const dates = (rows || []).map(r => r.puzzles?.date).filter(Boolean);
          setStreak(calcStreak(dates));
        }).catch(() => {});

        setLoading(false);
      })
      .catch(e => {
        if (!mounted) return;
        setError('fetch_error');
        setLoading(false);
        console.error('[Faros] load error', e);
      });

    return () => { mounted = false; };
  }, [session?.access_token]); // eslint-disable-line

  // ── Cell click ──────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((r, c) => {
    if (won || !puzzle) return;
    setCellState(prev => toggleCell(prev, r, c, puzzle.hints));
  }, [won, puzzle]);

  // ── Verify solution ─────────────────────────────────────────────────────────
  const handleVerify = useCallback(() => {
    if (!puzzle || won) return;
    const isWin = checkWin(cellState, puzzle.regions);
    if (!isWin) {
      toast('La solución no es correcta — revisá los conflictos', 'error', 3000);
      return;
    }
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setWinTime(elapsed);
    setWon(true);
    setStreak(s => s + 1);
    onWin?.();

    sb.submitPuzzleResult(session.access_token, puzzle.id, elapsed).catch(e => {
      console.error('[Faros] submitResult error', e);
    });
  }, [puzzle, won, cellState, session?.access_token, onWin]);

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (!puzzle) return;
    const diffEmoji = puzzle.difficulty === 'fácil' ? '🟡' : puzzle.difficulty === 'medio' ? '🟠' : '🔴';
    const text = [
      `🔦 Faros #${getPuzzleNumber(puzzle.date)} · Luderis`,
      `${diffEmoji} ${puzzle.difficulty} (${puzzle.grid_size}×${puzzle.grid_size}) · ✅ ${formatTime(winTime)}`,
      `🔥 Racha: ${streak} ${streak === 1 ? 'día' : 'días'}`,
      `luderis.com/juegos`,
    ].join('\n');
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text)
        .then(() => toast('Resultado copiado ✓', 'success'))
        .catch(() => toast('No se pudo copiar', 'error'));
    }
  }, [puzzle, winTime, streak]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const conflicts = cellState && puzzle ? getConflicts(cellState) : [];
  const farosPlaced = cellState ? cellState.flat().filter(s => s === 'faro').length : 0;
  const N = puzzle?.grid_size ?? 6;
  const canVerify = farosPlaced === N && conflicts.length === 0 && !won;
  const puzzleNum = puzzle ? getPuzzleNumber(puzzle.date) : 0;

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 16px', fontFamily: FONT, color: C.muted }}>
        <div style={{ fontSize: 32 }}>🔦</div>
        <div style={{ fontSize: 14 }}>Cargando el puzzle de hoy…</div>
      </div>
    );
  }

  if (error === 'no_puzzle') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 16px', fontFamily: FONT, color: C.muted }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏗️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Puzzle en preparación</div>
        <div style={{ fontSize: 13 }}>El puzzle de hoy todavía no está listo. Volvé más tarde.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 16px', fontFamily: FONT, color: C.muted }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 13 }}>No se pudo cargar el puzzle. Revisá tu conexión.</div>
      </div>
    );
  }

  if (wonOnLoad && puzzle) {
    return (
      <FarosTomorrow
        streak={streak}
        winTime={winTime}
        difficulty={puzzle.difficulty}
        gridSize={puzzle.grid_size}
        puzzleNum={getPuzzleNumber(puzzle.date)}
        onShare={handleShare}
      />
    );
  }

  const diffEmoji = puzzle.difficulty === 'fácil' ? '🟡' : puzzle.difficulty === 'medio' ? '🟠' : '🔴';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: FONT, padding: '0 0 40px' }}>
      {/* ── Streak bar ── */}
      <FarosStreakBar streak={streak} timerActive={!!puzzle && !won} wonToday={won} />

      {/* ── Game card ── */}
      <div style={{
        background: C.card,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 32px rgba(26,110,216,.05)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0)',
          padding: '16px 20px 12px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
            🔦 Desafío del día
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>
            Faros <span style={{ fontSize: 13, fontWeight: 400, opacity: .75 }}>#{puzzleNum}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
              📅 {new Date(puzzle.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
              {diffEmoji} {puzzle.difficulty}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
              {N}×{N}
            </span>
          </div>
        </div>

        {/* Rules */}
        <div style={{
          padding: '11px 18px',
          background: '#F0F7FF',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 12, color: C.muted, lineHeight: 1.65,
        }}>
          <strong style={{ color: C.text }}>Reglas</strong>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { tag: '1', text: `Colocá exactamente un faro en cada región de color.` },
              { tag: '2', text: 'Solo puede haber un faro por fila y por columna.' },
              { tag: '3★', orange: true, text: 'Ningún faro puede estar junto a otro faro, ', bold: 'ni en diagonal.' },
            ].map(r => (
              <div key={r.tag} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{
                  background: r.orange ? '#E8881A' : C.accent,
                  color: '#fff', borderRadius: 4,
                  padding: '0 5px', fontSize: 10, fontWeight: 700,
                  flexShrink: 0, marginTop: 1,
                }}>{r.tag}</span>
                <span>{r.text}{r.bold && <strong style={{ color: C.text }}>{r.bold}</strong>}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid area */}
        <div style={{ padding: '16px 16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 11, color: '#C06A00', textAlign: 'center',
            background: 'rgba(255,225,100,.3)', border: '1px solid rgba(230,180,30,.4)',
            borderRadius: 8, padding: '4px 12px',
          }}>
            {puzzle.hints.length === 0
              ? '🧠 Sin pistas — ¡a pura lógica!'
              : `💡 ${puzzle.hints.length} faro${puzzle.hints.length !== 1 ? 's' : ''} ya colocado${puzzle.hints.length !== 1 ? 's' : ''} como pista`}
          </div>

          {cellState && (
            <FarosGrid
              gridSize={N}
              regions={puzzle.regions}
              cellState={cellState}
              conflicts={conflicts}
              hints={puzzle.hints}
              onCellClick={handleCellClick}
            />
          )}

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', fontSize: 11, color: C.muted }}>
            {Array.from({ length: N }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: REGION_PALETTE[i % 10].bg,
                  border: `1.5px solid ${REGION_PALETTE[i % 10].border}`,
                }} />
                {REGION_PALETTE[i % 10].name}
              </div>
            ))}
          </div>

          {!won && (
            <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: -4 }}>
              1 clic = marcar ✕ &nbsp;·&nbsp; 2 clics = poner faro &nbsp;·&nbsp; 3 clics = borrar
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{
          margin: '0 16px 2px',
          borderRadius: 10,
          padding: '9px 14px',
          fontSize: 12, fontWeight: 600, textAlign: 'center',
          background: won ? '#EBF8F4' : conflicts.length > 0 ? '#FFF5F5' : C.surface,
          color: won ? '#2EC4A0' : conflicts.length > 0 ? '#E53E3E' : C.muted,
          border: `1px solid ${won ? '#2EC4A044' : conflicts.length > 0 ? '#E53E3E44' : C.border}`,
          transition: 'all .2s',
        }}>
          {won
            ? `✓ ¡Resuelto en ${formatTime(winTime)}!`
            : conflicts.length > 0
            ? '⚠ Conflicto — ajustá la posición de los faros'
            : farosPlaced === puzzle.hints.length
            ? `Colocá los ${N - puzzle.hints.length} faros`
            : `${farosPlaced} de ${N} faros colocados · ${N - farosPlaced} restante${N - farosPlaced !== 1 ? 's' : ''}`}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '10px 16px 16px' }}>
          {won ? (
            <>
              <button onClick={handleShare} style={{
                flex: 1, padding: 11, borderRadius: 11, border: 'none',
                background: `linear-gradient(135deg,${C.accent},#2EC4A0)`,
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}>
                📤 Compartir
              </button>
              <button onClick={onBack} style={{
                flex: 1, padding: 11, borderRadius: 11,
                border: `1.5px solid ${C.border}`,
                background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT,
              }}>
                Volver a Explorar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => puzzle && setCellState(createCellState(puzzle.grid_size, puzzle.hints))}
                style={{
                  flex: 1, padding: 11, borderRadius: 11,
                  border: `1.5px solid ${C.border}`,
                  background: 'transparent',
                  color: C.muted, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                ↺ Reiniciar
              </button>
              <button
                onClick={handleVerify}
                disabled={!canVerify}
                style={{
                  flex: 1, padding: 11, borderRadius: 11, border: 'none',
                  background: `linear-gradient(135deg,${C.accent},#2EC4A0)`,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: canVerify ? 'pointer' : 'not-allowed',
                  opacity: canVerify ? 1 : .4,
                  fontFamily: FONT, transition: 'all .15s',
                }}
              >
                Verificar ✓
              </button>
            </>
          )}
        </div>
      </div>

      {/* Win overlay */}
      <FarosWinOverlay
        show={won}
        timeSeconds={winTime}
        streak={streak}
        puzzleNum={puzzleNum}
        difficulty={puzzle?.difficulty ?? 'fácil'}
        gridSize={N}
        onShare={handleShare}
        onBack={onBack}
      />
    </div>
  );
}
