# Auditoría integral — hallazgos (2026-08-04)

> Corrida con el prompt de `docs/auditoria-integral-prompt.md`, en 4 pistas paralelas.
> Estado: backend-seguridad y arquitectura-performance COMPLETAS; frontend/a11y y
> datos/tests/legal en curso al momento de escribir esto.
>
> **La pista de seguridad backend verificó el estado real contra la DB de producción**
> (`hptdyehzqfpgtrpuydny`) con consultas de solo lectura sobre `pg_policies`,
> `information_schema.column_privileges`, `pg_proc`, `cron.job` y los advisors — no solo
> contra el repo. Eso es lo que destapó C1–C3, invisibles desde `supabase/migrations/`.

---

## ESTADO DE REMEDIACIÓN (2026-08-04)

**Arreglado en código** (92 tests verdes, ESLint/tsc limpios, build OK):
C4, C5, D1, A4, D4, M9 (edge functions de dinero) · A1, M1, M2, M3, M4, B6
(auth y abuso) · F2, F3, F5, F6 (a11y, anti-puenteo, contraste) · password 8+,
atajo de admin solo en dev, `react-router-dom` a 7.18.2, 4 deps muertas fuera.
Se creó `supabase/functions/stripe-webhook/` (no existía) y el cliente dejó de
insertar la inscripción.

### Validación de las migraciones (2026-08-04)

**El branching de Supabase requiere plan Pro** y el proyecto está en Free (mismo
motivo por el que está deshabilitada la protección de contraseñas filtradas). El
stack local tampoco corre: hay CLI de Supabase pero no Docker.

Se validaron entonces contra producción **dentro de una transacción revertida**
(`begin; … rollback;`, con la semántica de rollback verificada primero con una
tabla de prueba). Nada persistió: al terminar, producción sigue con la policy
vieja `inscripciones update own or owner`, sin las RPCs nuevas y sin la columna
`monto_liberado`.

Las 4 migraciones aplican sin errores. Resultados funcionales:

| Prueba | Resultado |
|---|---|
| Alumno se inscribe por RPC `inscribirse()` | ✅ devuelve id |
| **C1** — alumno escribe `mp_payment_id` por PATCH | ✅ `permission denied` |
| **C3** — alumno se declara `pagado_mp` | ✅ `permission denied` |
| **C2** — docente escribe `alumno_confirmada` de su alumno | ✅ `permission denied` |
| Alumno confirma lo suyo (flujo legítimo) | ✅ permitido |
| Docente finaliza por RPC | ✅ `{ok:true, finalizadas:1}` |
| No-autor intenta finalizar | ✅ `{error:"No autorizado"}` |
| `perf_rls_e_indices` | ✅ 113 policies reescritas, 0 sin envolver |
| **A3** — `liberar_pago_clase` llamada dos veces por la misma clase | ✅ 2ª devuelve `ya_liberado`, no acredita |
| Prorrateo de paquete (hold 900 / 4 clases) | ✅ 225 por clase (antes usaba `clases_totales` como monto) |
| Hold tras 2 de 4 clases | ✅ queda `pendiente` con 450 liberados (antes se cerraba entero y varaba el resto) |
| Saldo del docente tras 3 llamadas (una repetida) | ✅ 450 = 2 × 225, sin doble acreditación |

---

### ✅ APLICADO EN PRODUCCIÓN (2026-08-04)

Tres migraciones aplicadas, elegidas por ser las que **no rompen el código
desplegado hoy** (la rama con los cambios de frontend todavía no está en main):

| Migración | Qué cierra |
|---|---|
| `fix_liberar_pago_clase_cas_y_prorrateo` | A3: race condition, prorrateo roto y hold varado |
| `hardening_policies_grants_y_checks` | M6 (grants por columna en `usuarios`), M7 (referidos y anuncios), A5 (revokes que nunca surtieron efecto), CHECK de `estado_escrow`, `metricas_docente` fuera de anon |
| `perf_rls_initplan_e_indices_fk` | 113 policies a InitPlan + 20 índices de FK |

Efecto medido en los advisors:

| Advisor | Antes | Después |
|---|---|---|
| Performance (total) | 279 | **167** |
| ├ `auth_rls_initplan` | 113 | **0** |
| ├ `unindexed_foreign_keys` | 19 | **0** |
| └ `unused_index` | 24 | 44 (los 20 nuevos, sin tráfico todavía) |
| Seguridad (total) | 34 | **28** |
| ├ funciones ejecutables por `anon` | 6 | **1** (`incrementar_vistas`, intencional) |
| └ `rls_enabled_no_policy` | 4 | **2** (ambas correctas: solo service_role) |

### ⚠️ Corrección importante encontrada al aplicar

Dos policies que había escrito en `hardening_policies` **habrían roto la app**, y
el test de "la migración aplica sin errores" no lo detectaba. Se movieron a
`20260804_pendiente_notificaciones.sql`, comentadas y con el motivo:

- **`notificaciones`**: la app inserta notificaciones para terceros desde el
  cliente en 8 lugares legítimos (chat, ofertas, preguntas, ayudantes, finalizar
  clase). Necesita una RPC `notificar()` que valide la relación, más migrar esos
  call-sites.
- **`alertas_digest_queue`**: `dispararAlertas` (`supabase.ts:1175`) inserta
  digests para otros usuarios al publicar — la feature usa el agujero como
  mecanismo. Necesita mover `dispararAlertas` a una edge function, que ya estaba
  pendiente por performance.

Lección: *aplica limpio* no es lo mismo que *no rompe nada*. Hay que cruzar cada
revoke contra los call-sites reales del frontend.

**Bug lateral detectado**: `OnboardingModal.jsx:462` manda `modalidad_preferida`
y `presupuesto` en el update de `usuarios`, y **esas columnas no existen**. El
`.catch(()=>{})` se lo traga, así que las preferencias del onboarding nunca se
guardaron.

---

**Escrito pero SIN APLICAR** — `20260804_lockdown_inscripciones.sql` (+ las dos
policies pendientes de arriba):
`lockdown_inscripciones` (C1, C2, C3), `fix_liberar_pago_clase` (A3),
`hardening_policies` (F1, A2, M6, M7, A5, CHECK de estado_escrow),
`perf_rls_e_indices` (113 InitPlan + 20 índices). **Requieren backup y branch de
Supabase**, y el frontend ya está adaptado a ellas (RPCs `inscribirse` y
`finalizar_clase_publicacion`), así que la app espera que estén aplicadas.

**Legal y copy, arreglado**: D3 (la política de devoluciones ahora describe el
crédito a saldo real, con la vía al medio original por email) · D6 (Stripe,
Nominatim y MyMemory declarados) · D5 (el botón de eliminar cuenta registra una
solicitud trazable en `quejas` con categoría `baja_cuenta`, en vez de abrir un
formulario) · M4-copy (el docente ya no lee "72hs" ni "al instante") · F8
(afirmaciones de la página de accesibilidad y hex de dark mode corregidos).

