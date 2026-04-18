import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FALLBACK_ADMIN_EMAIL = "salvadordevedia@gmail.com";

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 1. Obtener y verificar el JWT del usuario ─────────────────────────────
    const userToken = req.headers.get("x-user-token") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!userToken) {
      return new Response(JSON.stringify({ error: "No autorizado: token requerido" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
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
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Acción requerida" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
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

      const esAdmin = usuarioData?.rol === "admin" || user.email === FALLBACK_ADMIN_EMAIL;
      if (!esAdmin) {
        return new Response(JSON.stringify({ error: "No autorizado: se requiere rol admin" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    } else if (!USER_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── 3. Ejecutar la acción ─────────────────────────────────────────────────

    let result: unknown = { ok: true };

    // ── Acciones de admin ────────────────────────────────────────────────────
    if (action === "toggle_bloqueo") {
      const { user_id, bloqueado } = params;
      if (!user_id) throw new Error("user_id requerido");
      await adminClient.from("usuarios").update({ bloqueado }).eq("id", user_id);

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
      const { titulo, mensaje, tipo } = params;
      if (!titulo || !mensaje) throw new Error("titulo y mensaje requeridos");
      // Insertar notificación global (todos los usuarios)
      const { data: usuarios } = await adminClient.from("usuarios").select("id");
      if (usuarios && usuarios.length > 0) {
        const notifs = usuarios.map((u: { id: string }) => ({
          usuario_id: u.id,
          tipo: tipo || "anuncio",
          titulo,
          mensaje,
        }));
        // Insertar en lotes de 500
        for (let i = 0; i < notifs.length; i += 500) {
          await adminClient.from("notificaciones").insert(notifs.slice(i, i + 500));
        }
      }
      result = { ok: true, total: usuarios?.length ?? 0 };

    } else if (action === "aprobar_docente") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id requerido");
      await adminClient.from("usuarios").update({ rol: "docente", verificado: true }).eq("id", user_id);

    } else if (action === "rechazar_docente") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id requerido");
      await adminClient.from("usuarios").update({ rol: "alumno", verificado: false }).eq("id", user_id);

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

      // Obtener pago_id de la disputa
      const { data: disputa } = await adminClient.from("disputas").select("pago_id").eq("id", disputa_id).single();

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
          // Liberar pago al docente
          await adminClient.from("pagos").update({ estado_escrow: "retenido" }).eq("id", disputa.pago_id);
          const liberarSecret = Deno.env.get("LIBERAR_PAGO_SECRET") ?? "";
          await fetch(`${SUPABASE_URL}/functions/v1/liberar-pago`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${liberarSecret}` },
            body: JSON.stringify({ pago_id: disputa.pago_id }),
          });
        } else if (estado === "resuelta_alumno") {
          // Marcar como reembolsado (el admin gestiona el reembolso en MP manualmente)
          await adminClient.from("pagos").update({ estado_escrow: "reembolsado" }).eq("id", disputa.pago_id);
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
      const { pub_id, email_a, email_b } = params;
      if (!pub_id || !email_a || !email_b) throw new Error("pub_id, email_a y email_b requeridos");

      // CRÍTICO: verificar que el usuario que llama es uno de los participantes
      if (user.email !== email_a && user.email !== email_b) {
        return new Response(JSON.stringify({ error: "No autorizado: no eres participante de este chat" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Borrar mensajes del chat
      await adminClient
        .from("mensajes")
        .delete()
        .eq("pub_id", pub_id)
        .or(`and(emisor_email.eq.${email_a},receptor_email.eq.${email_b}),and(emisor_email.eq.${email_b},receptor_email.eq.${email_a})`);
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
