/**
 * Edge Function: sitemap
 * Genera sitemap.xml dinámico con páginas estáticas + publicaciones activas de la DB.
 * Deploy: supabase functions deploy sitemap --no-verify-jwt
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") ?? "https://luderis.com";

const STATIC_PAGES = [
  { url: "/",          priority: "1.0", changefreq: "daily"   },
  { url: "/terminos",  priority: "0.3", changefreq: "monthly" },
  { url: "/privacidad",priority: "0.3", changefreq: "monthly" },
  { url: "/ayuda",     priority: "0.5", changefreq: "monthly" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: pubs } = await supabase
      .from("publicaciones")
      .select("id, titulo, materia, tipo, updated_at")
      .eq("activo", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const today = new Date().toISOString().split("T")[0];

    const staticEntries = STATIC_PAGES.map(p => `
  <url>
    <loc>${APP_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("");

    const pubEntries = (pubs ?? []).map(p => {
      const lastmod = p.updated_at
        ? new Date(p.updated_at).toISOString().split("T")[0]
        : today;
      return `
  <url>
    <loc>${APP_URL}/?pub=${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${pubEntries}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("sitemap error:", err);
    return new Response("Error generando sitemap", { status: 500 });
  }
});
