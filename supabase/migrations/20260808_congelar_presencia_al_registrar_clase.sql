-- La medición se congela sobre la clase en el momento de declararla. Si se
-- calculara al resolver la disputa, dependería de datos que pueden haber
-- cambiado; acá queda el número tal como estaba cuando el docente declaró.
alter table public.clases_realizadas
  add column if not exists minutos_presencia integer;

comment on column public.clases_realizadas.minutos_presencia is
  'Minutos con ambas partes presentes según clase_presencias, medidos al declarar la clase. NULL = no se midió (clase presencial o fuera de la app).';

-- Minutos medidos para una fecha, para que la agenda pre-cargue las horas
-- reales en vez de que el docente las tipee de memoria.
create or replace function public.minutos_medidos(p_pub_id uuid, p_fecha date)
returns jsonb
language plpgsql stable security definer set search_path to 'public','pg_temp'
as $$
declare v_email text := (select auth.email()); v_max int := 0; v_m int; v_ins record; v_n int := 0;
begin
  if not exists (select 1 from public.publicaciones p
                  where p.id = p_pub_id and p.autor_id = (select auth.uid())) then
    return jsonb_build_object('error','No autorizado');
  end if;
  for v_ins in
    select i.alumno_email from public.inscripciones i
     where i.publicacion_id = p_pub_id and coalesce(i.estado,'activa') = 'activa'
       and i.alumno_email is not null
  loop
    v_m := public.minutos_presencia_compartida(p_pub_id, v_email, v_ins.alumno_email, p_fecha);
    if v_m > 0 then v_n := v_n + 1; end if;
    v_max := greatest(v_max, v_m);
  end loop;
  return jsonb_build_object('ok', true, 'minutos', v_max,
                            'horas', round(v_max/60.0, 2), 'alumnos_medidos', v_n);
end $$;

revoke all on function public.minutos_medidos(uuid, date) from public, anon;
grant execute on function public.minutos_medidos(uuid, date) to authenticated;

-- registrar_clase_dictada: idéntica, salvo que ahora graba la medición de
-- presencia de cada alumno junto con las horas declaradas.
--
-- Deliberadamente NO rechaza declarar más horas que las medidas: una clase
-- presencial mide cero y bloquearla dejaría a esos docentes sin poder cobrar.
-- El desvío se muestra en la UI y, si el alumno objeta, lo dirime la regla por
-- defecto (sin evidencia, valen las horas del alumno).
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

    v_pres := public.minutos_presencia_compartida(p_pub_id, v_email, v_ins.alumno_email, p_fecha);

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min,
       confirmado_docente, confirmado_alumno, evidencia_url, evidencia_expira_at,
       minutos_presencia)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_min, true, false,
       v_evid, case when v_evid is not null then now() + interval '72 hours' end,
       nullif(v_pres, 0));
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
