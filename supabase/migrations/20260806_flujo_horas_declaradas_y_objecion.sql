-- ═══════════════════════════════════════════════════════════════════════════
-- FLUJO DE HORAS: el docente declara cuántas dio, el alumno aprueba u objeta
--
--   1. El docente registra la clase declarando las horas dictadas.
--   2. El alumno aprueba  → se consumen esas horas y se libera la parte
--                            proporcional del hold.
--      El alumno objeta   → propone cuántas horas fueron de verdad. El cobro
--                            queda CONGELADO hasta que haya acuerdo.
--      El alumno no hace nada por 72 hs → se aprueba solo (salvo que haya
--                            objetado: una objeción frena el reloj).
--   3. Sobre una objeción, el docente puede aceptar el número del alumno
--      (se liquida por ese número) o dejarla abierta para que la resuelva un
--      admin. Nada se paga hasta entonces.
--
-- El consumo se lleva en MINUTOS, no en unidades enteras: así 1,5 h no pierde
-- precisión y la plata se libera exactamente proporcional a lo dictado sobre la
-- capacidad comprada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Columnas nuevas ──────────────────────────────────────────────────────
ALTER TABLE public.inscripciones
  ADD COLUMN IF NOT EXISTS minutos_totales    integer,
  ADD COLUMN IF NOT EXISTS minutos_consumidos integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.inscripciones.minutos_totales IS
  'Capacidad comprada en minutos. Si es NULL se deriva de clases_totales * 60.';
COMMENT ON COLUMN public.inscripciones.minutos_consumidos IS
  'Minutos ya dictados y confirmados. El saldo es capacidad - consumidos.';

ALTER TABLE public.clases_realizadas
  ADD COLUMN IF NOT EXISTS duracion_objetada_min integer,
  ADD COLUMN IF NOT EXISTS objetada_at           timestamptz,
  ADD COLUMN IF NOT EXISTS objetada_motivo       text;

COMMENT ON COLUMN public.clases_realizadas.duracion_objetada_min IS
  'Minutos que el alumno dice que fueron en realidad. Mientras esté seteada y '
  'objetada_at no sea NULL, la clase está congelada: no consume ni libera.';

-- ── 2. Capacidad y saldo de una inscripción (en minutos) ────────────────────
CREATE OR REPLACE FUNCTION public._capacidad_min(p_ins public.inscripciones)
 RETURNS integer LANGUAGE sql IMMUTABLE
AS $$ select coalesce(p_ins.minutos_totales, coalesce(p_ins.clases_totales,0) * 60) $$;

-- Minutos ya comprometidos por clases registradas que todavía no se liquidaron.
-- Evita que el docente registre más horas de las compradas mientras el alumno
-- todavía no confirmó las anteriores.
CREATE OR REPLACE FUNCTION public._minutos_comprometidos(p_pub_id uuid, p_alumno text)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  select coalesce(sum(coalesce(cr.duracion_min,0)), 0)::int
    from public.clases_realizadas cr
   where cr.publicacion_id = p_pub_id
     and cr.alumno_email   = p_alumno
     and coalesce(cr.confirmado_alumno,false) = false
$$;

-- ── 3. Liquidar una clase: consumir minutos + liberar plata proporcional ────
-- Una sola primitiva para los tres disparadores (alumno aprueba, docente acepta
-- la objeción, o se vence el plazo), así no hay tres versiones de la cuenta.
CREATE OR REPLACE FUNCTION public._liquidar_clase(p_clase_id uuid)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase   public.clases_realizadas%rowtype;
  v_ins     public.inscripciones%rowtype;
  v_cap     int;
  v_monto   numeric := 0;
  v_lib     numeric := 0;
begin
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return 0; end if;

  -- Congelada por objeción sin resolver: no se toca la plata.
  if v_clase.objetada_at is not null then return 0; end if;

  select * into v_ins from public.inscripciones
   where publicacion_id = v_clase.publicacion_id
     and alumno_email   = v_clase.alumno_email
     and coalesce(estado,'activa') = 'activa'
   order by created_at limit 1;
  if not found then return 0; end if;

  -- Compra entera (sin unidades): la liberación la maneja el flujo viejo.
  if v_ins.clases_totales is null and v_ins.minutos_totales is null then return 0; end if;

  v_cap := public._capacidad_min(v_ins);
  if v_cap <= 0 then return 0; end if;

  -- Consumir los minutos dictados (tope: lo que quede).
  update public.inscripciones
     set minutos_consumidos = least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap),
         clases_restantes   = greatest(
           ceil((v_cap - least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap))::numeric / 60)::int, 0)
   where id = v_ins.id;

  -- Plata proporcional a los minutos sobre la capacidad comprada.
  select coalesce(bm.monto,0) * (coalesce(v_clase.duracion_min,0)::numeric / v_cap) into v_monto
    from public.billetera_movimientos bm
   where bm.mp_payment_id = v_ins.mp_payment_id and bm.estado = 'pendiente'
   order by bm.created_at limit 1;

  if coalesce(v_monto,0) <= 0 then return 0; end if;

  v_lib := public._liberar_hold_parcial(v_ins.mp_payment_id, v_monto, p_clase_id);
  return coalesce(v_lib,0);
