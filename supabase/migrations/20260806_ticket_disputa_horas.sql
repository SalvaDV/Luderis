-- ═══════════════════════════════════════════════════════════════════════════
-- OBJECIÓN DE HORAS → TICKET EN EL PANEL DE ADMIN
--
-- Antes la objeción sólo la podía destrabar el docente aceptando el número del
-- alumno. Si no aceptaba, quedaba congelada para siempre y sin nadie a cargo.
-- Ahora cada objeción abre un ticket en `disputas`, que es la bandeja que el
-- panel de admin ya lista (disputas?estado=eq.abierta) y contabiliza.
--
-- El docente conserva el atajo de aceptar el número del alumno: cierra el ticket
-- sin trabajo de admin y sólo puede resolverse a favor del alumno, así que es
-- seguro dejarlo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. La disputa apunta a la clase y admite el motivo/estados nuevos ───────
ALTER TABLE public.disputas
  ADD COLUMN IF NOT EXISTS clase_realizada_id uuid REFERENCES public.clases_realizadas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS horas_docente numeric,
  ADD COLUMN IF NOT EXISTS horas_alumno  numeric,
  ADD COLUMN IF NOT EXISTS horas_finales numeric;

ALTER TABLE public.disputas DROP CONSTRAINT IF EXISTS disputas_motivo_check;
ALTER TABLE public.disputas ADD CONSTRAINT disputas_motivo_check
  CHECK (motivo = ANY (ARRAY['clase_no_dada','problema_calidad','horas_declaradas','otro']));

-- 'resuelta_parcial': el admin fijó un número intermedio entre lo que declaró
-- el docente y lo que dijo el alumno.
ALTER TABLE public.disputas DROP CONSTRAINT IF EXISTS disputas_estado_check;
ALTER TABLE public.disputas ADD CONSTRAINT disputas_estado_check
  CHECK (estado = ANY (ARRAY['abierta','resuelta_alumno','resuelta_docente','resuelta_parcial']));

-- ── 2. Objetar abre el ticket ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.objetar_horas_clase(p_clase_id uuid, p_horas numeric, p_motivo text DEFAULT null)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_caller text := auth.email();
  v_min int;
  v_ins_id uuid;
  v_disputa_id uuid;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.alumno_email then
    return jsonb_build_object('error','Solo el alumno puede objetar las horas'); end if;
  if coalesce(v_clase.confirmado_alumno,false) then
    return jsonb_build_object('error','Ya aprobaste esta clase'); end if;
  if v_clase.objetada_at is not null then
    return jsonb_build_object('error','Ya objetaste esta clase'); end if;

  v_min := round(coalesce(p_horas,0) * 60)::int;
  if v_min < 0 then return jsonb_build_object('error','Las horas no pueden ser negativas'); end if;
  if v_min > coalesce(v_clase.duracion_min,0) then
    return jsonb_build_object('error','No podés objetar declarando más horas que el docente'); end if;

  update public.clases_realizadas
     set duracion_objetada_min = v_min, objetada_at = now(), objetada_motivo = p_motivo
   where id = p_clase_id;

  select id into v_ins_id from public.inscripciones
   where publicacion_id = v_clase.publicacion_id and alumno_email = v_clase.alumno_email
     and coalesce(estado,'activa') = 'activa'
   order by created_at limit 1;

  -- Ticket para el panel de admin.
  insert into public.disputas
    (clase_realizada_id, inscripcion_id, alumno_email, docente_email, motivo, descripcion,
     estado, horas_docente, horas_alumno)
  values
    (p_clase_id, v_ins_id, v_clase.alumno_email, v_clase.docente_email, 'horas_declaradas',
     coalesce(p_motivo,'') , 'abierta',
     coalesce(v_clase.duracion_min,0)::numeric/60, v_min::numeric/60)
  returning id into v_disputa_id;

  perform public.notificar(v_clase.docente_email, 'confirmar_clase',
                           v_clase.publicacion_id, 'Un alumno objetó las horas de una clase');

  return jsonb_build_object('ok', true, 'horas_objetadas', v_min::numeric/60, 'disputa_id', v_disputa_id);
end $$;

