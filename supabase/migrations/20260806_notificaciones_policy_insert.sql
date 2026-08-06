-- ═══════════════════════════════════════════════════════════════════════════
-- PASO B — cierra F1 (auditoría 2026-08)
--
-- Requiere el paso A (`20260806_notificar_rpc.sql`) aplicado y el deploy con
-- `insertNotificacion` apuntando a la RPC ya vivo. Ambos verificados antes de
-- aplicar esto.
--
-- Antes: `with check (auth.role() = 'authenticated')`. Cualquier cuenta con
-- sesión podía insertar una notificación para cualquier destinatario, con tipo
-- y texto arbitrarios — incluidos los avisos que el panel de admin usa para
-- comunicaciones oficiales ("tu retiro fue procesado"). La UI de admin era
-- apariencia de control; el control real es esta policy.
--
-- Ahora el INSERT directo queda solo para uno mismo. Notificar a terceros pasa
-- por `notificar()`, que valida la relación server-side (chat, inscripción u
-- oferta) y exige que accion_url sea una ruta interna.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "notificaciones insert authenticated" on public.notificaciones;

create policy "notificaciones insert propia" on public.notificaciones
  for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    or alumno_email = (select auth.email())
  );

-- Tres tipos que la app usaba NO estaban en el CHECK, así que el insert fallaba
-- siempre y el `.catch()` de cada call-site lo tragaba en silencio. El más grave
-- era `confirmar_clase`: es el aviso que le pide al alumno confirmar, y
-- confirmar es lo que LIBERA el pago al docente.
alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo = any (array[
    'valorar_curso','nueva_oferta','oferta_aceptada','oferta_rechazada',
    'nuevo_mensaje','nueva_inscripcion','nuevo_documento','publicacion_destacada',
    'sistema','nuevo_ayudante','chat_grupal','clase_iniciada','nuevo_contenido',
    'busqueda_eliminada','busqueda_acordada','contraoferta','pago_aprobado_mp',
    'alerta_publicacion','nueva_pregunta','pregunta_respondida','alerta_contacto',
    'pago_liberado',
    -- agregados 2026-08-06
    'confirmar_clase','retiro_solicitado','acuerdo_confirmado','liquidacion_disponible'
  ]));