**Performance y limpieza, arreglado**: logo de 252KB → 10,7KB (1024px → 128px;
el original queda en la raíz del repo) · los 3 `getPublicaciones({})` sin límite
acotados server-side · `getPublicacionesByIds` pasa a `id=in.(...)` ·
`docs/testing.md` actualizado (92 tests, y documenta el shim que permite testear
edge functions sin Deno) · subdirectorios vacíos de `components/` borrados.

**Pendiente**: D7 (decidir el destino de `disputas`, que es código muerto desde
el lado del usuario) · `dispararAlertas` a server-side · sacar `MyPostsPage` del
entry eager · consolidar las 123 policies permisivas duplicadas · retomar F3 del
plan de arquitectura (descomponer `CursoPage`).

**No tocado a propósito**: los archivos personales sueltos en `src/`
(`Comprobante Menorca - Madrid.pdf`, `IMG_2277.PNG`, `insert_helper.py`). Están
cubiertos por `.gitignore`, no llegan al repo ni al bundle, y borrarlos es
irreversible sobre documentos tuyos. Se pueden mover a mano.

**Correcciones a los hallazgos originales** (verificadas):
- **F4 era falso positivo**: `PostFormModal` usa `<Modal>`, que sí tiene
  `useFocusTrap`. El auditor miró `PerfilPage`, otro componente del mismo archivo.
- **C3 es en parte deliberado**: "Inscribirme y coordinar el pago con el docente"
  (`CursoPage.jsx:5361`) es una función del producto. Lo que se cerró es que el
  cliente pudiera fijar a mano los campos de pago, no la auto-inscripción.
- **El cron viejo de escrow no está agendado** (ver abajo).
- **`jsx-a11y` no podía detectar F3**: `PostCard` usa `motion.div`, un componente
  custom, y el plugin solo analiza elementos DOM conocidos.

---

## 🟢 CONTEXTO DE EXPOSICIÓN REAL (verificado en producción, 2026-08-04)

Antes de leer las severidades: **todavía no hay volumen transaccional**, así que
ninguno de los bugs de dinero causó pérdida real. Consulta directa a la DB:

| Métrica | Valor |
|---|---|
| `mp_conexiones` (docentes con MP Connect) | **0** |
| `billetera_movimientos` (ledger de escrow) | **0 filas** |
| `pagos` | **1 fila** |
| `disputas` | **0** |
| `solicitudes_retiro` | **0** |
| `inscripciones` con `alumno_confirmada=true` | **0** |

Implicancias que cambian la prioridad de todo el informe:

1. **MP Connect no está activo** (coherente con que sigue pendiente de aprobación de MP).
   Todo lo que depende de `mp_conexiones` — C4 de seguridad (routing del `collector`) y
   D1 de datos (doble pago por `split_inmediato`) — es una **mina sin pisar**, no una
   herida abierta. **Deben arreglarse ANTES de que MP apruebe Connect**, porque el día
   que se aprueba detonan solas.
2. **Cero movimientos en el ledger** → los agujeros de escrow (C1, C2, C3 de seguridad;
   D2 de datos) son explotables pero **no hay dinero retenido que robar hoy**.
3. **Ventana para arreglar con calma.** El riesgo real es lanzar con volumen sin cerrar
   esto, no las próximas horas.

### Corrección a un hallazgo: el cron viejo de escrow NO está programado

La pista de datos afirmó que el pipeline viejo sigue corriendo y que la interacción
cron-viejo-3am / cron-nuevo-4am deja pagos varados para siempre. **Verificado: falso.**
`cron.job` completo en producción tiene solo 4 jobs:

| jobname | schedule | activo |
|---|---|---|
| `auto-liberar-escrow` | `0 4 * * *` | sí |
| `check-alertas-busqueda` | `0 8 * * *` | sí |
| `generate-faros-daily` | `0 3 * * *` | sí |
| `recordatorio-clases` | `*/15 * * * *` | sí |

`liberar_pagos_vencidos` / `fn_auto_confirmar_alumno` **no están agendados** (el job de
las 3am es el de Faros, no el de escrow). El escenario de dinero varado **no puede
ocurrir**. Lo que sí sigue en pie de ese hallazgo es la mitad del ledger paralelo:
`liberar-pago` invocada desde disputas inserta un movimiento nuevo sin consumir el hold
original. También confirma que `generar-liquidacion` **no tiene cron activo** (M6 de la
pista de datos: nadie lo agendó nunca).

---

## ⚠️ HALLAZGO TRANSVERSAL — el repo NO refleja la DB de producción

Las policies de `inscripciones`, `usuarios`, `notificaciones`, `favoritos`, `foro_*`,
`certificados`, y funciones clave como `liberar_pago_clase`, `confirmar_clase`,
`protect_usuario_privileged_cols` e `incrementar_saldo` **no existen en ningún archivo
de `supabase/migrations/`**. Auditar solo el repo da una foto incompleta y
peligrosamente optimista. Esta es la razón por la que la auditoría de junio no vio
los tres agujeros críticos de abajo.

**Acción de fondo:** volcar el schema real de producción a migraciones versionadas.

---

## CRÍTICO — explotable hoy, con dinero de por medio

### C1 — Un docente puede vaciar su propio escrow y quedarse con la comisión de Luderis

`20260706_escrow_unificado.sql:104-165` (`reembolsar_inscripcion`) + policy
`inscripciones update own or owner` (existe solo en la DB).

La policy no declara `WITH CHECK`, así que Postgres reusa el `USING`, que solo fija
`alumno_id`. Y el `grant UPDATE` a `authenticated` cubre **todas** las columnas,
incluidas `mp_payment_id`, `pagado_mp`, `clase_finalizada`, `alumno_confirmada`,
`clases_totales`, `estado` y `precio_por_clase`.

Cadena de explotación:
1. El docente lee el `mp_payment_id` de los pagos de sus alumnos (la policy de SELECT
   se lo permite legítimamente).
2. Con la misma cuenta se inscribe como *alumno* en cualquier publicación ajena activa
   (la policy de INSERT no exige pago — ver C3).
3. `PATCH /rest/v1/inscripciones?id=eq.<propia>` con
   `mp_payment_id = <el pago de su alumno>`, `clases_totales = null`, `pagado_mp = true`.
4. `POST /rest/v1/rpc/reembolsar_inscripcion` — la función autoriza por
   `alumno_id = auth.uid()` (es su fila) y busca los holds **por `mp_payment_id`**,
   acreditándole el **BRUTO** (`monto + comision_luderis`).

