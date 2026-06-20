/**
 * Edge Function: subir-foto
 * Sube avatar/portada al bucket público "avatars" usando el service_role,
 * evitando el path de RLS del storage-api (que no valida los JWT de usuario
 * en este proyecto → rechazaba toda subida con 400 RLS).
 *
 * Seguridad: NO confía en RLS. Valida la sesión del usuario contra gotrue
 * (/auth/v1/user, que sí valida tokens) y SOLO permite escribir en la carpeta
 * propia del usuario ({user.id}/...). El service_role nunca llega al cliente.
 *
 * Request: POST con el archivo como body crudo.
 *   Headers: Authorization: Bearer <user_token>, Content-Type: image/webp|png|jpeg,
 *            x-foto-tipo: "avatar" | "banner"
 * Response: { url } | { error }
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-foto-tipo",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 5 * 1024 * 1024;

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "No autorizado" }, 401);

    // 1. Validar la sesión del usuario contra gotrue (valida el JWT de verdad).
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${token}`, "apikey": ANON_KEY },
    });
    if (!uRes.ok) return json({ error: "Sesión inválida" }, 401);
    const user = await uRes.json();
    const uid: string | undefined = user?.id;
    if (!uid) return json({ error: "Sesión inválida" }, 401);

    // 2. Validar tipo y derivar extensión del content-type.
    const tipo = (req.headers.get("x-foto-tipo") || "avatar").toLowerCase();
    if (tipo !== "avatar" && tipo !== "banner") return json({ error: "Tipo inválido" }, 400);
    const contentType = req.headers.get("content-type") || "image/webp";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";

    // 3. Leer y validar el archivo.
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.byteLength === 0) return json({ error: "Archivo vacío" }, 400);
    if (bytes.byteLength > MAX_BYTES) return json({ error: "La imagen no debe superar 5 MB" }, 413);

    // 4. Subir con service_role a la carpeta PROPIA del usuario (bypassa RLS).
    const path = `${uid}/${tipo}_${Date.now()}.${ext}`;
    const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "apikey": SERVICE_KEY,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: bytes,
    });
    if (!upRes.ok) {
      const detail = await upRes.text().catch(() => "");
      console.error("subir-foto storage error:", upRes.status, detail);
      return json({ error: `No se pudo guardar la imagen (${upRes.status})` }, 502);
    }

    return json({ url: `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}` }, 200);
  } catch (err) {
    console.error("subir-foto error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
