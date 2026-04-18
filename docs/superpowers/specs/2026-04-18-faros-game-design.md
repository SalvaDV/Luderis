# Faros — Diseño del Juego

**Fecha:** 2026-04-18  
**Estado:** Aprobado — listo para implementación

---

## Resumen

Faros es un puzzle lógico diario dentro de la app Luderis. Todos los usuarios juegan el mismo puzzle cada día. El objetivo es colocar faros en una grilla de regiones de color siguiendo tres reglas estrictas. El puzzle es siempre resoluble por deducción pura, sin prueba y error.

---

## Ubicación en la app

- **Navegación:** ítem "Juegos" en la barra lateral (sidebar), requiere login.
- **Badge de notificación:** círculo rojo junto al ítem "Juegos" que aparece cada día al inicio y desaparece cuando el usuario gana el puzzle del día.
- **Ruta:** `/juegos` o subruta, a definir en implementación.

---

## Reglas del juego

1. Colocá exactamente **un faro** en cada región de color.
2. Solo puede haber **un faro por fila y por columna**.
3. Ningún faro puede estar junto a otro faro, **ni en diagonal** (celdas no pueden ser contiguas en 8 direcciones).

---

## Grilla

- **Tamaño variable:** entre 6×6 y 10×10, determinado por el puzzle del día.
- **Regiones:** N regiones irregulares de color (una por fila/columna). Cada región es contigua (conectada).
- **Sin feedback automático de bloqueo:** al colocar un faro, la app no colorea las celdas bloqueadas. El jugador deduce eso solo.

---

## Interacción celda a celda

Ciclo de 3 estados por tap:

```
vacío → ✕ (marca "acá no va un faro") → faro → vacío
```

- **✕** sirve de memo personal. El jugador lo usa donde deduce que no puede ir un faro.
- El ✕ se muestra en el color de la región de esa celda (sutil, bajo opacidad).
- Las celdas de pista (hint) no son interactuables — siempre muestran el faro pre-colocado con un halo blanco que indica que están bloqueadas.

---

## Feedback visual

| Situación | Visual |
|-----------|--------|
| Dos faros en conflicto (misma fila, col o diagonal contigua) | Overlay rojo en ambas celdas |
| Todos los faros colocados sin conflictos | Status bar verde + "Verificar" habilitado |
| Puzzle incompleto | Status bar gris con conteo de faros restantes |

No hay zonas amarillas ni naranjas automáticas. Solo rojo de conflicto.

---

## Pistas (hints)

- Cada puzzle tiene **2 faros pre-colocados** (hints) que no se pueden mover.
- Los hints se eligen para crear una cadena de deducción en cascada: con esos 2 dados, el jugador puede forzar los N-2 restantes por lógica pura, uno a uno.
- Visual: mismo ícono de faro pero con halo blanco y cursor `default`.

---

## Ícono de faro

SVG inline: silueta de faro (cúpula triangular + sala de linterna + torre cónica + base), en blanco sobre el círculo de color de la región. Se muestra en rojo cuando hay conflicto.

---

## Estado de victoria

Al presionar "Verificar" con solución correcta:

- **No se puede volver al puzzle** — el estado queda bloqueado.
- Se muestra overlay de victoria con:
  - Tiempo transcurrido
  - Racha de días consecutivos
  - Posición en ranking del día
  - Botón **"Compartir resultado"** — copia texto al portapapeles (estilo Wordle)
  - Botón **"Volver a Explorar"** — navega a la sección Explorar
- El badge rojo de "Juegos" desaparece.
- El resultado se guarda en `puzzle_results`.

---

## Racha (streak)

- Se incrementa cada vez que el usuario completa el puzzle del día.
- Si el usuario se salta un día, la racha vuelve a 0.
- Se guarda por usuario en `puzzle_results` (calculado desde los registros).

---

## Compartir resultado

Texto copiable (sin spoilers):

```
🔦 Faros #043 · Luderis
🟡 Fácil (6×6) · ✅ 03:24
🔥 Racha: 8 días
luderis.com/juegos
```

---

## Base de datos

### Tabla `puzzles`

```sql
CREATE TABLE puzzles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date UNIQUE NOT NULL,
  grid_size   int  NOT NULL CHECK (grid_size BETWEEN 6 AND 10),
  regions     jsonb NOT NULL,   -- array 2D [row][col] → índice de región (0-based)
  hints       jsonb NOT NULL,   -- array de [row, col]
  solution    jsonb NOT NULL,   -- array de [row, col] ordenado por región
  colors      jsonb NOT NULL,   -- array de índices al REGION_PALETTE global (ver sección Paleta)
  difficulty  text NOT NULL,    -- 'fácil' | 'medio' | 'difícil'
  created_at  timestamptz DEFAULT now()
);
```

### Tabla `puzzle_results`