Resultado: convierte dinero retenido en saldo retirable al instante, saltea escrow,
confirmación del alumno y los 7 días, **y se lleva el 10% de comisión de Luderis**. El
alumno pierde su derecho a reembolso. Con `solicitudes_retiro` el saldo sale a un CBU.

Variante peor: los `mp_payment_id` de MP son numéricos y correlativos → cualquier
usuario que adivine uno ajeno redirige el hold de otra persona a su billetera.

```sql
revoke update on public.inscripciones from anon, authenticated;
grant update (alumno_confirmada, valorado) on public.inscripciones to authenticated;
drop policy "inscripciones update own or owner" on public.inscripciones;
create policy "inscripciones update alumno" on public.inscripciones
  for update to authenticated
  using (alumno_id = auth.uid()) with check (alumno_id = auth.uid());
```
Y en `reembolsar_inscripcion`: resolver el pago desde `pagos` cruzando
`publicacion_id + alumno_email` y validando `pagos.alumno_email = auth.email()`,
en vez de confiar en `inscripciones.mp_payment_id`.

### C2 — El docente puede firmar por el alumno: la doble confirmación está anulada

`20260420_escrow_doble_confirmacion.sql:52-76` + la misma policy de C1.

Esa migración existe explícitamente para cerrar "un docente podía marcar
`clase_finalizada` sin dictarla y cobrar". Pero la policy le da al autor de la
publicación UPDATE sobre las inscripciones de sus alumnos, con grant sobre
`alumno_confirmada`. Un solo `PATCH` con `clase_finalizada=true, alumno_confirmada=true`
dispara `trg_inscripcion_finalizada` y el cron `auto-liberar-escrow` (activo, `0 4 * * *`)
libera a los 7 días sin que el alumno haya tocado nada. **El fix de abril no está vigente.**

Se cierra con el mismo grant por columna de C1.

### C3 — Inscripción gratuita a cualquier curso pago

Policy `inscripciones insert own` (solo en DB) + `src/CursoPage.jsx:5008`.

El `WITH CHECK` exige `alumno_id = auth.uid()` y que la publicación esté activa y no
sea propia. **No hay ninguna condición de pago.** Un `POST /rest/v1/inscripciones`
con el token propio da acceso completo a un curso de cualquier precio.

No es teórico: el flujo de Stripe hace exactamente eso — inserta la inscripción desde
el cliente después de `confirmPayment`, sin verificación server-side, y **no hay
`stripe-webhook` en el repo**. Basta con no llamar a Stripe y ejecutar solo esa línea.

Fix: revocar INSERT a `authenticated`; RPC `inscribirse(p_pub_id)` SECURITY DEFINER que
permita el insert solo si el precio es nulo/0 o existe un `pagos` aprobado del caller.
Para Stripe: webhook con `stripe.webhooks.constructEvent` que cree la inscripción.

### C4 — `mp-checkout` no valida que `docente_email` sea el autor de la publicación

`supabase/functions/mp-checkout/index.ts:53,131,141-147,183-186` +
`mp-webhook/index.ts:183-209`.

`docente_email` llega del body del cliente y viaja al `external_reference` sin
contrastarse nunca contra `pub.autor_email` — que la función **ya tiene cargado** en
`:82-86` y usa solo para el chequeo de auto-compra.

Un alumno compra el curso del docente A poniendo `docente_email = <su cuenta alterna>`:
el docente A no cobra nunca y el 90% aterriza en la billetera del atacante. Costo neto
del curso: la comisión del 10%. Con MP Connect es peor — `:183-186` setea el
`collector` desde el email indicado, o sea el dinero va directo a esa cuenta de MP.

Fix: después de leer `pub`, forzar `docente_email = pub.autor_email` e ignorar el body.
Ídem en `stripe-checkout/index.ts:46`.

### C5 — `tipo:"recarga_billetera"` saltea la validación de precio y regala la inscripción

`mp-checkout/index.ts:77-80` + `mp-webhook/index.ts:154-178`.

```ts
const ES_RECARGA = tipo === "recarga_billetera" || publicacion_id === "0000...0001";
if (!ES_RECARGA) { /* toda la validación de precio vive acá dentro */ }
```

`tipo` viene del body. Con `tipo:"recarga_billetera"`, `publicacion_id = <curso real>`
y `precio: 1`, el checkout no valida precio y crea la preferencia por $1. El webhook
reutiliza el mismo flag solo para decidir si acredita al docente, pero **crea la
inscripción igual** en `:154-174`. Curso de $500 por $1, docente sin cobrar.

Fix: `ES_RECARGA` determinado **exclusivamente** por el `publicacion_id` sentinela;
y no crear inscripción cuando `ES_RECARGA`.

---

## ALTO

### A1 — `smart-worker` es un endpoint público sin autenticación
`smart-worker/index.ts:113` (`Deno.serve` sin gate), `:287-341`. `verify_jwt=false`
confirmado en producción. El `if (req.method === "GET")` maneja el unsubscribe; **todo
POST cae directo al worker**. Cualquiera en internet dispara la tanda completa de
recordatorios (emails + push a todos los inscriptos), vacía la cola
`alertas_digest_queue` o borra filas.

Encadenado con A2 se vuelve un servicio de phishing con la marca Luderis: se inyectan
filas con texto arbitrario y se llama a `smart-worker` para despacharlas como email
desde `hola@luderis.com`. La plantilla escapa HTML (no hay inyección de markup), pero
el texto libre alcanza para un pretexto convincente.

Fix: exigir `Authorization: Bearer <SERVICE_ROLE_KEY>` o `x-cron-key` contra `config`,
igual que `recordatorio-clases/index.ts:47-53`, que sí lo hace bien.

### A2 — `alertas_digest_queue`: INSERT con `WITH CHECK (true)`
**[YA DOCUMENTADO]** en `plan-seguridad-authuid.md:53` — **PENDIENTE**. Cualquier
autenticado inserta digests con `usuario_email` ajeno y contenido arbitrario. Es el
combustible de A1. Fix: `with check (usuario_email = auth.email())`.

### A3 — `liberar_pago_clase`: race condition sin lock → doble acreditación
Función solo en DB, con `EXECUTE` a `authenticated`. Hace `SELECT ... WHERE
estado='pendiente' LIMIT 1` **sin `FOR UPDATE`**, acredita, y recién al final marca
`estado='liberado'`. Dos requests en paralelo leen la misma fila y ambas acreditan.
**Cada corrida paralela duplica el pago.**

Contraste: `_liberar_hold_pago` (`20260706:30-38`) **sí** usa `for update` y está
correctamente serializada. El camino de paquetes quedó sin migrar a ese patrón.

Bug adicional en la misma función: `SELECT i.clases_totales INTO v_mov.monto` pisa el
monto con la cantidad de clases — el prorrateo está mal calculado.