end $$;

REVOKE EXECUTE ON FUNCTION public._liquidar_clase(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._minutos_comprometidos(uuid,text) FROM PUBLIC, anon, authenticated;

-- ── 4. Registrar la clase declarando las horas ──────────────────────────────
-- Se reemplaza la firma de 2 args por una de 3 con default, así la llamada
-- vieja (sin horas) sigue funcionando mientras se actualiza el front.
DROP FUNCTION IF EXISTS public.registrar_clase_dictada(uuid, date);

CREATE OR REPLACE FUNCTION public.registrar_clase_dictada(
  p_pub_id uuid,
  p_fecha  date,
  p_horas  numeric DEFAULT 1
)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_uid    uuid := auth.uid();
  v_email  text := auth.email();
  v_pub    public.publicaciones%rowtype;
  v_min    int;
  -- %rowtype y no `record`: _capacidad_min recibe la fila tipada y un record
  -- no se puede castear a inscripciones.
  v_ins    public.inscripciones%rowtype;
  v_cap    int;
  v_disp   int;
  v_n      int := 0;
  v_dup    int := 0;
  v_sin_u  int := 0;
begin
  if v_uid is null then return jsonb_build_object('error','No autorizado'); end if;

  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  if v_pub.autor_id is distinct from v_uid then
    return jsonb_build_object('error','Solo el docente puede registrar la clase');
  end if;
  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error','Esa clase todavía no ocurrió');
  end if;

  v_min := round(coalesce(p_horas,1) * 60)::int;
  if v_min <= 0 then return jsonb_build_object('error','Las horas tienen que ser mayores a cero'); end if;
  if v_min > 24*60 then return jsonb_build_object('error','Una clase no puede durar más de 24 horas'); end if;

  for v_ins in
    select i.* from public.inscripciones i
     where i.publicacion_id = p_pub_id
       and coalesce(i.estado,'activa') = 'activa'
       and i.alumno_email is not null
  loop
    if exists (
      select 1 from public.clases_realizadas cr
       where cr.publicacion_id = p_pub_id
         and cr.alumno_email = v_ins.alumno_email
         and cr.fecha_clase::date = p_fecha
    ) then
      v_dup := v_dup + 1;
      continue;
    end if;

    -- Tope real: no se puede dictar más de lo comprado (descontando lo ya
    -- consumido y lo registrado que el alumno todavía no confirmó).
    v_cap := public._capacidad_min(v_ins);
    if v_cap > 0 then
      v_disp := v_cap - coalesce(v_ins.minutos_consumidos,0)
                      - public._minutos_comprometidos(p_pub_id, v_ins.alumno_email);
      if v_disp < v_min then
        v_sin_u := v_sin_u + 1;
        continue;
      end if;
    end if;

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min,
       confirmado_docente, confirmado_alumno)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_min, true, false);
    v_n := v_n + 1;

    perform public.notificar(v_ins.alumno_email, 'confirmar_clase', p_pub_id, v_pub.titulo);
  end loop;

  if v_n = 0 and v_sin_u > 0 and v_dup = 0 then
    return jsonb_build_object('error',
      'No quedan horas compradas suficientes. El alumno tiene que sumar más horas.');
  end if;

  return jsonb_build_object('ok', true, 'registradas', v_n, 'ya_estaban', v_dup,
                            'sin_horas', v_sin_u, 'duracion_min', v_min);
end $$;