```sql
CREATE TABLE puzzle_results (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) NOT NULL,
  puzzle_id    uuid REFERENCES puzzles(id) NOT NULL,
  completed_at timestamptz DEFAULT now(),
  time_seconds int NOT NULL,
  UNIQUE(user_id, puzzle_id)
);
```

### RLS

- `puzzles`: lectura pública (sin auth). Escritura solo desde service role (generación).
- `puzzle_results`: lectura y escritura solo para el propio usuario (`user_id = auth.uid()`).

---

## Generación de puzzles

### Proceso (script/CRON nocturno)

Genera puzzles para los próximos 7 días. Para cada puzzle:

1. **Elegir tamaño** N entre 6 y 10 (aleatorio, ponderado para que los tamaños grandes sean menos frecuentes).
2. **Generar solución válida:** colocar N faros en posiciones que cumplan las 3 reglas (sin misma fila/col, sin 8-adyacencia). Algoritmo de backtracking con poda.
3. **Diseñar regiones:** flood-fill irregular partiendo de cada celda solución, asegurando que cada región sea contigua y contenga exactamente una celda solución.
4. **Elegir hints mínimos:** usar un solver de propagación de restricciones para determinar cuáles 2 celdas solución, si se dan como pistas, permiten resolver el resto por deducción pura sin backtracking.
5. **Validar:** correr el solver con las hints elegidas. Si resuelve sin backtracking → puzzle válido. Si no → reintentar desde paso 3.
6. **Clasificar dificultad:** por tamaño y número de pasos de deducción necesarios.
7. **Guardar** en tabla `puzzles`.

### Solver de propagación de restricciones

Para cada puzzle candidato, el solver:
- Mantiene el conjunto de celdas candidatas para cada región.
- En cada paso: si una región tiene exactamente 1 celda candidata válida → la asigna y elimina esa fila/col/adyacentes del resto de regiones.
- Repite hasta resolver o bloquearse.
- Si resuelve sin backtracking → "lógicamente resoluble".

### Dónde corre

- **Supabase Edge Function** con trigger por CRON (`pg_cron` o scheduled task externo).
- Llamada una vez por día, genera los 7 días siguientes, saltea fechas ya existentes.

---

## Badge de notificación en sidebar

- Al cargar la app (si está logueado), consulta si existe un `puzzle_result` para `user_id = auth.uid()` y `puzzle.date = today`.
- Si no existe → mostrar badge rojo en "Juegos".
- Si existe → sin badge.
- El badge desaparece en tiempo real cuando el usuario completa el puzzle (sin reload).

---

## Componentes principales (React)

| Componente | Responsabilidad |
|------------|-----------------|
| `FarosPage` | Shell: carga puzzle del día desde Supabase, maneja estado de victoria |
| `FarosGrid` | Renderiza la grilla, maneja clicks, devuelve estado via callback |
| `FarosCell` | Celda individual: 3 estados, hint vs normal, overlay de conflicto |
| `FarosRules` | Sección de reglas (estática, recibe grid_size para ajustar texto) |
| `FarosWinOverlay` | Overlay de victoria: stats, compartir, volver |
| `FarosStreakBar` | Barra de racha y días de la semana |

---

## Paleta de colores de regiones

La paleta está definida como constante global con exactamente **10 colores**, usados en orden para cada puzzle (los primeros N para una grilla N×N). Los colores deben ser distinguibles entre sí independientemente del tamaño del puzzle.

Criterios:
- Diferencia de hue ≥ 25° entre cualquier par de colores adyacentes en la paleta.
- Variación adicional en saturación/luminosidad para no depender solo del hue.
- Distinguibles para los tipos más comunes de daltonismo (deuteranopia / protanopia) mediante diferencia de luminancia cuando el hue es similar.
- Se usa el mismo orden siempre para que el jugador los reconozca de un día al otro.

Paleta de referencia (10 colores):

| # | Nombre    | BG       | Border   |
|---|-----------|----------|----------|
| 0 | Azul      | #D4E8FF  | #1A6ED8  |
| 1 | Verde     | #CCF5EC  | #2EC4A0  |
| 2 | Naranja   | #FFE8CC  | #E8881A  |
| 3 | Violeta   | #EAE0FF  | #7B5CF0  |
| 4 | Dorado    | #FFF4CC  | #F59E0B  |
| 5 | Rojo      | #FFE0E0  | #E53E3E  |
| 6 | Celeste   | #CCF0FF  | #0EA5E9  |
| 7 | Rosa      | #FFE4F0  | #EC4899  |
| 8 | Lima      | #E8FFD4  | #65A30D  |
| 9 | Índigo    | #E0E8FF  | #4F46E5  |

La implementación valida que los 10 colores sean perceptualmente distinguibles antes de deploy. Si en el futuro se detecta un par problemático para daltonismo, se ajusta el color individual sin cambiar la estructura.

---

## Fuera de scope (esta iteración)

- Modo práctica (puzzles anteriores).
- Rankings históricos.
- Múltiples juegos bajo "Juegos".
- Puzzle hints dinámicos (pedir ayuda en mitad del juego).