Fix: reclamar la fila con compare-and-swap antes de acreditar
(`update ... where id=? and estado='pendiente' returning monto`; si `not found`, abortar).

### A4 — Doble pago vía `liberar-pago` + `resolver_disputa`
`liberar-pago/index.ts:164-193`, `admin-actions/index.ts:343-351`. `liberar-pago` opera
sobre `pagos.estado_escrow` mientras el escrow unificado vive en
`billetera_movimientos.estado`: **dos máquinas de estado independientes que no se
consultan entre sí**. Si el alumno ya confirmó y después se resuelve una disputa a favor
del docente, cobra dos veces — y se dispara la transferencia real por MP.

Fix: chequear `billetera_movimientos where mp_payment_id=? and estado<>'pendiente'`
antes del insert; o unificar todo en `_liberar_hold_pago`.

### A5 — Los `revoke` de `20260703_fix_rls_deny_all_y_hardening.sql` no surtieron efecto
`20260703_fix_rls_deny_all_y_hardening.sql:28-33`. Postgres concede `EXECUTE` a `PUBLIC`
por defecto y `anon` hereda de `PUBLIC`: revocar solo de `anon` no quita nada.
**Confirmado independientemente por el advisor**: las 6 funciones siguen ejecutables por
`anon` — `get_avg_time_faros`, `get_avg_time_shikaku`, `get_leaderboard_faros`,
`get_leaderboard_shikaku`, `get_evaluaciones_pub`, `incrementar_vistas`.

`get_evaluaciones_pub` filtra evaluaciones y exámenes de cualquier publicación a usuarios
sin sesión. Es el mismo patrón que el commit `02067e54` corrigió bien en el escrow
(`revoke ... from public, anon`); la migración de julio 3 quedó con la versión rota.

---

## MEDIO

- **M1 — `ai-proxy`, `ludy-chat`, `send-push` decodifican el JWT sin verificar la firma.**
  `isValidSupabaseJwt()` hace `atob(parts[1])` y confía en `role`/`iss`/`exp`. Hoy está
  mitigado por `verify_jwt=true` en el gateway, pero es una sola capa: un redeploy con
  `--no-verify-jwt` (que `send-push/index.ts:6` documenta como el modo previsto) la
  elimina en silencio. Fix: `supaAdmin.auth.getUser(token)`, como ya hace `subir-foto:43-49`.
- **M2 — El rate-limit de IA parece no estar funcionando.** `public.ia_rate_limits` tiene
  **0 filas** un mes después de la migración, con `ai-proxy` redesplegado el 2026-07-05.
  O nadie usó la IA en un mes, o el RPC falla y el `catch { /* fail-open */ }` lo traga.
  Bypass estructural: la clave es `ai:${sub}` y el signup es abierto → cuentas nuevas
  ilimitadas, sin techo global sobre la `ANTHROPIC_KEY`. La tabla tampoco tiene limpieza.
- **M3 — `ludy-chat` reenvía el array `messages` del cliente sin sanitizar** (`:272`).
  Solo chequea `Array.isArray`: sin cap de longitud ni de caracteres. `ai-proxy:70-77`
  ya lo hace bien (`.slice(-20)`, `.slice(0,8000)`); falta portarlo.
- **M4 — `send-push` permite mandar notificaciones a cualquier usuario con contenido
  arbitrario** (`:94-97`). No exige relación entre el caller y `to`. Phishing directo:
  el `url` termina en `clients.openWindow`.
- **M5 — `stripe-checkout`: `verify_payment` es un IDOR** (`:109-125`) que devuelve
  `metadata` con `alumno_email`/`docente_email`/`titulo` de transacciones ajenas; y
  `create_payment_intent` no valida el precio contra la DB (`:43-95`).
- **M6 — Cualquier autenticado puede inflar su calificación.** El trigger
  `protect_usuario_privileged_cols` (solo en DB) sí cierra el auto-ascenso a admin, pero
  no protege `calificaciones_suma`, `calificaciones_count`, `advertencias`, `dias_racha`,
  `nivel`. `PATCH /rest/v1/usuarios` con `calificaciones_suma:5000` → 5 estrellas.
  Fix: grants por columna con lista blanca + versionar el trigger.
- **M7 — `referidos` y `anuncios_globales`: RLS activa sin policies.** **[YA DOCUMENTADO]**
  — **AMBOS PENDIENTES**. Impacto funcional: `AuthScreen.jsx:65` inserta en `referidos`
  y **falla siempre**; `MiCuentaPage.jsx:1288` lee y siempre da vacío. El programa de
  referidos no funciona y falla en silencio. `AdminPage.jsx:2309` tiene el historial de
  anuncios siempre vacío. (`ia_rate_limits` y `recordatorios_clase` también tienen 0
  policies pero ahí es correcto: solo service_role.)
- **M8 — `clases_realizadas` y `alertas_busquedas`: RESUELTOS**, pero el fix de
  `alertas_busquedas` rompió una feature: `supabase.ts:1016` hace una query cross-user
  que ahora devuelve solo las filas propias → **el matching de alertas de docentes está
  muerto**. El plan ya proponía la solución (RPC SECURITY DEFINER); sigue sin implementarse.
- **M9 — PII en logs de edge functions.** `send-email:695,655`, `send-push:130`,
  `generar-liquidacion:470,473`, `liberar-pago:160`, `smart-worker:325` loguean emails;
  `liberar-pago:153` vuelca la respuesta cruda de MP. **El de mayor riesgo es
  `mp-oauth:104`**, que loguea `await tokenRes.text()` del endpoint OAuth de MP — puede
  contener el `access_token` en una respuesta de error. Ningún log imprime la
  `SERVICE_ROLE_KEY` ni el `MP_ACCESS_TOKEN` directamente.
- **M10 — Vistas SECURITY DEFINER siguen filtrando `autor_email`.** **[YA DOCUMENTADO]**
  — **PENDIENTE**, las 3 marcadas ERROR por el advisor. Dato nuevo:
  `publicaciones_con_autor` fue **recreada** en `20260620_avatar_color.sql:15-28`
  conservando `u.email AS autor_email` — se tocó la vista después de documentar el
  problema y se mantuvo la fuga. Sumado a la policy `usuarios public read USING (true)`,
  **cualquier usuario registrado puede enumerar el email de todos los usuarios**, lo que
  contradice la decisión de producto de impedir el puenteo. (`anon` sí está excluido.)

## BAJO

- **B1** — `puzzles.solution` legible por todos (`20260418_faros.sql:18-21`): cualquier
  jugador lee la solución del día y farmea el leaderboard.
- **B2** — `generate-faros` sin autenticación; daño acotado (solo rellena fechas
  faltantes) pero es CPU gratis.
- **B3** — `quejas` INSERT `WITH CHECK (true)` **[YA DOCUMENTADO]** — PENDIENTE, sin
  rate-limit ni captcha. Intencional (libro anónimo) pero abierto a spam.
