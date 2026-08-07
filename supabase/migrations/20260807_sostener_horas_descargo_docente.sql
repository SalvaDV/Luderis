-- Objeción de horas: el docente solo tenía "Aceptar las horas del alumno".
-- La disputa ya se abre sola al objetar, pero el docente no tenía forma de dar
-- su versión, así que la única salida visible era resignar las horas.
--
-- Se agrega el descargo del docente sobre la disputa ya abierta. No cambia el
-- estado: sigue 'abierta' y la resuelve el admin con resolver_disputa_horas().

alter table public.disputas
  add column if not exists descargo_docente text,
  add column if not exists descargo_at timestamptz;

create or replace function public.sostener_horas_clase(
  p_clase_id uuid,
  p_descargo text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_clase   public.clases_realizadas%rowtype;
  v_caller  text := auth.email();
  v_disputa uuid;
  v_admin   text;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;

  if v_caller is distinct from v_clase.docente_email then
    return jsonb_build_object('error','Solo el docente puede responder la objeción');
  end if;
  if v_clase.objetada_at is null then
    return jsonb_build_object('error','Esta clase no tiene una objeción abierta');
  end if;

  update public.disputas
     set descargo_docente = nullif(btrim(coalesce(p_descargo,'')),''),
         descargo_at      = now(),
         updated_at       = now()
   where clase_realizada_id = p_clase_id and estado = 'abierta'
   returning id into v_disputa;

  if v_disputa is null then
    return jsonb_build_object('error','No hay una disputa abierta para esta clase');
  end if;

  perform public.notificar(v_clase.alumno_email, 'confirmar_clase', v_clase.publicacion_id,
    'El docente sostiene las horas declaradas. Lo resuelve el equipo de Luderis.');

  for v_admin in select email from public.usuarios where rol = 'admin' loop
    perform public.notificar(v_admin, 'sistema', v_clase.publicacion_id,
      'Disputa de horas sin acuerdo: hay que resolverla desde el panel');
  end loop;

  return jsonb_build_object('ok', true, 'disputa_id', v_disputa);
end $$;

revoke all on function public.sostener_horas_clase(uuid, text) from public, anon;
grant execute on function public.sostener_horas_clase(uuid, text) to authenticated;
