# Plan de seguridad diferido — Identidad `auth.uid()` y RLS pendientes

> Generado en la auditoría 2026-06-05 (Tanda 2). Estos ítems requieren una sesión
> dedicada **con backup de DB** porque tocan el modelo de identidad y/o lecturas
> cross-user. NO ejecutar sin validar en un branch/preview de Supabase primero.

## Contexto: identidad por email mutable

Hoy toda la app usa el **email** como identidad y FK:
`mensajes.de_nombre/para_nombre`, `*.autor_email`, `*.alumno_email`, `*.docente_email`,
y las RLS comparan `auth.jwt() ->> 'email'`. En Supabase el email es **mutable**:
si un usuario cambia su email, se rompen referencias y cambian sus permisos RLS.
El objetivo final es migrar la identidad a `auth.uid()` (UUID inmutable).

### Migración sugerida (incremental, no big-bang)
1. Agregar columnas `*_id uuid` junto a las `*_email` existentes (nullable).
2. Backfill: `update t set autor_id = u.id from usuarios u where u.email = t.autor_email`.
3. Duplicar las RLS para aceptar `auth.uid()` **además** del email (transición).
4. Migrar el frontend a enviar/leer por `_id`.
5. Cuando el tráfico por email sea 0, dropear las comparaciones por email y las columnas.

## Pendientes de RLS (mismo patrón que pagos/categorias ya arreglados)

Tablas con RLS habilitada **sin policies** → lecturas/escrituras del cliente fallan
en silencio. Cada una necesita policies acordes a su flujo:

| Tabla | Lectura | Escritura | Nota |
|---|---|---|---|
| `clases_realizadas` | docente o alumno de la clase | docente (insert) | El cliente hace POST directo (`insertClaseRealizada`). Confirmar si debe migrar a RPC SECURITY DEFINER |
| `alertas_busquedas` | **cross-user**: docentes leen alertas `activa=true` de alumnos | dueño (CRUD) | OJO privacidad: expone qué buscan los alumnos + su email. Idealmente exponer matches vía RPC SECURITY DEFINER, no SELECT abierto |
| `anuncios_globales` | solo admin | service_role | Panel de historial admin |
| `referidos` | dueño | según flujo | Revisar sistema de referidos |

## Vistas SECURITY DEFINER (advisor: ERROR)

Son proyecciones **curadas deliberadas**, pero el advisor las marca porque
bypassean RLS. Decisión por vista:

- `mp_conexiones_public` — **OK por diseño**: excluye `access_token`/`refresh_token`.
  Considerar `security_invoker=true` + RLS en `mp_conexiones` para quitar el warning.
- `publicaciones_con_autor` — **expone `autor_email`** a cualquiera que liste
  publicaciones → vector de "puenteo" (contradice la decisión de quitar LinkedIn/web).
  Opciones: (a) quitar `autor_email` de la vista y exponer el contacto solo vía RPC
  cuando hay inscripción/chat; (b) `security_invoker=true`. **Alto impacto en código.**
- `metricas_docente` — expone `autor_email` agregado. Restringir a dueño/admin.
- `publicaciones_publicas` — no expone email (buen diseño). Verificar que `u.avatar`
  exista (la columna real es `avatar_url`) — puede estar **rota/sin uso**.

## Otros (advisor)

- **Permissive INSERT `WITH CHECK (true)`**:
  - `quejas` (público) — intencional (libro de quejas anónimo). Agregar rate-limit/captcha contra spam.
  - `alertas_digest_queue` (authenticated) — acotar a que `usuario_email` sea el del JWT.
- **`extension_in_public`** (`pg_trgm`, `unaccent`) — mover a schema `extensions`.
  Bajo impacto; cuidado: funciones que las referencian deben actualizar el search_path.
- **Leaked Password Protection + MFA** — requiere plan **Pro** (ya anotado en memoria).
- **Validación de password**: hoy solo `length >= 6` en cliente. Subir a 8+ y validar server-side.

## NO tocar
- Schema `trading.*` → proyecto personal separado (bot IOL).
- `Permissions-Policy` de `vercel.json` → Jit.si abre en pestaña nueva, no en iframe;
  Luderis no usa cámara/mic. Está correcto.