- **B4** — El `cron_secret_recordatorios` está en texto plano en `cron.job.command`.
- **B5** — `send-email:575` compara secretos sin constant-time (`token === SUPA_KEY`).
- **B6** — `smart-worker:81` tiene fallback hardcodeado del secreto de unsubscribe
  (`"luderis-unsub-fallback-v2-change-me"`). Verificar que `UNSUB_SECRET` exista en prod.
- **B7** — Extensiones en `public` (`pg_trgm`, `unaccent`) y leaked-password protection
  deshabilitado **[YA DOCUMENTADO]** — PENDIENTES (el segundo requiere plan Pro).
- **B8** — **Drift entre `supabase/functions/` y lo desplegado**: `stripe-checkout` (v10,
  entrypoint `_6/source/index.ts`), `smart-worker` (`_15/`), `send-email` (v29, `_28/`),
  `subir-foto`, `generate-faros` tienen rutas que no coinciden con el repo. **El código
  auditado puede no ser el que corre.**

---

## Lo que está BIEN hecho (verificado — no tocar)

- **`mp-webhook` firma HMAC** (`:61-93`): fail-closed si falta el secret, manifiesto MP
  correcto, rechaza firma inválida.
- **`mp-webhook` idempotencia**: el CAS sobre `acreditado_at` (`:136-147` +
  `20260629_pagos_acreditado_at.sql`) es la implementación correcta. **No hay duplicación
  de pagos por reintentos de MP.**
- **`_liberar_hold_pago`** (`20260706:30-38`): el `for update` serializa bien. Las
  carreras liberación-automática vs confirmación vs reembolso están **bien resueltas** en
  este camino — el problema (A3) está en el camino de paquetes.
- **`liberar-pago`**: CAS `retenido→procesando` (`:67-88`), `X-Idempotency-Key` (`:141`)
  y rollback best-effort (`:217-224`).
- **`mp-oauth`**: `state` firmado con HMAC + expiración de 15 min, y verificación de que
  el JWT pertenece al `user_id`. Anti-CSRF de account-linking correcto.
- **`admin-actions`**: rol admin leído de la DB, nunca del cliente (`:92-103`); CORS con
  allowlist; `borrar_chat` valida participación y usa `.eq()` parametrizado.
- **`send-email`**: allowlist de plantillas para no-admins y verificación de que los
  destinatarios sean usuarios registrados.
- **`subir-foto`**: valida contra gotrue de verdad y confina la escritura a `{user.id}/`.
- **`protect_usuario_privileged_cols`**: cierra el auto-ascenso a admin.

---

## Arquitectura y performance

### Estado real vs `docs/plan-arquitectura.md`

| Fase | % real | Evidencia |
|---|---|---|
| F1 Router real | ~60% | `BrowserRouter` en `index.jsx:101` y URLs por sección, pero **sin `<Routes>/<Route>`**: legales por early-return con `window.location.pathname` (`App.jsx:868-874`); deep-links `?pub=`/`?perfil=`/`?legal=`/`?mp=` siguen ad-hoc; `CursoPage`/`DetailModal`/`PerfilPage` son overlays con hack de `history.pushState`; `sessionStorage` sigue para `cl_curso_id`, `cl_seccion_explore`, `ld_auth`. No existen `/curso/:id` ni `/perfil/:email`. |
| F2 Quitar globals | **100%** | Cero usos de `window.__` en `src/`. Reemplazados por `AppActionsContext` (`App.jsx:361`) y `pushNotifRef`. |
| F3 Descomponer gigantes | ~15% | `components/{chat,posts,shared}` **vacíos**. Los monolitos **crecieron**: CursoPage 5.242→**5.529**, MiCuentaPage 2.478→**2.725**, AdminPage 2.681→2.689, supabase 1.072→1.201. CursoPage tiene **202 `useState` y 33 `useEffect`** en un archivo. |
| F4 TypeScript | ~10% | 59 `.jsx` vs 2 `.ts`. `checkJs:false`. `supabase.ts` tipado laxo: `type Row = Record<string,any>`, 48 `any`, retornos `Promise<any>`. El `database.types.ts` de 3.691 líneas está casi sin usar. |
| F5 Tokens | ~20% | 100% inline-styles; hexes crudos en `App.jsx:143-232` (`#1A6ED8`, `#F6F9FF`). |
| F6 CRA → Vite | **100%** | Vite 8 + Vitest. El plan quedó desactualizado acá. |
| SDK supabase-js | 0% | El WebSocket manual sigue (`App.jsx:680-783`, ~100 líneas). |

### Performance

- **ALTO — `dispararAlertas` (`supabase.ts:1117-1178`)**: baja TODAS las alertas activas
  sin límite y hace un `for…of` **secuencial** con 1 llamada a `callIA` + 1 INSERT por
  alerta, **desde el navegador**, al publicar. Debería ser edge function o trigger.
- **ALTO — `getPublicaciones({})` sin límite** baja la tabla entera en 3 lugares:
  `App.jsx:371` (para encontrar 1 pub — existe `getPublicacionesByIds`),
  `CursoPage.jsx:5448` (para mostrar 3 relacionadas), `OnboardingModal.jsx:511`
  (y después hace `slice(0,80)`).
- **MEDIO** — N+1 por usuario en `CursoPage.jsx:257,4306` (falta el bulk por id, espejo de
  `getUsuariosByEmails`); N+1 por quiz/evaluación en `CursoPage.jsx:1149,1316-1317`;
  `refreshUnread` (`App.jsx:625-674`) baja 400 mensajes cada 90s solo para contar;
  `AdminPage.jsx:613-621` baja 7 tablas enteras.
- **Bundle** (medido, Vite 8, 73 chunks, build OK en 4.1s): entry 351KB/108KB gzip;
  Sentry 354KB cargado on-idle ✓; **AdminPage 496KB** por `recharts` (lazy, solo admins);
  CursoPage 256KB. `App.jsx:30` importa **eager** `MyPostsPage` por sus named exports;
  el comentario `webpackPrefetch` de `App.jsx:34` es **inerte en Vite**.
- **Assets**: `public/logo.png` pesa **252,8 KB** para renderizarse a 36-52px.
  `favicon.ico` 33 KB. `public/landing/` contiene fuentes JSX + `compile.js` del
  prototipo, servidos públicamente.
- **Deps**: `npm audit` da 5 vulns (4 high, 1 moderate), todas con fix. La única de
  runtime es **`react-router-dom` ≤7.17.0** (open redirect vía backslash en `<Link>`/
  `useNavigate`). **4 deps muertas** instaladas: los 3 `@testing-library/*` y `web-vitals`
  (cero imports; los tests corren en Vitest con `environment:"node"`).
  `@supabase/supabase-js` en devDependencies **es correcto**: el frontend no lo usa.
