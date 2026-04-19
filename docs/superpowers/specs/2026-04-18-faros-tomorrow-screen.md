# Faros — Pantalla "Volvé Mañana"

**Fecha:** 2026-04-18  
**Estado:** Aprobado — listo para implementación

---

## Resumen

Cuando un usuario ya ganó el puzzle del día y vuelve a abrir la sección "Juegos" (ya sea recargando la página o navegando desde otro lado), en lugar de ver el tablero bloqueado con la solución visible, ve una pantalla de espera que le confirma que ya jugó, le muestra sus stats del día, un countdown hasta el próximo puzzle y un botón para compartir su resultado.

---

## Flujo completo

```
Usuario gana por primera vez hoy
  → Win overlay (ya existente, no cambia)
  → Usuario hace clic en "Compartir" o "Volver a Explorar"

Usuario vuelve a "Juegos" más tarde (mismo día)
  → FarosPage carga, useEffect detecta resultado en DB
  → Se renderiza FarosTomorrow en lugar del tablero
  → Sin overlay, sin grid, sin botones de juego
```

El overlay existente (`FarosWinOverlay`) no se modifica. Solo cambia lo que se ve cuando el usuario vuelve al juego después de haberlo cerrado.

---

## Componente: `FarosTomorrow`

**Archivo:** `src/components/FarosTomorrow.jsx`

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `streak` | integer | Racha actual (días consecutivos ganados) |
| `winTime` | integer | Tiempo en segundos que tardó hoy |
| `difficulty` | string | `'fácil'` \| `'medio'` \| `'difícil'` |
| `gridSize` | integer | Tamaño del grid de hoy (6–10) |
| `puzzleNum` | integer | Número del puzzle de hoy |
| `onShare` | function | Reutiliza `handleShare` de FarosPage |

### Contenido visual (de arriba a abajo)

1. **Emoji + título:** `🔦 ¡Ya jugaste hoy!`
2. **Subtítulo:** `Faros #X · 🟡 fácil · 6×6` (datos del puzzle de hoy)
3. **Stats del día** — dos columnas en una card:
   - Tiempo: `formatTime(winTime)`
   - Racha: `🔥 N días`
4. **Countdown** — texto grande `HH:MM:SS` con label "Próximo Faros en"
   - Se actualiza cada segundo con `setInterval`
   - Cuenta hasta medianoche hora local (`new Date()` con horas/minutos/segundos en 0 del día siguiente)
   - Cuando llega a 00:00:00, muestra "¡Ya disponible! Recargá la página"
5. **Botón "📤 Compartir resultado"** — llama a `onShare`

### Estilo

Inline styles siguiendo el patrón del proyecto (`C` de `shared.js`, `FONT`). Card centrada con `maxWidth: 400`, sin grid visible, sin botones de juego.

---

## Cambios en `FarosPage.jsx`

### Estado nuevo

```js
const [wonOnLoad, setWonOnLoad] = useState(false);
```

Se activa **solo** en el `useEffect`, cuando `getTodaysPuzzleResult` devuelve un resultado existente:

```js
if (result) {
  setWon(true);
  setWonOnLoad(true);   // ← nuevo
  setWinTime(result.time_seconds);
  setCellState(createCellState(p.grid_size, p.solution));
}
```

Cuando el usuario gana en la sesión actual (`handleVerify`), `wonOnLoad` queda en `false`.

### Render

Agregar este bloque **antes** del return principal (después de los estados de loading/error):

```jsx
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
```

El tablero bloqueado (estado actual al recargar después de ganar) desaparece completamente.

---

## Lo que NO cambia

- `FarosWinOverlay` — el overlay inmediato post-victoria no se toca.
- `FarosStreakBar` — sigue apareciendo en el juego activo. No aparece en la pantalla `FarosTomorrow` (ya muestra la racha inline).
- La lógica de streak (`calcStreak`) — ya corta si falta un día, no hay nada que cambiar.
- El badge rojo en el sidebar — ya desaparece al ganar, esto no afecta esa lógica.

---

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/components/FarosTomorrow.jsx` | Crear |
| `src/FarosPage.jsx` | Agregar `wonOnLoad` state + render condicional + import |
