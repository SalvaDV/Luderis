import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Orígenes permitidos — solo el dominio oficial de Luderis y localhost para desarrollo.
const ALLOWED_ORIGINS = new Set([
  "https://luderis.com",
  "https://www.luderis.com",
  "https://classelink.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const getCORS = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://luderis.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
    "Vary": "Origin",
  };
};


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// FALLBACK_ADMIN_EMAIL eliminado por seguridad — el rol admin se valida solo desde la DB

// ── Acciones que SOLO puede ejecutar un admin ─────────────────────────────────
const ADMIN_ONLY_ACTIONS = new Set([
  "toggle_bloqueo",
  "eliminar_usuario",
  "cambiar_rol",
  "toggle_pub",
  "eliminar_pub",
  "enviar_anuncio",
  "aprobar_docente",
  "rechazar_docente",
  "aprobar_verificacion",
  "rechazar_verificacion",
  "resolver_denuncia",
  // Escrow & liquidaciones
  "liberar_pago_manual",
  "resolver_disputa",
  "generar_liquidacion_manual",
  "upsert_config",
]);

// ── Acciones que cualquier usuario autenticado puede ejecutar (con verificación de ownership) ──
const USER_ACTIONS = new Set([
  "borrar_chat",
]);

serve(async (req) => {
  const cors = getCORS(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── 1. Obtener y verificar el JWT del usuario ─────────────────────────────
    const userToken = req.headers.get("x-user-token") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!userToken) {
      return new Response(JSON.stringify({ error: "No autorizado: token requerido" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Crear cliente con service role para operaciones admin
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verificar el JWT del usuario
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(userToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "No autorizado: token inválido" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Acción requerida" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── 2. Verificar permisos según el tipo de acción ─────────────────────────

    if (ADMIN_ONLY_ACTIONS.has(action)) {
      // Verificar que el usuario es admin leyendo de la DB (no de localStorage)
      const { data: usuarioData } = await adminClient
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      const esAdmin = usuarioData?.rol === "admin";
      if (!esAdmin) {
        return new Response(JSON.stringify({ error: "No autorizado: se requiere rol admin" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    } else if (!USER_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── 3. Ejecutar la acción ─────────────────────────────────────────────────

    let result: unknown = { ok: true };

    // ── Acciones de admin ────────────────────────────────────────────────────
    if (action === "toggle_bloqueo") {
      const { user_id, bloqueado } = params;
      if (!user_id) throw new Error("user_id requerido");
      // Fetch email before updating (needed for ban email)
      const { data: uInfo } = await adminClient
        .from("usuarios").select("email").eq("id", user_id).maybeSingle();
      await adminClient.from("usuarios").update({ bloqueado }).eq("id", user_id);
      // Send ban email when blocking (not when unblocking)
      if (bloqueado && uInfo?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ to: uInfo.email, template: "ban_usuario", data: {} }),
        }).then(null, () => null);
      }

    } else if (action === "eliminar_usuario") {
      const { user_id, user_email } = params;
      if (!user_id) throw new Error("user_id requerido");
      // Eliminar de auth y de tabla usuarios
      await adminClient.auth.admin.deleteUser(user_id);
      await adminClient.from("usuarios").delete().eq("id", user_id);
      if (user_email) {
        // Limpiar publicaciones del usuario
        await adminClient.from("publicaciones").delete().eq("autor_email", user_email);
      }

    } else if (action === "cambiar_rol") {
      const { user_id, rol } = params;
      if (!user_id || !rol) throw new Error("user_id y rol requeridos");
      const rolesPermitidos = ["alumno", "docente", "admin"];
      if (!rolesPermitidos.includes(rol)) throw new Error(`Rol inválido: ${rol}`);
      await adminClient.from("usuarios").update({ rol }).eq("id", user_id);

    } else if (action === "toggle_pub") {
      const { pub_id, activo } = params;
      if (!pub_id) throw new Error("pub_id requerido");
      await adminClient.from("publicaciones").update({ activo }).eq("id", pub_id);

    } else if (action === "eliminar_pub") {
      const { pub_id } = params;
      if (!pub_id) throw new Error("pub_id requerido");
      await adminClient.from("publicaciones").delete().eq("id", pub_id);

    } else if (action === "enviar_anuncio") {
      const { titulo, mensaje, tipo, enviada_por } = params;
      if (!titulo || !mensaje) throw new Error("titulo y mensaje requeridos");
      // Fetch all users — necesitamos id Y email para alumno_email
      const { data: usuarios } = await adminClient.from("usuarios").select("id, email");
      const count = usuarios?.length ?? 0;
      if (usuarios && count > 0) {
        const pubTitulo = `${titulo} — ${mensaje}`.slice(0, 255);
        const notifs = (usuarios as Array<{ id: string; email: string }>).map(u => ({
          usuario_id:    u.id,
          alumno_email:  u.email,   // sin esto la notif nunca aparece en el panel
          tipo:          "sistema", // consistente con TIPO_INFO del frontend
          pub_titulo:    pubTitulo,
          leida:         false,
        }));
        // Insertar en lotes de 500
        for (let i = 0; i < notifs.length; i += 500) {
          await adminClient.from("notificaciones").insert(notifs.slice(i, i + 500));
        }
      }
      // Guardar en historial para el panel de admin
      await adminClient.from("anuncios_globales").insert({
        titulo,
        mensaje,
        tipo:          tipo ?? "info",
        enviada_por:   enviada_por ?? user.email,
        destinatarios: count,
      }).then(null, () => null); // silencioso si la tabla no existe aún
      result = { ok: true, destinatarios: count };

    } else if (action === "aprobar_docente") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id requerido");
      await adminClient.from("usuarios").update({ rol: "docente", verificado: true }).eq("id", user_id);

    } else if (action === "rechazar_docente") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id requerido");
      await adminClient.from("usuarios").update({ rol: "alumno", verificado: false }).eq("id", user_id);

    } else if (action === "aprobar_verificacion") {
      const { verificacion_id, user_id } = params;
      if (!verificacion_id || !user_id) throw new Error("verificacion_id y user_id requeridos");

      // Obtener datos del usuario para el email
      const { data: usuarioData } = await adminClient
        .from("usuarios")
        .select("nombre, email")
        .eq("id", user_id)
        .single();

      // Actualizar verificacion
      await adminClient.from("verificaciones_usuario").update({
        estado: "aprobada",
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      }).eq("id", verificacion_id);

      // Promover a docente
      await adminClient.from("usuarios").update({ rol: "docente", verificado: true }).eq("id", user_id);

      // Enviar email de aprobación
      if (usuarioData?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            to: usuarioData.email,
            template: "docente_aprobado",
            data: { nombre: usuarioData.nombre ?? "Docente" },
          }),
        }).then(null, () => null);
      }

    } else if (action === "rechazar_verificacion") {
      const { verificacion_id, user_id, razon } = params;
      if (!verificacion_id || !user_id) throw new Error("verificacion_id y user_id requeridos");

      // Obtener datos del usuario para el email
      const { data: usuarioData } = await adminClient
        .from("usuarios")
        .select("nombre, email")
        .eq("id", user_id)
        .single();

      // Actualizar verificacion
      await adminClient.from("verificaciones_usuario").update({
        estado: "rechazada",
        razon_rechazo: razon ?? null,
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      }).eq("id", verificacion_id);

      // Enviar email de rechazo
      if (usuarioData?.email) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            to: usuarioData.email,
            template: "docente_rechazado",
            data: { nombre: usuarioData.nombre ?? "Usuario", razon: razon ?? "No se especificó motivo." },
          }),
        }).then(null, () => null);
      }

    // ── Moderación: resolver una denuncia ────────────────────────────────────
    } else if (action === "resolver_denuncia") {
      const { denuncia_id, accion_tomada, publicacion_id, denunciado_email, notas } = params;
      if (!denuncia_id || !accion_tomada) throw new Error("denuncia_id y accion_tomada requeridos");

      // Marcar denuncia como revisada
      await adminClient.from("denuncias").update({
        revisada: true,
        accion_tomada,
      }).eq("id", denuncia_id);

      if (accion_tomada === "bloquear_usuario" && denunciado_email) {
        // Bloquear usuario por email
        await adminClient.from("usuarios").update({ bloqueado: true }).eq("email", denunciado_email);
        // Enviar email de ban
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            to: denunciado_email,
            template: "ban_usuario",
            data: { razon: notas || "Denuncia de otro usuario." },
          }),
        }).then(null, () => null);

      } else if (accion_tomada === "eliminar_pub" && publicacion_id) {
        await adminClient.from("publicaciones").delete().eq("id", publicacion_id);

      } else if (accion_tomada === "advertencia" && denunciado_email) {
        const { data: uAdv } = await adminClient
          .from("usuarios").select("id").eq("email", denunciado_email).maybeSingle();
        await adminClient.from("notificaciones").insert({
          usuario_id:   uAdv?.id ?? null,
          alumno_email: denunciado_email,
          tipo:         "sistema",
          pub_titulo:   `⚠️ Tu cuenta recibió una advertencia por denuncia de otro usuario.${notas ? ` Motivo: ${notas}` : ""}`,
          leida:        false,
        }).then(null, () => null);
      }
      result = { ok: true, accion_tomada };

    // ── Escrow: liberar un pago manualmente ─────────────────────────────────
    } else if (action === "liberar_pago_manual") {
      const { pago_id } = params;
      if (!pago_id) throw new Error("pago_id requerido");
      const liberarSecret = Deno.env.get("LIBERAR_PAGO_SECRET") ?? "";
      const lRes = await fetch(`${SUPABASE_URL}/functions/v1/liberar-pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${liberarSecret}` },
        body: JSON.stringify({ pago_id }),
      });
      const lData = await lRes.json();
      if (!lRes.ok) throw new Error(lData.error ?? `liberar-pago error ${lRes.status}`);
      result = lData;

    // ── Escrow: resolver una disputa ─────────────────────────────────────────
    } else if (action === "resolver_disputa") {
      const { disputa_id, resolucion, estado } = params;
      // estado: "resuelta_alumno" | "resuelta_docente"
      if (!disputa_id || !estado) throw new Error("disputa_id y estado requeridos");

      // Obtener pago_id y emails de las partes
      const { data: disputa } = await adminClient
        .from("disputas")
        .select("pago_id, alumno_email, docente_email")
        .eq("id", disputa_id)
        .single();

      // Actualizar disputa
      await adminClient.from("disputas").update({
        estado,
        resolucion: resolucion ?? null,
        admin_email: user.email,
        resuelto_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      }).eq("id", disputa_id);

      if (disputa?.pago_id) {
        if (estado === "resuelta_docente") {
          // Liberar pago al docente (liberar-pago ya notifica al docente internamente)
          await adminClient.from("pagos").update({ estado_escrow: "retenido" }).eq("id", disputa.pago_id);
          const liberarSecret = Deno.env.get("LIBERAR_PAGO_SECRET") ?? "";
          await fetch(`${SUPABASE_URL}/functions/v1/liberar-pago`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${liberarSecret}` },
            body: JSON.stringify({ pago_id: disputa.pago_id }),
          });
          // Notificar al alumno que la disputa se resolvió a favor del docente
          if (disputa.alumno_email) {
            await adminClient.from("notificaciones").insert({
              alumno_email: disputa.alumno_email,
              tipo:         "sistema",
              pub_titulo:   `La disputa fue resuelta: el pago fue liberado al docente.${resolucion ? ` Nota: ${resolucion}` : ""}`,
              leida:        false,
            }).then(null, () => null);
          }
        } else if (estado === "resuelta_alumno") {
          // Marcar como reembolsado (el admin gestiona el reembolso en MP manualmente)
          await adminClient.from("pagos").update({ estado_escrow: "reembolsado" }).eq("id", disputa.pago_id);
          // Notificar a ambas partes
          const notifAlumno = disputa.alumno_email ? {
            alumno_email: disputa.alumno_email,
            tipo:         "sistema",
            pub_titulo:   `La disputa fue resuelta a tu favor. El reembolso será procesado en los próximos días.${resolucion ? ` Nota: ${resolucion}` : ""}`,
            leida:        false,
          } : null;
          const notifDocente = disputa.docente_email ? {
            alumno_email: disputa.docente_email,
            tipo:         "sistema",
            pub_titulo:   `La disputa fue resuelta a favor del alumno. El pago será reembolsado.${resolucion ? ` Nota: ${resolucion}` : ""}`,
            leida:        false,
          } : null;
          const notifs = [notifAlumno, notifDocente].filter(Boolean);
          if (notifs.length) await adminClient.from("notificaciones").insert(notifs).then(null, () => null);
        }
      }
      result = { ok: true, estado, pago_id: disputa?.pago_id ?? null };

    // ── Liquidaciones: generar manualmente ──────────────────────────────────
    } else if (action === "generar_liquidacion_manual") {
      const { periodo, docente_email: docenteEmail } = params;
      const liqSecret = Deno.env.get("GENERAR_LIQ_SECRET") ?? "";
      const lRes = await fetch(`${SUPABASE_URL}/functions/v1/generar-liquidacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${liqSecret}` },
        body: JSON.stringify({ periodo: periodo ?? null, docente_email: docenteEmail ?? null }),
      });
      const lData = await lRes.json();
      if (!lRes.ok) throw new Error(lData.error ?? `generar-liquidacion error ${lRes.status}`);
      result = lData;

    // ── Configuración: upsert clave→valor ────────────────────────────────────
    } else if (action === "upsert_config") {
      const { rows } = params;
      if (!rows?.length) throw new Error("rows requerido");
      for (const row of rows) {
        await adminClient.from("config").upsert(row, { onConflict: "clave" });
      }
      result = { ok: true };

    // ── Acciones de usuario (con verificación de ownership) ─────────────────
    } else if (action === "borrar_chat") {
      const { pub_id, email_b } = params;
      if (!pub_id || !email_b) throw new Error("pub_id y email_b requeridos");

      // email_a siempre viene del JWT (no del body) — el usuario solo puede borrar sus propios chats
      const myEmail = user.email!;

      // Verificar que email_b tiene un formato válido (evita inyección PostgREST)
      if (!/^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email_b)) {
        throw new Error("email_b inválido");
      }

      // Verificar que el usuario es participante real del chat leyendo desde la DB
      const { data: participacion } = await adminClient
        .from("mensajes")
        .select("id")
        .eq("publicacion_id", pub_id)
        .or(`de_nombre.eq.${myEmail},para_nombre.eq.${myEmail}`)
        .limit(1)
        .maybeSingle();

      if (!participacion) {
        return new Response(JSON.stringify({ error: "No autorizado: no eres participante de este chat" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Borrar usando .eq() (parametrizado) en lugar de .or() con interpolación:
      // Mensajes enviados por el usuario al otro
      await adminClient.from("mensajes").delete()
        .eq("publicacion_id", pub_id)
        .eq("de_nombre",     myEmail)
        .eq("para_nombre",   email_b);

      // Mensajes recibidos por el usuario del otro
      await adminClient.from("mensajes").delete()
        .eq("publicacion_id", pub_id)
        .eq("de_nombre",     email_b)
        .eq("para_nombre",   myEmail);
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