- **Basura en `src/`**: `Comprobante Menorca - Madrid.pdf`, `IMG_2277.PNG` (1,1MB),
  `insert_helper.py` — **cubiertos por `.gitignore`, NO están en el repo ni en el bundle**
  (verificado con `git ls-files` y `git check-ignore`). Sin fuga de PII; solo higiene.

---

## Advisors de Supabase (corridos directamente contra producción)

**Seguridad — 34 avisos.** 3 ERROR (las vistas SECURITY DEFINER de M10); 4 tablas con
RLS sin policies (M7); 6 funciones ejecutables por `anon` (A5, corrobora el hallazgo);
14 ejecutables por `authenticated` incluyendo `liberar_pago_clase`,
`reembolsar_inscripcion`, `cancelar_publicacion_con_reembolso` y `confirmar_clase`;
leaked-password protection deshabilitado.

**Performance — 279 avisos**, dominados por dos patrones mecánicos:
- **123 `multiple_permissive_policies`** — peores: `alertas_publicacion` y
  `verificaciones_usuario` (20 c/u), `notificaciones` y `quiz_entregas` (15 c/u).
- **113 `auth_rls_initplan`** — `auth.uid()`/`auth.jwt()` sin envolver en `(select ...)`,
  o sea re-evaluados fila por fila. Es el costo oculto del hardening de RLS de julio.
- **19 FKs sin índice**, varias del circuito de dinero: `billetera_movimientos`
  (×2), `solicitudes_retiro`, `reseñas`.
- **24 índices nunca usados**, la mayoría sobre `publicaciones` (categoría, activo,
  precio, modalidad, destacado, los dos `_trgm`) — sugiere que `buscar_publicaciones`
  no los está aprovechando.

---

## Integridad de datos, escrow y legal (pista 4)

### D1 — [LATENTE hasta que MP apruebe Connect] Doble pago a docentes con MP Connect
`mp-checkout/index.ts:183-186` arma la preferencia con `marketplace_fee` + `collector`
del docente → **MP transfiere el neto directo a su cuenta en el momento del pago**. Pero
`mp-webhook/index.ts:183-210` inserta **incondicionalmente** un hold en
`billetera_movimientos` por el mismo neto, **sin mirar el flag `split_inmediato`** que el
propio `mp-checkout` graba en `external_reference` (grep de `split_inmediato` en
`mp-webhook` → **0 resultados**: se escribe y nunca se lee). Ese hold después se libera y
acredita el neto **por segunda vez**, ahora como saldo retirable.

Con `mp_conexiones = 0` esto **no está ocurriendo**. Detona el día que MP apruebe Connect.
Fix: si `meta.split_inmediato === true`, no crear el hold (o crearlo ya en `liberado`).

### D2 — Pipeline viejo de escrow nunca dado de baja (parcialmente mitigado)
`20260706_escrow_unificado.sql` migró el dinero a `billetera_movimientos` pero no desactivó
`pagos.estado_escrow`. El trigger `fn_inscripcion_finalizada` sigue escribiendo esa columna
y `liberar-pago` sigue siendo invocada por `admin-actions:307-318` (`liberar_pago_manual`)
y `:342-360` (`resolver_disputa`).

**Lo que NO aplica** (verificado): el cron viejo `liberar_pagos_vencidos` /
`fn_auto_confirmar_alumno` **no está agendado**, así que el escenario de dinero varado por
la interacción 3am/4am no puede ocurrir.

**Lo que SÍ aplica**: `resolver_disputa` transfiere plata real por MP e inserta un
movimiento nuevo en `'liberado'` **sin consumir el hold `'pendiente'` original**. Ese hold
queda disponible para `reembolsar_inscripcion`, que no valida si el pago ya salió por otra
vía → se puede reembolsar al alumno un pago que ya se liberó al docente. (Coincide con A4.)

### D3 — `PoliticaDevoluciones.jsx` promete algo que el código no hace
Sección 6 (~líneas 383-404): *"las devoluciones se realizan siempre por el mismo medio de
pago utilizado originalmente… el monto se acredita en el saldo de MercadoPago del Alumno…
Luderis no puede realizar transferencias bancarias directas"*. El código
(`reembolsar_inscripcion`, invocado desde `CursoPage.jsx:4383`) **siempre** acredita al
**saldo interno de Luderis**, nunca al medio de pago original; el alumno después tiene que
retirar por `solicitudes_retiro`, con revisión manual y sin SLA en código.

Es una representación falsa de un mecanismo de consumo bajo Ley 24.240 art. 4 (información
veraz), con base documental clara. Fix: corregir el texto o implementar reembolso real.

### D4 — `generar-liquidacion` (documento fiscal) lee la columna muerta
`generar-liquidacion/index.ts:323-325` filtra `pagos.estado_escrow='liberado'` para armar
el PDF mensual que se manda al docente y que la política de privacidad ata a retención
fiscal de 10 años. Esa columna corre en un reloj desacoplado del ledger real. Además
(`:35`) usa `const COMISION = 0.10` **hardcodeada** en vez de `config.comision_pct`, que
sí leen `mp-checkout`/`mp-webhook`/`liberar-pago`. Y el cron mensual quedó **comentado**
en `20260418_liquidaciones_storage.sql:35-53` — **verificado: no está agendado**, o sea
nadie recibe liquidación automática.

### D5 — "Eliminar mi cuenta" no elimina nada
`MiCuentaPage.jsx:1698-1701`: tras escribir "ELIMINAR", el botón hace
`window.open("/quejas","_self")`. No llama a ningún RPC ni edge function. El único borrado
real es `eliminar_usuario` en `admin-actions:131-140`, **solo disparable por un admin**.
`PrivacidadPage.jsx` S4 promete *"Cancelación (supresión) — desde Mi cuenta… procesamos en
30 días hábiles"*. El flujo self-service prometido no existe y no deja rastro trazable.

### D6 — `PrivacidadPage.jsx` no declara 3 terceros que sí reciben datos
Faltan, todos confirmados en código y presentes en la CSP: **Stripe**
(`stripe-checkout/index.ts`, mencionado incluso en `TerminosPage.jsx:520`);
**Nominatim/OpenStreetMap** — `ExplorePage.jsx:163` envía **coordenadas GPS exactas**
(`pos.coords.latitude/longitude`), dato de geolocalización precisa bajo Ley 25.326; y
**MyMemory Translate** — `CursoPage.jsx:5412` envía texto libre del usuario.

