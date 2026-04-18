// ── Paleta de 10 colores distinguibles para regiones ─────────────────────────
// Siempre se usan los primeros N para una grilla N×N.
export const REGION_PALETTE = [
  { bg: '#D4E8FF', border: '#1A6ED8', dark: '#1A6ED8', name: 'Azul' },
  { bg: '#CCF5EC', border: '#2EC4A0', dark: '#1A9A80', name: 'Verde' },
  { bg: '#FFE8CC', border: '#E8881A', dark: '#C06A00', name: 'Naranja' },
  { bg: '#EAE0FF', border: '#7B5CF0', dark: '#5B3CD0', name: 'Violeta' },
  { bg: '#FFF4CC', border: '#F59E0B', dark: '#B45309', name: 'Dorado' },
  { bg: '#FFE0E0', border: '#E53E3E', dark: '#C53030', name: 'Rojo' },
  { bg: '#CCF0FF', border: '#0EA5E9', dark: '#0077C2', name: 'Celeste' },
  { bg: '#FFE4F0', border: '#EC4899', dark: '#C2306E', name: 'Rosa' },
  { bg: '#E8FFD4', border: '#65A30D', dark: '#3F6700', name: 'Lima' },
  { bg: '#E0E8FF', border: '#4F46E5', dark: '#3730A3', name: 'Índigo' },
];

// SVG inline del faro — cúpula + linterna + torre cónica + base
export const LIGHTHOUSE_SVG = `<svg viewBox="0 0 20 26" fill="white" xmlns="http://www.w3.org/2000/svg">
  <polygon points="10,1 6,5.5 14,5.5"/>
  <rect x="7" y="5.5" width="6" height="3.5" rx="1"/>
  <path d="M8.5 9 L8 19 L12 19 L11.5 9 Z"/>
  <rect x="6.5" y="19" width="7" height="3.5" rx="1"/>
</svg>`;

// Crea el estado inicial de la grilla: todas las celdas null excepto las hints ('faro')
export function createCellState(gridSize, hints) {
  const state = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  for (const [r, c] of hints) {
    state[r][c] = 'faro';
  }
  return state;
}

// Ciclo de 3 estados: null → 'cross' → 'faro' → null. Retorna nuevo array (inmutable).
// Las celdas hint no se pueden tocar.
export function toggleCell(state, r, c, hints) {
  const isHint = hints.some(([hr, hc]) => hr === r && hc === c);
  if (isHint) return state;
  const next = state.map(row => [...row]);
  const cur = next[r][c];
  next[r][c] = cur === null ? 'cross' : cur === 'cross' ? 'faro' : null;
  return next;
}

// Devuelve array de [r,c] de faros en conflicto (misma fila/col o adyacentes en 8 dir)
export function getConflicts(state) {
  const N = state.length;
  const faros = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (state[r][c] === 'faro') faros.push([r, c]);
    }
  }
  const conflictSet = new Set();
  for (let i = 0; i < faros.length; i++) {
    for (let j = i + 1; j < faros.length; j++) {
      const [r1, c1] = faros[i];
      const [r2, c2] = faros[j];
      const clash =
        r1 === r2 ||
        c1 === c2 ||
        (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1);
      if (clash) {
        conflictSet.add(`${r1},${c1}`);
        conflictSet.add(`${r2},${c2}`);
      }
    }
  }
  return [...conflictSet].map(k => k.split(',').map(Number));
}

// Verifica si el puzzle está resuelto:
// N faros, sin conflictos, un faro por región.
export function checkWin(state, regions) {
  const N = state.length;
  const faros = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (state[r][c] === 'faro') faros.push([r, c]);
    }
  }
  if (faros.length !== N) return false;
  if (getConflicts(state).length > 0) return false;
  const regionsWithFaro = new Set(faros.map(([r, c]) => regions[r][c]));
  return regionsWithFaro.size === N;
}

// Formatea segundos como mm:ss
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