-- ── 3. Si el docente acepta, el ticket se cierra solo ──────────────────────
CREATE OR REPLACE FUNCTION public.aceptar_objecion_clase(p_clase_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare v_clase public.clases_realizadas%rowtype; v_caller text := auth.email(); v_lib numeric := 0;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.docente_email then
    return jsonb_build_object('error','Solo el docente puede aceptar la objeción'); end if;
  if v_clase.objetada_at is null then
    return jsonb_build_object('error','Esta clase no tiene una objeción abierta'); end if;

  update public.clases_realizadas
     set duracion_min = coalesce(duracion_objetada_min, duracion_min),
         objetada_at = null, confirmado_alumno = true,
         confirmada_at = coalesce(confirmada_at, now())
   where id = p_clase_id;

  v_lib := public._liquidar_clase(p_clase_id);

  update public.disputas
     set estado = 'resuelta_alumno',
         horas_finales = coalesce(v_clase.duracion_objetada_min,0)::numeric/60,
         resolucion = 'El docente aceptó las horas declaradas por el alumno',
         resuelto_at = now(), updated_at = now()
   where clase_realizada_id = p_clase_id and estado = 'abierta';

  perform public.notificar(v_clase.alumno_email, 'confirmar_clase',
                           v_clase.publicacion_id, 'El docente aceptó tu objeción de horas');
  return jsonb_build_object('ok', true, 'monto_liberado', coalesce(v_lib,0));
end $$;

-- ── 4. El admin resuelve fijando las horas reales ──────────────────────────
-- Puede fijar cualquier número entre 0 y lo declarado por el docente (por
-- ejemplo, después de mirar la grabación de la clase).
CREATE OR REPLACE FUNCTION public.resolver_disputa_horas(
  p_disputa_id uuid,
  p_horas      numeric,
  p_resolucion text DEFAULT null
)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_disp   public.disputas%rowtype;
  v_clase  public.clases_realizadas%rowtype;
  v_email  text := auth.email();
  v_rol    text;
  v_min    int;
  v_lib    numeric := 0;
  v_estado text;
begin
  select rol into v_rol from public.usuarios where id = auth.uid();
  if coalesce(v_rol,'') is distinct from 'admin' then
    return jsonb_build_object('error','Solo un administrador puede resolver la disputa');
  end if;

  select * into v_disp from public.disputas where id = p_disputa_id;
  if not found then return jsonb_build_object('error','Disputa no encontrada'); end if;
  if v_disp.motivo is distinct from 'horas_declaradas' then
    return jsonb_build_object('error','Esta disputa no es por horas declaradas'); end if;
  if v_disp.estado is distinct from 'abierta' then
    return jsonb_build_object('error','Esta disputa ya fue resuelta'); end if;

  select * into v_clase from public.clases_realizadas where id = v_disp.clase_realizada_id;
  if not found then return jsonb_build_object('error','La clase de la disputa no existe'); end if;

  v_min := round(coalesce(p_horas,0) * 60)::int;
  if v_min < 0 then return jsonb_build_object('error','Las horas no pueden ser negativas'); end if;
  if v_min > coalesce(v_clase.duracion_min,0) then
    return jsonb_build_object('error','No se pueden fijar más horas que las declaradas por el docente'); end if;

  -- Se liquida por el número que fijó el admin.
  update public.clases_realizadas
     set duracion_min = v_min, objetada_at = null,
         confirmado_alumno = true, confirmada_at = coalesce(confirmada_at, now())
   where id = v_clase.id;

  v_lib := public._liquidar_clase(v_clase.id);

  v_estado := case
    when v_min = coalesce(v_clase.duracion_objetada_min,-1) then 'resuelta_alumno'
    when v_min = coalesce(v_clase.duracion_min,-1)          then 'resuelta_docente'
    else 'resuelta_parcial' end;

  update public.disputas
     set estado = v_estado, horas_finales = v_min::numeric/60,
         resolucion = p_resolucion, admin_email = v_email,
         resuelto_at = now(), updated_at = now()
   where id = p_disputa_id;

  perform public.notificar(v_disp.alumno_email,  'confirmar_clase', v_clase.publicacion_id,
                           'Resolvimos la disputa de horas de tu clase');
  perform public.notificar(v_disp.docente_email, 'confirmar_clase', v_clase.publicacion_id,
                           'Resolvimos la disputa de horas de tu clase');

  return jsonb_build_object('ok', true, 'horas_finales', v_min::numeric/60,
                            'monto_liberado', coalesce(v_lib,0), 'estado', v_estado);
end $$;

-- ── 5. pago_id pasa a ser opcional ──────────────────────────────────────────
-- (aplicado en producción como migración separada `disputas_pago_id_nullable`)
-- Las disputas del escrow viejo nacen de un pago; las de horas nacen de una
-- clase. Una disputa tiene que tener al menos una de las dos referencias.
ALTER TABLE public.disputas ALTER COLUMN pago_id DROP NOT NULL;
ALTER TABLE public.disputas ADD CONSTRAINT disputas_referencia_check
  CHECK (pago_id IS NOT NULL OR clase_realizada_id IS NOT NULL);