-- ── 5. El alumno aprueba (o el docente confirma su lado) ────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_clase(p_clase_id uuid, p_usuario_email text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase    public.clases_realizadas%rowtype;
  v_ambos    boolean;
  v_caller   text := auth.email();
  v_liberado numeric := 0;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;

  if v_clase.objetada_at is not null then
    return jsonb_build_object('error','Esta clase tiene una objeción pendiente de acuerdo');
  end if;

  -- La identidad sale del JWT, nunca del parámetro.
  if v_caller = v_clase.docente_email then
    update public.clases_realizadas set confirmado_docente = true where id = p_clase_id;
  elsif v_caller = v_clase.alumno_email then
    update public.clases_realizadas set confirmado_alumno = true where id = p_clase_id;
  else
    return jsonb_build_object('error','No autorizado');
  end if;

  select confirmado_docente and confirmado_alumno into v_ambos
    from public.clases_realizadas where id = p_clase_id;

  if v_ambos then
    update public.clases_realizadas set confirmada_at = now()
     where id = p_clase_id and confirmada_at is null;
    v_liberado := public._liquidar_clase(p_clase_id);
  end if;

  return jsonb_build_object('ok', true, 'ambos_confirmaron', v_ambos,
                            'monto_liberado', coalesce(v_liberado,0));
end $$;

-- ── 6. El alumno objeta: propone cuántas horas fueron ───────────────────────
CREATE OR REPLACE FUNCTION public.objetar_horas_clase(
  p_clase_id uuid,
  p_horas    numeric,
  p_motivo   text DEFAULT null
)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_caller text := auth.email();
  v_min int;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.alumno_email then
    return jsonb_build_object('error','Solo el alumno puede objetar las horas');
  end if;
  if coalesce(v_clase.confirmado_alumno,false) then
    return jsonb_build_object('error','Ya aprobaste esta clase');
  end if;

  v_min := round(coalesce(p_horas,0) * 60)::int;
  if v_min < 0 then return jsonb_build_object('error','Las horas no pueden ser negativas'); end if;
  if v_min > coalesce(v_clase.duracion_min,0) then
    return jsonb_build_object('error','No podés objetar declarando más horas que el docente');
  end if;

  update public.clases_realizadas
     set duracion_objetada_min = v_min,
         objetada_at = now(),
         objetada_motivo = p_motivo
   where id = p_clase_id;

  perform public.notificar(v_clase.docente_email, 'confirmar_clase',
                           v_clase.publicacion_id, 'Un alumno objetó las horas de una clase');

  return jsonb_build_object('ok', true, 'horas_objetadas', v_min::numeric/60);
end $$;

-- ── 7. El docente acepta la objeción → se liquida por ese número ────────────
CREATE OR REPLACE FUNCTION public.aceptar_objecion_clase(p_clase_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_caller text := auth.email();
  v_lib numeric := 0;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.docente_email then
    return jsonb_build_object('error','Solo el docente puede aceptar la objeción');
  end if;
  if v_clase.objetada_at is null then
    return jsonb_build_object('error','Esta clase no tiene una objeción abierta');
  end if;

  -- Se liquida por el número del alumno y se cierra la objeción.
  update public.clases_realizadas
     set duracion_min = coalesce(duracion_objetada_min, duracion_min),
         objetada_at = null,
         confirmado_alumno = true,
         confirmada_at = coalesce(confirmada_at, now())
   where id = p_clase_id;

  v_lib := public._liquidar_clase(p_clase_id);

  perform public.notificar(v_clase.alumno_email, 'confirmar_clase',
                           v_clase.publicacion_id, 'El docente aceptó tu objeción de horas');

  return jsonb_build_object('ok', true, 'monto_liberado', coalesce(v_lib,0));
end $$;

-- ── 8. Auto-aprobación a las 72 hs (una objeción frena el reloj) ────────────
CREATE OR REPLACE FUNCTION public.auto_liberar_inscripciones_vencidas()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare v_ins record; v_cl record; v_n int := 0; v_monto numeric := 0; v_lib numeric;
begin
  -- (a) Compra entera: liberar el hold completo (sigue a 7 días).
  for v_ins in
    select i.* from public.inscripciones i
    where i.clase_finalizada = true
      and coalesce(i.alumno_confirmada, false) = false
      and coalesce(i.estado, 'activa') = 'activa'
      and i.clases_totales is null
      and i.fecha_finalizacion is not null
      and i.fecha_finalizacion < now() - interval '7 days'
      and exists (select 1 from public.billetera_movimientos bm
                   where bm.mp_payment_id = i.mp_payment_id and bm.estado = 'pendiente')
  loop
    v_lib := public._liberar_hold_pago(v_ins.mp_payment_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  -- (b) Horas declaradas: si el alumno no aprobó ni objetó en 72 hs, se aprueba.
  for v_cl in
    select cr.id as clase_id
      from public.clases_realizadas cr
     where cr.confirmado_docente = true
       and coalesce(cr.confirmado_alumno,false) = false
       and cr.objetada_at is null                      -- una objeción frena el reloj
       and cr.created_at < now() - interval '72 hours'
       and not exists (select 1 from public.billetera_movimientos bm
                        where bm.clase_realizada_id = cr.id and bm.tipo = 'cobro_clase')
  loop
    update public.clases_realizadas
       set confirmado_alumno = true, confirmada_at = coalesce(confirmada_at, now())
     where id = v_cl.clase_id;
    v_lib := public._liquidar_clase(v_cl.clase_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  return jsonb_build_object('ok', true, 'inscripciones_liberadas', v_n, 'monto_total', v_monto);
end $$;
