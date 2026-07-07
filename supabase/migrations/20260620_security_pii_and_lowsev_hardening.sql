-- ═══════════════════════════════════════════════════════════════════════════
-- SEGURIDAD: fuga de PII (MP) + funciones de baja severidad con params falseables
--
--  1) mp_conexiones_public: cualquier usuario autenticado podía SELECT toda la
--     vista y leer los emails de MercadoPago de todos los docentes conectados.
--     La app NO consulta esta vista por PostgREST (el estado MP viene de la edge
--     function mp-oauth y de get_docente_mp_connected). → Revocar acceso directo.
--
--  2) actualizar_streak(p_usuario_id): tomaba el id por parámetro sin validar al
--     llamante → se podía bumpear la racha de otro usuario. → Forzar auth.uid().
--
--  3) marcar_notifs_leidas(p_email): overload con email falseable, no usado por la
--     app (existe la versión sin args que valida auth). → Revocar EXECUTE.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) PII: cerrar acceso directo a la vista de conexiones MP
REVOKE SELECT ON public.mp_conexiones_public FROM anon, authenticated;

-- 2) Racha: solo tu propia racha
CREATE OR REPLACE FUNCTION public.actualizar_streak(p_usuario_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ultimo date;
  v_dias   integer;
  v_hoy    date := CURRENT_DATE;
  v_uid    uuid := auth.uid();
BEGIN
  -- Un usuario autenticado solo puede actualizar SU propia racha; el service_role
  -- (v_uid NULL) puede pasar el id explícito.
  IF v_uid IS NOT NULL THEN
    p_usuario_id := v_uid;
  END IF;

  SELECT ultimo_acceso, dias_racha
    INTO v_ultimo, v_dias
    FROM usuarios
   WHERE id = p_usuario_id;

  IF NOT FOUND THEN
    RETURN 1;
  END IF;

  IF v_ultimo IS NULL THEN
    UPDATE usuarios SET ultimo_acceso = v_hoy, dias_racha = 1 WHERE id = p_usuario_id;
    RETURN 1;
  ELSIF v_ultimo = v_hoy THEN
    RETURN COALESCE(v_dias, 1);
  ELSIF v_ultimo = v_hoy - INTERVAL '1 day' THEN
    v_dias := COALESCE(v_dias, 1) + 1;
    UPDATE usuarios SET ultimo_acceso = v_hoy, dias_racha = v_dias WHERE id = p_usuario_id;
    RETURN v_dias;
  ELSE
    UPDATE usuarios SET ultimo_acceso = v_hoy, dias_racha = 1 WHERE id = p_usuario_id;
    RETURN 1;
  END IF;
END;
$function$;

-- 3) Notifs: revocar el overload falseable (la versión sin args sigue disponible)
REVOKE EXECUTE ON FUNCTION public.marcar_notifs_leidas(text) FROM anon, authenticated;
