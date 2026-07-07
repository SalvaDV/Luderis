-- ═══════════════════════════════════════════════════════════════════════════
-- SEGURIDAD: endurecer el path de escrow (confirmación de clases + liberación)
--
-- Hueco (CRÍTICO): `confirmar_clase(p_clase_id, p_usuario_email)` confiaba en el
-- email pasado por PARÁMETRO para decidir si confirma como docente o alumno. Ese
-- parámetro es controlado por el cliente → cualquier usuario autenticado podía
-- llamar `confirmar_clase(clase, email_de_la_otra_parte)` y forjar la doble
-- confirmación, disparando luego `liberar_pago_clase` y liberando el escrow sin
-- acuerdo real de ambas partes.
--
-- Fix: usar `auth.email()` (identidad autoritativa del JWT) como fuente de verdad,
-- ignorando el parámetro (se conserva en la firma por compatibilidad con el
-- frontend, que igual pasa el email propio del usuario). Además se agrega un
-- chequeo de llamante en `liberar_pago_clase`: solo una parte de la clase (o el
-- service_role, cuando v_caller es NULL) puede dispararla.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.confirmar_clase(p_clase_id uuid, p_usuario_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_clase  clases_realizadas%ROWTYPE;
  v_ambos  BOOLEAN;
  v_caller text := auth.email();  -- identidad del JWT, NO el parámetro (spoofeable)
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;

  SELECT * INTO v_clase FROM clases_realizadas WHERE id = p_clase_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Clase no encontrada'); END IF;

  IF v_caller = v_clase.docente_email THEN
    UPDATE clases_realizadas SET confirmado_docente = TRUE WHERE id = p_clase_id;
  ELSIF v_caller = v_clase.alumno_email THEN
    UPDATE clases_realizadas SET confirmado_alumno = TRUE WHERE id = p_clase_id;
  ELSE
    RETURN jsonb_build_object('error', 'No autorizado');
  END IF;

  SELECT confirmado_docente AND confirmado_alumno INTO v_ambos
    FROM clases_realizadas WHERE id = p_clase_id;

  IF v_ambos THEN
    UPDATE clases_realizadas
      SET confirmada_at = NOW()
      WHERE id = p_clase_id AND confirmada_at IS NULL;
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'ambos_confirmaron', v_ambos);
END;
$function$;

CREATE OR REPLACE FUNCTION public.liberar_pago_clase(p_clase_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_clase   clases_realizadas%ROWTYPE;
  v_mov     billetera_movimientos%ROWTYPE;
  v_monto   NUMERIC;
  v_doc_id  UUID;
  v_caller  text := auth.email();
BEGIN
  -- Verificar que la clase está confirmada por ambos
  SELECT * INTO v_clase FROM clases_realizadas WHERE id = p_clase_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','Clase no encontrada'); END IF;

  -- Solo una parte de la clase (o el sistema vía service_role, v_caller NULL)
  -- puede disparar la liberación.
  IF v_caller IS NOT NULL
     AND v_caller <> v_clase.docente_email
     AND v_caller <> v_clase.alumno_email THEN
    RETURN jsonb_build_object('error','No autorizado');
  END IF;

  IF NOT (v_clase.confirmado_docente AND v_clase.confirmado_alumno) THEN
    RETURN jsonb_build_object('error','La clase aún no fue confirmada por ambas partes');
  END IF;

  -- Buscar movimiento pendiente asociado a esta publicación para este docente
  SELECT bm.* INTO v_mov
  FROM billetera_movimientos bm
  JOIN usuarios u ON u.id = bm.usuario_id
  WHERE bm.publicacion_id = v_clase.publicacion_id
    AND bm.estado = 'pendiente'
    AND u.email = v_clase.docente_email
  ORDER BY bm.created_at
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','No hay fondos pendientes para esta clase');
  END IF;

  -- Calcular monto por clase: total_pendiente / clases_totales de la inscripción
  SELECT i.clases_totales INTO v_mov.monto
  FROM inscripciones i
  WHERE i.publicacion_id = v_clase.publicacion_id
    AND i.alumno_email = v_clase.alumno_email
  LIMIT 1;

  IF v_mov.monto IS NULL OR v_mov.monto = 0 THEN
    v_monto := v_mov.monto;
  ELSE
    SELECT bm.monto / GREATEST(i.clases_totales,1) INTO v_monto
    FROM billetera_movimientos bm
    JOIN inscripciones i ON i.publicacion_id = bm.publicacion_id AND i.alumno_email = v_clase.alumno_email
    JOIN usuarios u ON u.id = bm.usuario_id
    WHERE bm.publicacion_id = v_clase.publicacion_id
      AND bm.estado = 'pendiente'
      AND u.email = v_clase.docente_email
    LIMIT 1;
  END IF;

  IF v_monto IS NULL OR v_monto <= 0 THEN
    v_monto := v_mov.monto;
  END IF;

  SELECT id INTO v_doc_id FROM usuarios WHERE email = v_clase.docente_email LIMIT 1;

  INSERT INTO billetera_movimientos(
    usuario_id, tipo, monto, estado, descripcion,
    publicacion_id, clase_realizada_id, created_at
  ) VALUES (
    v_doc_id, 'cobro_clase', v_monto, 'liberado',
    'Clase confirmada — pago liberado',
    v_clase.publicacion_id, p_clase_id, NOW()
  );

  INSERT INTO billetera(usuario_id, saldo, updated_at)
    VALUES (v_doc_id, v_monto, NOW())
    ON CONFLICT (usuario_id)
    DO UPDATE SET saldo = billetera.saldo + v_monto, updated_at = NOW();

  UPDATE billetera_movimientos
    SET estado = 'liberado', clase_realizada_id = p_clase_id
    WHERE id = v_mov.id;

  RETURN jsonb_build_object('ok', TRUE, 'monto_liberado', v_monto);
END;
$function$;
