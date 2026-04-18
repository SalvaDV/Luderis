import React, { useState, useEffect, useRef } from 'react';
import { C, FONT } from '../shared';
import { formatTime } from '../FarosGameLogic';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Streak bar + live timer.
 * Props:
 *   streak      - integer consecutive days
 *   timerActive - boolean: whether timer should tick
 *   wonToday    - boolean: stops timer, shows checkmark
 */
export default function FarosStreakBar({ streak, timerActive, wonToday }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!timerActive || wonToday) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerActive, wonToday]);

  // Build 7-day dots based on today's day of week
  const todayDow = new Date().getDay(); // 0=Sunday
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // convert to Mon=0

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
      boxShadow: '0 2px 12px rgba(26,110,216,.04)',
      fontFamily: FONT,
    }}>
      <div style={{ fontSize: 24 }}>🔥</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#E8881A' }}>
          {streak} {streak === 1 ? 'día seguido' : 'días seguidos'}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {wonToday ? '✓ Completado hoy' : `⏱ ${formatTime(elapsed)}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        {DAYS.map((d, i) => {
          const isToday = i === todayIdx;
          const isDone = i < todayIdx || (isToday && wonToday);
          return (
            <div key={d} style={{
              width: 26, height: 26, borderRadius: '50%',
              border: `2px solid ${isDone ? '#E8881A' : isToday ? '#E8881A' : C.border}`,
              background: isDone ? '#E8881A' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
              color: isDone ? '#fff' : isToday ? '#E8881A' : C.muted,
            }}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
