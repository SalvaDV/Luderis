-- Dos cambios que van juntos.
--
-- 1) `minutos_presencia` guardaba nullif(medido, 0), o sea que confundía dos
--    cosas muy distintas:
--      • la clase pasó por la app y se midió CERO (alguien estuvo solo)
--      • nadie abrió la app: no hay medición (clase presencial)
--    El primero es evidencia fuerte en contra de las horas declaradas; el
--    segundo no es evidencia de nada. Desde acá: NULL = nunca se midió,
--    0 = se midió y dio cero.
--
-- 2) El reloj de 72 hs aprobaba TODO lo declarado si el alumno no contestaba.
--    Eso contradice la regla publicada de que sin evidencia valen las horas del
--    alumno: una decía que callar aprueba, la otra que sin prueba no se cobra.
--    Permitía declarar las horas el mismo día de la compra y cobrarlas a los 3
--    días sin haber dado clase, si el alumno se iba de viaje.
--
-- Verificado contra producción con rollback: medido 30 sobre 60 declarados se
-- recorta a 30 y confirma; sin medición confirma los 60; medido 0 no confirma.

create or replace function public.hubo_presencia(
  p_pub_id uuid, p_docente_email text, p_alumno_email text, p_fecha date
) returns boolean
language sql stable security definer set search_path to 'public','pg_temp'
as $$
  select exists (
    select 1 from public.clase_presencias
     where publicacion_id = p_pub_id
       and usuario_email in (p_docente_email, p_alumno_email)
       and (inicio_at at time zone 'America/Argentina/Buenos_Aires')::date = p_fecha
  );
$$;

revoke all on function public.hubo_presencia(uuid, text, text, date) from public, anon;
grant execute on function public.hubo_presencia(uuid, text, text, date) to authenticated, service_role;

alter table public.clases_realizadas
  add column if not exists auto_ajuste_at     timestamptz,
  add column if not exists auto_ajuste_motivo text;

comment on column public.clases_realizadas.auto_ajuste_at is
  'Cuándo el reloj de 72 hs revisó esta clase. Evita volver a ajustarla o a avisar todos los días.';

create or replace function public.registrar_clase_dictada(
  p_pub_id uuid, p_fecha date, p_horas numeric default 1, p_evidencia_url text default null)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_uid uuid := auth.uid(); v_email text := auth.email(); v_pub public.publicaciones%rowtype;
  v_min int;
  v_ins public.inscripciones%rowtype;
  v_cap int; v_disp int; v_n int := 0; v_sin_u int := 0; v_max_disp int := 0;
  v_evid text := nullif(trim(coalesce(p_evidencia_url,'')),'');
  v_pres int;
begin
  if v_uid is null then return jsonb_build_object('error','No autorizado'); end if;
  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  if v_pub.autor_id is distinct from v_uid then
    return jsonb_build_object('error','Solo el docente puede registrar la clase'); end if;
  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error','Esa clase todavía no ocurrió'); end if;

  if v_evid is not null and v_evid !~* '^https?://' then
    return jsonb_build_object('error','El link de la grabación tiene que empezar con http(s)://');
  end if;

  v_min := round(coalesce(p_horas,1) * 60)::int;
  if v_min <= 0 then return jsonb_build_object('error','Las horas tienen que ser mayores a cero'); end if;
  if v_min > 24*60 then return jsonb_build_object('error','Una clase no puede durar más de 24 horas'); end if;

  for v_ins in
    select i.* from public.inscripciones i
     where i.publicacion_id = p_pub_id and coalesce(i.estado,'activa') = 'activa'
       and i.alumno_email is not null
  loop
    v_cap := public._capacidad_min(v_ins);
    if v_cap > 0 then
      v_disp := v_cap - coalesce(v_ins.minutos_consumidos,0)
                      - public._minutos_comprometidos(p_pub_id, v_ins.alumno_email);
      v_max_disp := greatest(v_max_disp, v_disp);
      if v_disp < v_min then v_sin_u := v_sin_u + 1; continue; end if;
    end if;

    -- NULL solo si nadie abrió la app ese día. Si alguien la abrió, se guarda
    -- lo medido aunque sea 0: "estuvo uno solo" es evidencia, no ausencia de ella.
    v_pres := case
      when public.hubo_presencia(p_pub_id, v_email, v_ins.alumno_email, p_fecha)
        then public.minutos_presencia_compartida(p_pub_id, v_email, v_ins.alumno_email, p_fecha)
      else null end;

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min,
       confirmado_docente, confirmado_alumno, evidencia_url, evidencia_expira_at,
       minutos_presencia)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_min, true, false,
       v_evid, case when v_evid is not null then now() + interval '72 hours' end,
       v_pres);
    v_n := v_n + 1;
    perform public.notificar(v_ins.alumno_email, 'confirmar_clase', p_pub_id, v_pub.titulo);
  end loop;

  if v_n = 0 and v_sin_u > 0 then
    return jsonb_build_object(
      'error', case when v_max_disp <= 0
                    then 'No quedan horas compradas sin registrar. El alumno tiene que sumar más horas.'
                    else 'Solo quedan ' || trim(to_char(v_max_disp/60.0,'FM999990.00')) ||
                         ' h sin registrar. Cargá esa cantidad o menos.' end,
      'horas_disponibles', round(v_max_disp/60.0, 2));
  end if;

  return jsonb_build_object('ok', true, 'registradas', v_n, 'sin_horas', v_sin_u,
                            'duracion_min', v_min,
                            'horas_disponibles', round(greatest(v_max_disp - v_min,0)/60.0, 2));