### D7 — Las disputas son código muerto desde el lado del usuario
No hay ningún INSERT a `disputas` en todo `src/` (no aparece en `supabase.ts`). La tabla,
sus policies y la UI de resolución en `AdminPage.jsx:1823-1992` existen, pero ningún alumno
puede abrir una disputa. **Verificado: `disputas` tiene 0 filas.** Consecuencias: el
contador de "Disputas abiertas" siempre da 0, y los `NOT EXISTS (... disputas ...)` que
protegen las liberaciones nunca bloquean nada. `PoliticaDevoluciones` S9 describe un
proceso de mediación que en la práctica solo existe por email.

### D8 — Otros
- **A2** `pagos.estado_escrow` sin CHECK constraint (`billetera_movimientos.estado` sí lo
  tiene). `liberar-pago:69` ya usa un estado (`'procesando'`) no documentado.
- **A5** `AdminPage.jsx:1833` sigue leyendo `pagos?estado_escrow=in.(retenido,en_disputa)`.
  El commit `1ecbc6bd` arregló la vista del docente pero **no la del admin**.
- **A6** **Cero Sentry en las 16 edge functions** (grep → 0). Todo es `console.error`. Los
  crons financieros pueden fallar en silencio total.
- **M3** Duplicación: `clase_finalizada_at` (trigger) vs `fecha_finalizacion`
  (`FinalizarClaseModal.jsx:18`) — el cron nuevo usa la segunda, el viejo la primera.
- **M4** `MiCuentaPage.jsx:962-977` le dice al docente *"la plata llega directo a tu MP al
  instante"* y *"cobro automático 72hs después"* — describe el modelo viejo, no el escrow
  actual (retención + 7 días a saldo interno).

### Lo bueno de esta pista
**78/78 tests verdes** en 6 archivos y **`typecheck` sin errores**. `docs/testing.md` está
desactualizado: dice "56 tests" y que los de edge functions están pendientes por falta de
Deno, cuando ya existen y corren bajo Vitest con un shim (`__tests__/helpers/edge-env.js`)
**sin necesitar Deno**. El consent de cookies está **bien implementado**: `index.jsx:10-13`
llama `initConsentMode()` antes de `initGA()`, y Clarity solo arranca tras consentimiento
(`analytics.js:38-42`) — no es decorativo.

---

## Frontend, accesibilidad y consistencia visual (pista 3)

### F1 — [ALTO] `notificaciones` deja a cualquier autenticado notificar a cualquiera
Verificado en vivo: policy `notificaciones insert authenticated`, `with_check:
(auth.role() = 'authenticated')`. Sin chequeo de `usuario_id = auth.uid()` ni de rol.
`AdminPage.jsx:2040` asume que es admin-only (lo usa para "tu retiro fue procesado"), pero
**cualquier cuenta** puede hacer el mismo POST y suplantar avisos oficiales de la
plataforma — falsos avisos de pago con link de phishing — hacia cualquier usuario. La UI
de admin es apariencia; el control real falta en la RLS.

### F2 — [ALTO] El gate de accesibilidad de CI es un falso verde silencioso
`.github/workflows/ci.yml:24-30` corre
`A11Y=$(npx eslint src --ext .js,.jsx -f compact | grep -c "jsx-a11y" || true)` y después
`test "$A11Y" -eq 0`. **No existe ningún `.eslintrc*` ni `eslint.config.*` en el repo.**
Reproducido localmente: ESLint aborta con *"couldn't find a configuration file"*, el grep
cuenta 0, y el gate **pasa en verde**. ESLint nunca evaluó una sola regla. Explica por qué
F3 y F4 nunca se detectaron. Fix: agregar flat config real y hacer que el step falle por
exit code, no por contar texto.

### F3 — [ALTO] `PostCard` no es operable por teclado
`components/PostCard.jsx:47`: la card entera es un `motion.div onClick` **sin `role`, sin
`tabIndex`, sin `onKeyDown`**. Ningún usuario de teclado o lector de pantalla puede abrir
el detalle de una publicación — el flujo principal de la app. El patrón correcto ya existe
en `MiCuentaPage.jsx:1005`.

### F4 — [ALTO] `PostFormModal` no atrapa el foco
`PostFormModal.jsx:867`: raíz `<div style={{position:"fixed",inset:0}}>` sin
`role="dialog"`, sin `aria-modal`, y **sin `useFocusTrap`** (0 ocurrencias en el archivo).
El Tab se escapa al fondo. `DetailModal.jsx:87,90` sí lo hace bien.

### F5 — [MEDIO] El anti-puenteo tiene bypasses reales (verificados ejecutando el regex)
`shared.jsx:246` (`CONTACT_REGEX`) y `:257-262` (`BYPASS_PATTERNS`) dependen de ASCII
literal sin normalizar. Bypasses confirmados en Node:

```
BYPASS  juan arroba gmail punto com
BYPASS  juan​@gmail.com          (zero-width space antes de @)
BYPASS  juan＠gmail.com          (＠ fullwidth U+FF20)
BYPASS  juan[at]gmail.com
BYPASS  mi cel １１ ５６７８        (dígitos fullwidth)
BYPASS  segui mi insta @juanp    ("insta" no está, solo "instagram"/"ig")
BYPASS  cutt.ly · t.co · is.gd   (solo bit.ly y tinyurl cubiertos)
```

Es el mecanismo central contra la evasión de comisión, o sea impacto de negocio directo.
Fix: `text.normalize("NFKC")` + strip de zero-width (`​-‍﻿`) antes de los
regex, y ampliar la lista de acortadores y alias.

### F6 — [MEDIO] Contraste: fallas WCAG AA calculadas
| Par | Ratio | AA (≥4.5:1) |
|---|---|---|
| `light.faint #8593A7` sobre `light.bg #F4F7FB` | **2.96:1** | ❌ |
| `dark.faint #5E708C` sobre `dark.bg #0A1220` | **3.72:1** | ❌ |
| `StatusBadge` "● Activa" `#2EC4A0` sobre `#2EC4A015` | **2.05:1** | ❌ |
| `StatusBadge` "Pausada" `#718096` | 3.74:1 | ❌ |
| `light.muted` / `dark.muted` | 5.12 / 6.19:1 | ✅ |

`faint` se usa para texto de 11-13px (timestamps, sufijos de precio), que no califica como
texto grande. Y `StatusBadge` (`shared.jsx:360-365`) usa **hex hardcodeados sin variante
por tema** — es un componente compartido, no un screen suelto.

### F7 — [MEDIO] Otros de seguridad frontend
- `script-src 'unsafe-inline'` **es evitable**: solo hay 3 scripts inline en `index.html`,
  todos estáticos (2 `ld+json` + un toggle de robots) → 3 hashes SHA-256 y listo.
- Password: `AuthScreen.jsx:46` valida solo `length < 6`; el medidor `passStrength` es
  decorativo y no bloquea el submit. Sumado a leaked-password-protection deshabilitado.
