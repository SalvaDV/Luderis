import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Grid3x3, Calendar, RotateCcw, Share2, ChevronLeft, Flame } from 'lucide-react';
import { C, FONT, toast } from './shared';
import * as sb from './supabase';
import { generateShikaku } from './shikakuGenerator';
import ShikakuGrid from './components/ShikakuGrid';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s) {
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toLocaleDateString('sv'); // 'sv' locale → YYYY-MM-DD (no TZ shift)
}

// Grid size: 6 on Mon/Tue, 7 on Wed-Thu-Sun, 8 on Fri-Sat
function sizeForDate(dateStr) {
  const dow = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun … 6=Sat
  if (dow === 1 || dow === 2) return 6; // Mon, Tue → easy
  if (dow === 5 || dow === 6) return 8; // Fri, Sat → hard
  return 7;                              // Wed, Thu, Sun → medium
}

function calcStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = todayStr();
  for (const d of sorted) {
    const diff = (new Date(cursor) - new Date(d)) / 86400000;
    if (diff === 0 || diff === 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

const DIFFICULTY = { 6: 'fácil', 7: 'medio', 8: 'difícil' };
const DIFF_COLOR  = { fácil: '#EAB308', medio: '#F97316', difícil: '#EF4444' };

// ── Win overlay (shown immediately when all rects are placed) ─────────────────
function WinOverlay({ show, timeSeconds, streak, N, onShare, onBack, wonOnLoad }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      animation: 'fadeIn .3s ease',
      fontFamily: FONT,
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{
        background: C.card,
        borderRadius: 24,
        padding: '32px 28px',
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 48px rgba(0,0,0,.25)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🟦</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 4 }}>
          {wonOnLoad ? '¡Ya lo resolviste hoy!' : '¡Puzzle resuelto!'}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
          Shikaku · {N}×{N}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>
              {formatTime(timeSeconds)}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>tiempo</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#F97316',
                          display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <Flame size={20} color="#F97316" strokeWidth={2} /> {streak}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>racha</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onShare} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg,#805AD5,#553C9A)`,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: FONT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Share2 size={15} strokeWidth={2} /> Compartir
          </button>
          <button onClick={onBack} style={{
            flex: 1, padding: '11px 0', borderRadius: 12,
            border: `1.5px solid ${C.border}`,
            background: 'transparent',
            color: C.muted, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: FONT,
          }}>
            Juegos
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Already-completed screen (shown when wonOnLoad) ────────────────────────────
function AlreadyDoneScreen({ N, timeSeconds, streak, onShare, onBack, placedRects, clues, puzzle }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: FONT, padding: '0 0 48px' }}>
      {/* Header card */}
      <div style={{
        background: C.card,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(128,90,213,.08)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg,#4A1D96,#805AD5,#553C9A)',
          padding: '16px 20px 14px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)',
                        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
            <Grid3x3 size={11} color="rgba(255,255,255,.7)" strokeWidth={2}
                     style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Puzzle del día
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>
            Shikaku <span style={{ fontSize: 13, fontWeight: 400, opacity: .75 }}>
              {N}×{N}
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🟦</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
            ¡Ya lo resolviste hoy!
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            Tiempo: <strong style={{ color: C.accent }}>{formatTime(timeSeconds)}</strong>
            {'  ·  '}
            Racha: <strong style={{ color: '#F97316' }}>🔥 {streak}</strong>
          </div>

          {/* Solution grid (read-only) */}
          <ShikakuGrid
            N={N}
            clues={clues}
            placedRects={placedRects}
            onPlace={() => {}}
            onRemove={() => {}}
            won
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onShare} style={{
              flex: 1, padding: 11, borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#805AD5,#553C9A)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Share2 size={15} strokeWidth={2} /> Compartir
            </button>
            <button onClick={onBack} style={{
              flex: 1, padding: 11, borderRadius: 12,
              border: `1.5px solid ${C.border}`,
              background: 'transparent',
              color: C.muted, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
            }}>
              Juegos
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0 0', fontSize: 13, color: C.muted }}>
        Volvé mañana para el siguiente puzzle
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ShikakuPage
// Props: session, onBack (() => void), onWin (() => void)
// ═══════════════════════════════════════════════════════════════════════════════
export default function ShikakuPage({ session, onBack, onWin }) {
  const date = todayStr();
  const N    = sizeForDate(date);
  const diff = DIFFICULTY[N];

  // Generate puzzle (deterministic — same every render for the same date)
  const puzzle = React.useMemo(() => generateShikaku(date, N), [date, N]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [placedRects,setPlacedRects]= useState([]);
  const [won,        setWon]        = useState(false);
  const [wonOnLoad,  setWonOnLoad]  = useState(false);
  const [winTime,    setWinTime]    = useState(0);
  const [streak,     setStreak]     = useState(0);
  const [elapsed,    setElapsed]    = useState(0);

  const startTimeRef   = useRef(Date.now());
  const timerRef       = useRef(null);
  const savedRef       = useRef(false);
  const colorCounterRef= useRef(0);

  // ── Load today's result (already solved?) ──────────────────────────────────
  useEffect(() => {
    if (!session?.access_token) return;
    let mounted = true;

    sb.getShikakuResult(session.access_token, date)
      .then(result => {
        if (!mounted) return;
        if (result) {
          // Already solved today — show completed state
          setWon(true);
          setWonOnLoad(true);
          setWinTime(result.time_seconds ?? 0);
          savedRef.current = true;
          // Reconstruct the solution visually
          const solutionRects = puzzle.solution.map((r, i) => ({
            ...r, colorIdx: i % 20,
          }));
          setPlacedRects(solutionRects);
          onWin?.();
        }
      })
      .catch(() => {/* no data = not solved */})
      .finally(() => { if (mounted) setLoading(false); });

    // Load streak
    sb.getShikakuStreak(session.access_token)
      .then(dates => { if (mounted) setStreak(calcStreak(dates)); })
      .catch(() => {});

    return () => { mounted = false; };
  }, [session?.access_token]); // eslint-disable-line

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || won) { clearInterval(timerRef.current); return; }
    startTimeRef.current = Date.now() - elapsed * 1000; // preserve elapsed across re-renders
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, won]); // eslint-disable-line

  // ── Win detection ──────────────────────────────────────────────────────────
  const totalArea = placedRects.reduce((s, r) => s + r.h * r.w, 0);
  const isWon     = !wonOnLoad && totalArea === N * N;

  useEffect(() => {
    if (!isWon || savedRef.current) return;
    savedRef.current = true;
    const time = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setWinTime(time);
    setWon(true);
    setStreak(s => s + 1);
    clearInterval(timerRef.current);
    onWin?.();
    sb.submitShikakuResult(session.access_token, date, time)
      .catch(e => console.error('[Shikaku] save error', e));
  }, [isWon]); // eslint-disable-line

  // ── Place / Remove handlers ────────────────────────────────────────────────
  const handlePlace = useCallback((rect) => {
    const colorIdx = colorCounterRef.current % 20;
    colorCounterRef.current++;
    setPlacedRects(prev => [...prev, { ...rect, colorIdx }]);
  }, []);

  const handleRemove = useCallback((rect) => {
    setPlacedRects(prev => prev.filter(r => r !== rect));
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (won) return;
    setPlacedRects([]);
    colorCounterRef.current = 0;
    startTimeRef.current = Date.now();
    setElapsed(0);
  }, [won]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const diffEmoji = N === 6 ? '🟡' : N === 7 ? '🟠' : '🔴';
    const text = [
      `🟦 Shikaku · ${N}×${N} · Luderis`,
      `${diffEmoji} ${diff} · ✅ ${formatTime(won ? winTime : elapsed)}`,
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
  }, [N, diff, won, winTime, elapsed, streak]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '64px 16px', fontFamily: FONT, color: C.muted,
      }}>
        <Grid3x3 size={32} color={C.muted} strokeWidth={1.5} />
        <div style={{ fontSize: 14 }}>Cargando el puzzle de hoy…</div>
      </div>
    );
  }

  // ── Already solved ─────────────────────────────────────────────────────────
  if (wonOnLoad) {
    return (
      <AlreadyDoneScreen
        N={N}
        timeSeconds={winTime}
        streak={streak}
        onShare={handleShare}
        onBack={onBack}
        placedRects={placedRects}
        clues={puzzle.clues}
        puzzle={puzzle}
      />
    );
  }

  // ── Game stats ─────────────────────────────────────────────────────────────
  const rectCount  = placedRects.length;
  const totalRects = puzzle.clues.length;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: FONT, padding: '0 0 48px' }}>

      {/* ── Streak / timer bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0 12px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, color: '#F97316',
        }}>
          <Flame size={16} color="#F97316" strokeWidth={2} />
          {streak} {streak === 1 ? 'día' : 'días'}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800, color: C.text,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 1,
        }}>
          {formatTime(elapsed)}
        </div>
      </div>

      {/* ── Game card ──────────────────────────────────────────────────────── */}
      <div style={{
        background: C.card,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 32px rgba(128,90,213,.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#4A1D96,#805AD5,#553C9A)',
          padding: '16px 20px 12px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)',
                        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
            <Grid3x3 size={11} color="rgba(255,255,255,.7)" strokeWidth={2}
                     style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Desafío del día
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>
            Shikaku <span style={{ fontSize: 13, fontWeight: 400, opacity: .75 }}>
              #{N}×{N}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
              <Calendar size={11} strokeWidth={2}
                        style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {new Date(date + 'T12:00:00').toLocaleDateString('es-AR',
                { day: 'numeric', month: 'long' })}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600,
                           color: DIFF_COLOR[diff] ?? 'rgba(255,255,255,.75)' }}>
              ● {diff}
            </span>
          </div>
        </div>

        {/* Rules */}
        <div style={{
          padding: '10px 18px',
          background: '#F5F0FF',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 12, color: C.muted, lineHeight: 1.65,
        }}>
          <strong style={{ color: C.text }}>Cómo jugar</strong>
          <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { tag: '1', text: 'Arrastrá para dibujar un rectángulo alrededor de cada número.' },
              { tag: '2', text: 'El rectángulo debe tener exactamente el área que indica el número.' },
              { tag: '3', text: 'Todos los casilleros deben quedar cubiertos por algún rectángulo.' },
            ].map(r => (
              <div key={r.tag} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{
                  background: '#805AD5', color: '#fff', borderRadius: 4,
                  padding: '0 5px', fontSize: 10, fontWeight: 700,
                  flexShrink: 0, marginTop: 1,
                }}>{r.tag}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid area */}
        <div style={{ padding: '16px 16px 10px' }}>
          <ShikakuGrid
            N={N}
            clues={puzzle.clues}
            placedRects={placedRects}
            onPlace={handlePlace}
            onRemove={handleRemove}
            won={won}
          />
          <div style={{
            fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8,
          }}>
            Arrastrá para colocar · Tocá un rectángulo para borrarlo
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          margin: '0 16px 2px',
          borderRadius: 10,
          padding: '9px 14px',
          fontSize: 12, fontWeight: 600, textAlign: 'center',
          background: won
            ? '#EBF8F4'
            : rectCount === totalRects
            ? '#F0FFF4'
            : C.surface,
          color: won
            ? '#2EC4A0'
            : C.muted,
          border: `1px solid ${won ? '#2EC4A044' : C.border}`,
          transition: 'all .2s',
        }}>
          {won
            ? `✓ ¡Resuelto en ${formatTime(winTime)}!`
            : `${rectCount} de ${totalRects} rectángulos colocados`}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '10px 16px 16px' }}>
          {won ? (
            <>
              <button onClick={handleShare} style={{
                flex: 1, padding: 11, borderRadius: 11, border: 'none',
                background: 'linear-gradient(135deg,#805AD5,#553C9A)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}>
                📤 Compartir
              </button>
              <button onClick={onBack} style={{
                flex: 1, padding: 11, borderRadius: 11,
                border: `1.5px solid ${C.border}`,
                background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}>
                ← Juegos
              </button>
            </>
          ) : (
            <>
              <button onClick={handleReset} style={{
                flex: 1, padding: 11, borderRadius: 11,
                border: `1.5px solid ${C.border}`,
                background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <RotateCcw size={14} strokeWidth={2} /> Reiniciar
              </button>
              <button onClick={onBack} style={{
                padding: '11px 18px', borderRadius: 11,
                border: `1.5px solid ${C.border}`,
                background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <ChevronLeft size={15} strokeWidth={2} /> Juegos
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Win overlay ────────────────────────────────────────────────────── */}
      <WinOverlay
        show={won && !wonOnLoad}
        timeSeconds={winTime}
        streak={streak}
        N={N}
        onShare={handleShare}
        onBack={onBack}
        wonOnLoad={wonOnLoad}
      />
    </div>
  );
}