end $$;

-- El silencio aprueba SOLO lo que la plataforma puede corroborar:
--   • sin medición (presencial) → aprueba lo declarado. Bloquearlo dejaría sin
--     cobrar a quien da clases presenciales.
--   • medición ≥ lo declarado → aprueba lo declarado.
--   • medición menor pero > 0 → aprueba hasta lo medido, y avisa a los dos.
--   • medición = 0 → el silencio no aprueba nada. Queda a que el alumno
--     confirme o lo resuelva un admin.
create or replace function public.auto_liberar_inscripciones_vencidas()
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_cl record; v_n int := 0; v_monto numeric := 0; v_lib numeric; v_evid int;
  v_ajust int := 0; v_frenadas int := 0; v_aprob int;
begin
  for v_cl in
    select cr.id as clase_id, cr.duracion_min, cr.minutos_presencia,
           cr.docente_email, cr.alumno_email, cr.publicacion_id
      from public.clases_realizadas cr
     where cr.confirmado_docente = true and coalesce(cr.confirmado_alumno,false) = false
       and cr.objetada_at is null
       and cr.created_at < now() - interval '72 hours'
       and cr.auto_ajuste_at is null
       and not exists (select 1 from public.billetera_movimientos bm
                        where bm.clase_realizada_id = cr.id and bm.tipo = 'cobro_clase')
  loop
    if v_cl.minutos_presencia is null then
      v_aprob := v_cl.duracion_min;
    else
      v_aprob := least(v_cl.duracion_min, v_cl.minutos_presencia);
    end if;

    if v_aprob <= 0 then
      update public.clases_realizadas
         set auto_ajuste_at = now(),
             auto_ajuste_motivo = 'Sin presencia compartida registrada: no se aprobó por silencio'
       where id = v_cl.clase_id;
      perform public.notificar(v_cl.docente_email, 'confirmar_clase', v_cl.publicacion_id,
        'No registramos presencia compartida en esa clase: hace falta que el alumno la confirme');
      v_frenadas := v_frenadas + 1;
      continue;
    end if;

    if v_aprob < v_cl.duracion_min then
      update public.clases_realizadas
         set duracion_min = v_aprob,
             auto_ajuste_at = now(),
             auto_ajuste_motivo = 'Ajustada a los minutos de presencia compartida registrados'
       where id = v_cl.clase_id;
      perform public.notificar(v_cl.docente_email, 'confirmar_clase', v_cl.publicacion_id,
        'Ajustamos las horas de una clase a la presencia registrada en la app');
      perform public.notificar(v_cl.alumno_email, 'confirmar_clase', v_cl.publicacion_id,
        'Ajustamos las horas de una clase a la presencia registrada en la app');
      v_ajust := v_ajust + 1;
    else
      update public.clases_realizadas set auto_ajuste_at = now() where id = v_cl.clase_id;
    end if;

    update public.clases_realizadas
       set confirmado_alumno = true, confirmada_at = coalesce(confirmada_at, now())
     where id = v_cl.clase_id;

    v_lib := public._liquidar_clase(v_cl.clase_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  -- Limpieza de evidencias vencidas (no se borra si hay disputa abierta).
  update public.clases_realizadas cr
     set evidencia_url = null, evidencia_expira_at = null
   where cr.evidencia_url is not null
     and cr.evidencia_expira_at < now()
     and not exists (select 1 from public.disputas d
                      where d.clase_realizada_id = cr.id and d.estado = 'abierta');
  get diagnostics v_evid = row_count;

  return jsonb_build_object('ok', true, 'clases_liberadas', v_n,
                            'monto_total', v_monto, 'ajustadas_a_lo_medido', v_ajust,
                            'frenadas_sin_presencia', v_frenadas,
                            'evidencias_borradas', v_evid);
end $$;
