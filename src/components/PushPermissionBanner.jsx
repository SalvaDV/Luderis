import React from 'react';
import { FONT, LUD } from '../shared';

export default function PushPermissionBanner({ onAccept, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9997, background: '#0D1F3C', color: '#fff', fontFamily: FONT,
      padding: '14px 18px', borderRadius: 14, display: 'flex', alignItems: 'center',
      gap: 14, boxShadow: '0 4px 24px rgba(0,0,0,.35)',
      maxWidth: 420, width: 'calc(100% - 32px)',
      animation: 'fadeSlideUp .25s ease',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, flex: 1 }}>
        Activá notificaciones para mensajes y ofertas en tiempo real.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onDismiss} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,.3)',
          borderRadius: 20, color: 'rgba(255,255,255,.6)', padding: '7px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
        }}>
          Ahora no
        </button>
        <button onClick={onAccept} style={{
          background: LUD.grad, border: 'none', borderRadius: 20,
          color: '#fff', padding: '7px 16px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: FONT,
        }}>
          Activar
        </button>
      </div>
    </div>
  );
}