- `AdminPage.jsx:19,297-300`: el atajo `isFallbackAdmin` pone `isAdmin=true` sin consultar
  la DB. **Verificado que las escrituras están protegidas por RLS igual**, así que no es
  escalada explotable por terceros — pero es un atajo innecesario en el build de producción.
- `img-src https:` es máximamente amplio; el allowlist real (`AVATAR_TRUSTED`,
  `shared.jsx:293`) vive solo en JS, sin respaldo de CSP.
- Falta `upgrade-insecure-requests`.
- `PostFormModal.jsx:978-984`: si el `videoUrl` del docente no matchea el regex de YouTube,
  cae a usarlo crudo como `src` del iframe. Hoy lo neutraliza `frame-src`.
- **Sin secretos hardcodeados** en `src/` ni `vite.config.js`. El JWT vive en
  `localStorage` (`supabase.ts:30,48-49`) — estándar, pero sube el costo de un XSS futuro.
- Los 2 `dangerouslySetInnerHTML` (`App.jsx:935`, `FarosCell.jsx:63`) reciben constantes
  hardcodeadas, no datos de usuario. No explotables hoy.

### F8 — `AccesibilidadPage.jsx` afirma cosas falsas
| Afirmación | Realidad |
|---|---|
| "Toda la plataforma puede operarse sin mouse" (:242) | Falso — F3 |
| "Los modales atrapan el foco correctamente" (:283) | Falso — F4 |
| "Contraste de al menos 4.5:1" (:247) | Falso — F6 |
| "Iconos decorativos con `aria-hidden`" (:282) | 7 usos contra ~306 íconos |
| "Modo oscuro: fondo `#1A1F2E`" (:301) | El token real es `#0A1220` |

Además usa 25 emojis, contra la regla del propio CLAUDE.md que la página promociona.

### F9 — Consistencia visual: la deuda de tokens es sistémica
- **1.111 hex crudos** fuera de `shared.jsx`, en 51 archivos. Top: `CursoPage` 123,
  `MiCuentaPage` 65, `AdminPage` 53, `AuthScreen` 45, `PostFormModal` 33. Atenuante:
  `AdminPage` define su propio set local (`const A={...}`, :59-76) y es el ítem 10 del
  orden — todavía no le tocó; `AuthScreen` corre antes de aplicar tema.
- **2.200 `fontSize` mágicos** fuera de `TYPE`/`tx()`. Top: `CursoPage` 597,
  `MiCuentaPage` 284, `AdminPage` 245.
- **598 emojis** en 40+ archivos. Top: `CursoPage` 163, `AdminPage` 74. Notable:
  **`ExplorePage.jsx` — la pantalla ya aprobada — todavía tiene 6**, incluyendo
  `toast("🔔 Alerta guardada…")` en :224 y :997 y un `✦` decorativo en :574.
- **Imports desde `redesign-prototipo/`: 0.** Regla respetada (las 2 menciones son
  comentarios de procedencia).

---

## Orden de ataque sugerido

Con volumen ~0, nada de esto es una emergencia de esta hora. Pero **todo el bloque 1 y 2
tiene que estar cerrado antes de abrir el grifo de tráfico pago**, y el bloque 1 en
particular antes de que MP apruebe Connect.

**Bloque 1 — dinero (con backup y en branch de Supabase):**
1. `revoke update on inscripciones` + grant por columna sobre `alumno_confirmada`,
   `valorado` → cierra **C1 y C2** de una sola vez. Es el arreglo de mayor palanca.
2. Reescribir `reembolsar_inscripcion` para no confiar en `inscripciones.mp_payment_id`
   sino resolver desde `pagos` validando `alumno_email = auth.email()` (**C1**).
3. `ES_RECARGA` solo por `publicacion_id` sentinela + no crear inscripción si es recarga (**C5**).
4. Forzar `docente_email = pub.autor_email` en `mp-checkout` y `stripe-checkout` (**C4**).
5. Leer `split_inmediato` en `mp-webhook` — **antes de que MP apruebe Connect** (**D1**).
6. CAS en `liberar_pago_clase` antes de acreditar (**A3**).
7. Chequeo cruzado ledger↔`estado_escrow` en `liberar-pago`, o retirar el ledger
   paralelo (**A4 / D2**).

**Bloque 2 — acceso:**
8. Revocar INSERT de `inscripciones`; RPC `inscribirse()` que valide pago; webhook de
   Stripe con verificación de firma (**C3**).
9. `with_check` real en `notificaciones` (**F1**) y en `alertas_digest_queue` (**A2**).
10. Auth en `smart-worker` (**A1**).
11. Rehacer los revokes de `20260703` como `from public, anon` (**A5**).

**Bloque 3 — alto:**
12. Arreglar el gate de CI de a11y: flat config real + fallar por exit code (**F2**).
    Sin esto, ningún hallazgo de a11y se detecta nunca.
13. `getUser()` real en `ai-proxy`/`ludy-chat`/`send-push` (**M1**).
14. Investigar por qué `ia_rate_limits` está vacía y sacar el `catch` mudo (**M2**).
15. Migrar `generar-liquidacion` y `AdminPage.jsx:1833` al ledger real (**D4 / A5-datos**).
16. Alertas activas (no solo `console.error`) en `mp-webhook`/`liberar-pago`/
    `generar-liquidacion` (**A6-datos**).
17. `npm audit fix` — sobre todo `react-router-dom` (open redirect, única vuln de runtime).
18. Teclado en `PostCard` (**F3**) y focus trap en `PostFormModal` (**F4**).

**Bloque 4 — legal (barato y con exposición concreta):**
19. Corregir `PoliticaDevoluciones` S6 o implementar reembolso al medio original (**D3**).
20. Agregar Stripe, Nominatim y MyMemory a `PrivacidadPage` S3 (**D6**).
21. Implementar borrado de cuenta real o corregir `PrivacidadPage` S4 (**D5**).
22. Decidir el destino de `disputas`: implementar entrada real o retirar la promesa (**D7**).
23. Corregir el copy de `MiCuentaPage:962-977` (dice 72hs y acreditación instantánea; el
    modelo real es 7 días a saldo interno) y las afirmaciones falsas de
    `AccesibilidadPage` (**M4 / F8**).

**Bloque 5 — deuda:** normalización NFKC en el anti-puenteo (**F5**), contraste de `faint`
y `StatusBadge` (**F6**), hashes en `script-src` (**F7**), comprimir `logo.png` (252KB),
sacar las 4 deps muertas, reemplazar los 3 `getPublicaciones({})` sin límite, mover
`dispararAlertas` a server-side, y actualizar `docs/testing.md` (dice 56 tests; son 78).

**De fondo, lo más importante a mediano plazo:** volcar el schema real de producción a
`supabase/migrations/`. Hoy el repo describe menos de la mitad de las policies vigentes, y
eso es exactamente lo que hizo invisibles a C1, C2, C3 y F1 en la auditoría de junio.
