import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { C, FONT } from '../shared';

function getSecondsToMidnight() {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // próxima medianoche hora local
  return Math.max(0, Math.floor((midnight - now) / 1000));
}

function formatCountdown(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

/**
 * CountdownTimer
 * Shows HH:MM:SS countdown to midnight (next daily puzzle).
 * Switches to a "ready!" message once it reaches zero.
 *
 * Props:
 *   label       — string shown above the clock  (default: "Próximo puzzle en")
 *   accentColor — hex color for the "ready" text (default: C.accent)
 */
export default function CountdownTimer({ label = 'Próximo puzzle en', accentColor }) {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsToMidnight);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(getSecondsToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  if (secondsLeft <= 0) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 5 }}>
          <Trophy size={22} color="#F59E0B" strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: accentColor || C.accent, fontFamily: FONT }}>
          ¡El nuevo puzzle ya está disponible!
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          Recargá la página para jugar
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 11, color: C.muted, fontWeight: 600,
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 34, fontWeight: 800, color: C.text,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 3,
        fontFamily: FONT, lineHeight: 1,
      }}>
        {formatCountdown(secondsLeft)}
      </div>
    </div>
  );
}
