/**
 * Edge Function: generar-liquidacion
 * Genera PDFs de liquidación mensual para cada docente con pagos liberados.
 *
 * Invocada:
 *   - Por pg_cron el día 1 de cada mes a las 04:00 UTC (proceso todos los docentes)
 *   - Manualmente por el admin con { periodo, docente_email } para regenerar una sola
 *
 * Body: { periodo?: "2026-04", docente_email?: string }
 *   - periodo: si se omite, usa el mes anterior
 *   - docente_email: si se omite, procesa todos los docentes del período
 *
 * Flujo por docente:
 *   1. Consulta pagos liberados del período
 *   2. Genera PDF con pdf-lib
 *   3. Sube el PDF a Storage bucket "liquidaciones"
 *   4. Upserta registro en tabla "liquidaciones"
 *   5. Envía email al docente con el link de descarga
 *
 * Env vars requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   GENERAR_LIQ_SECRET   → protege el endpoint de llamadas no autorizadas
 *   APP_URL              → para links en el email
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMISION = 0.10;

// ── Helpers de fecha ────────────────────────────────────────────────────────────
function periodoAnterior(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodoToRange(periodo: string): { start: string; end: string } {
  const [year, month] = periodo.split("-").map(Number);
  const start = new Date(year, month - 1, 1).toISOString();
  const end   = new Date(year, month, 1).toISOString();       // exclusive
  return { start, end };
}

function periodoToLabel(periodo: string): string {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const [year, month] = periodo.split("-").map(Number);
  return `${meses[month - 1]} ${year}`;
}

function fmtARS(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

// ── Generador de PDF ─────────────────────────────────────────────────────────────
async function generarPDF(params: {
  docente_nombre:   string;
  docente_email:    string;
  cuit:             string | null;
  situacion_fiscal: string | null;
  periodo:          string;
  pagos:            Array<{ pub_titulo: string; alumno_email: string; liberado_at: string; monto: number }>;
}): Promise<Uint8Array> {
  const { docente_nombre, docente_email, cuit, situacion_fiscal, periodo, pagos } = params;

  const doc  = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await doc.embedFont(StandardFonts.Helvetica);

  const BLU = rgb(0.102, 0.431, 0.847); // #1A6ED8
  const TEA = rgb(0.18, 0.769, 0.627);  // #2EC4A0
  const DRK = rgb(0.059, 0.247, 0.478); // #0F3F7A
  const GRY = rgb(0.353, 0.447, 0.58);  // #5A7294
  const BLK = rgb(0.051, 0.122, 0.235); // #0D1F3C
  const WHT = rgb(1, 1, 1);
  const LGR = rgb(0.965, 0.976, 1);     // #F6F9FF
  const BRD = rgb(0.867, 0.898, 0.961); // #DDE5F5

  const ML = 50;  // margin left
  const MR = 50;  // margin right
  const CW = width - ML - MR; // content width
  let y = height;

  // ── Header gradient background ─────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: DRK });

  // Brand name
  page.drawText("Luderis", {
    x: ML, y: height - 45,
    font: fontBold, size: 30, color: WHT,
  });

  // Subtitle
  page.drawText("Liquidación Mensual de Servicios", {
    x: ML, y: height - 68,
    font: fontReg, size: 13, color: rgb(0.75, 0.85, 1),
  });

  // Período en el header
  const periodoLabel = periodoToLabel(periodo);
  const periodoText  = `Período: ${periodoLabel}`;
  const ptW = fontBold.widthOfTextAtSize(periodoText, 12);
  page.drawText(periodoText, {
    x: width - MR - ptW, y: height - 55,
    font: fontBold, size: 12, color: WHT,
  });

  const fechaGen = `Generado: ${fmtFecha(new Date().toISOString())}`;
  const fgW = fontReg.widthOfTextAtSize(fechaGen, 10);
  page.drawText(fechaGen, {
    x: width - MR - fgW, y: height - 72,
    font: fontReg, size: 10, color: rgb(0.7, 0.8, 0.95),
  });

  y = height - 130;

  // ── Sección Docente ─────────────────────────────────────────────────────────
  page.drawText("DATOS DEL DOCENTE", {
    x: ML, y,
    font: fontBold, size: 9, color: GRY,
  });
  y -= 14;

  // Caja info
  const infoBoxH = 70;
  page.drawRectangle({ x: ML, y: y - infoBoxH, width: CW, height: infoBoxH, color: LGR, borderColor: BRD, borderWidth: 1 });

  const col2x = ML + CW / 2;

  // Columna izquierda
  page.drawText("Nombre / Razón Social", { x: ML + 14, y: y - 16, font: fontBold, size: 8, color: GRY });
  page.drawText(docente_nombre || docente_email, { x: ML + 14, y: y - 30, font: fontBold, size: 11, color: BLK });

  page.drawText("Email", { x: ML + 14, y: y - 46, font: fontBold, size: 8, color: GRY });
  page.drawText(docente_email, { x: ML + 14, y: y - 58, font: fontReg, size: 10, color: BLK });

  // Columna derecha
  page.drawText("CUIT", { x: col2x, y: y - 16, font: fontBold, size: 8, color: GRY });
  page.drawText(cuit ? `${cuit.slice(0,2)}-${cuit.slice(2,10)}-${cuit.slice(10)}` : "No registrado", {
    x: col2x, y: y - 30, font: fontBold, size: 11, color: BLK,
  });

  page.drawText("Situación Fiscal", { x: col2x, y: y - 46, font: fontBold, size: 8, color: GRY });
  page.drawText(
    situacion_fiscal === "monotributista" ? "Monotributista" :
    situacion_fiscal === "responsable_inscripto" ? "Responsable Inscripto" :
    situacion_fiscal || "No especificada",
    { x: col2x, y: y - 58, font: fontReg, size: 10, color: BLK }
  );

  y -= infoBoxH + 22;

  // ── Tabla de pagos ──────────────────────────────────────────────────────────
  page.drawText("DETALLE DE PAGOS LIBERADOS", {
    x: ML, y,
    font: fontBold, size: 9, color: GRY,
  });
  y -= 14;

  // Cabecera de tabla
  const colFecha = ML;
  const colClase = ML + 90;
  const colAlum  = ML + 280;
  const colMonto = width - MR - 70;

  page.drawRectangle({ x: ML, y: y - 22, width: CW, height: 22, color: DRK });
  page.drawText("Fecha",    { x: colFecha + 6, y: y - 15, font: fontBold, size: 9, color: WHT });
  page.drawText("Clase",    { x: colClase,     y: y - 15, font: fontBold, size: 9, color: WHT });
  page.drawText("Alumno",   { x: colAlum,      y: y - 15, font: fontBold, size: 9, color: WHT });
  page.drawText("Monto",    { x: colMonto,     y: y - 15, font: fontBold, size: 9, color: WHT });
  y -= 22;

  // Filas
  const ROW_H = 20;
  const MAX_ROWS = 22; // A4 tiene espacio para ~22 filas antes del footer
  const pagosToShow = pagos.slice(0, MAX_ROWS);

  for (let i = 0; i < pagosToShow.length; i++) {
    const p = pagosToShow[i];
    const rowColor = i % 2 === 0 ? rgb(1, 1, 1) : LGR;

    page.drawRectangle({ x: ML, y: y - ROW_H, width: CW, height: ROW_H, color: rowColor });

    // Truncar textos largos
    const titulo = (p.pub_titulo || "Clase particular").slice(0, 30) + (p.pub_titulo?.length > 30 ? "…" : "");
    const alumno = p.alumno_email.split("@")[0].slice(0, 22);
    const montoStr = fmtARS(Number(p.monto));
    const montoW = fontReg.widthOfTextAtSize(montoStr, 9);

    page.drawText(fmtFecha(p.liberado_at), { x: colFecha + 6, y: y - 14, font: fontReg, size: 9, color: BLK });
    page.drawText(titulo,                  { x: colClase,      y: y - 14, font: fontReg, size: 9, color: BLK });
    page.drawText(alumno,                  { x: colAlum,       y: y - 14, font: fontReg, size: 9, color: BLK });
    page.drawText(montoStr,                { x: colMonto + 60 - montoW, y: y - 14, font: fontReg, size: 9, color: BLK });

    // Línea separadora
    page.drawLine({ start: { x: ML, y: y - ROW_H }, end: { x: ML + CW, y: y - ROW_H }, thickness: 0.3, color: BRD });
    y -= ROW_H;
  }

  if (pagos.length > MAX_ROWS) {
    page.drawText(`(Se muestran ${MAX_ROWS} de ${pagos.length} pagos. El total incluye todos.)`, {
      x: ML, y: y - 10, font: fontReg, size: 8, color: GRY,
    });
    y -= 16;
  }

  y -= 8;

  // ── Totales ─────────────────────────────────────────────────────────────────
  const montosBrutos = pagos.map(p => Number(p.monto));
  const totalBruto   = montosBrutos.reduce((a, b) => a + b, 0);
  const comision     = Math.round(totalBruto * COMISION);
  const totalNeto    = totalBruto - comision;

  const totW = 250;
  const totX = width - MR - totW;

  // Línea superior de totales
  page.drawLine({ start: { x: totX, y }, end: { x: width - MR, y }, thickness: 1, color: BRD });
  y -= 4;

  const drawTotal = (label: string, value: string, bold = false, color = BLK) => {
    const valW = (bold ? fontBold : fontReg).widthOfTextAtSize(value, 10);
    page.drawText(label, { x: totX, y, font: bold ? fontBold : fontReg, size: 10, color });
    page.drawText(value, { x: width - MR - valW, y, font: bold ? fontBold : fontReg, size: 10, color });
    y -= 18;
  };

  drawTotal("Cantidad de clases:", `${pagos.length}`);
  drawTotal("Monto bruto total:", fmtARS(totalBruto));
  drawTotal(`Comisión Luderis (${COMISION * 100}%):`, `- ${fmtARS(comision)}`, false, GRY);

  // Línea antes del neto
  page.drawLine({ start: { x: totX, y: y + 4 }, end: { x: width - MR, y: y + 4 }, thickness: 0.5, color: BRD });
  y -= 4;

  // Caja destacada para el neto
  page.drawRectangle({ x: totX - 8, y: y - 6, width: totW + 8, height: 26, color: TEA, borderColor: TEA, borderWidth: 0 });
  const netoLabel = "MONTO NETO A COBRAR";
  const netoValue = fmtARS(totalNeto);
  const netoValW  = fontBold.widthOfTextAtSize(netoValue, 12);
  page.drawText(netoLabel, { x: totX, y: y + 4, font: fontBold, size: 10, color: WHT });
  page.drawText(netoValue, { x: width - MR - netoValW, y: y + 4, font: fontBold, size: 12, color: WHT });

  // ── Footer legal ────────────────────────────────────────────────────────────
  const footerY = 80;
  page.drawLine({ start: { x: ML, y: footerY + 35 }, end: { x: width - MR, y: footerY + 35 }, thickness: 0.5, color: BRD });

  page.drawText("INFORMACIÓN PARA FACTURACIÓN", {
    x: ML, y: footerY + 22, font: fontBold, size: 8, color: GRY,
  });
  page.drawText(
    "Este documento sirve como base para la emisión de comprobante fiscal (factura/recibo) a nombre de Luderis.",
    { x: ML, y: footerY + 10, font: fontReg, size: 8, color: GRY }
  );
  page.drawText(
    "Podés emitir la factura/recibo desde tu aplicación de facturación electrónica (AFIP, Facturama, etc.) por el monto neto.",
    { x: ML, y: footerY - 1, font: fontReg, size: 8, color: GRY }
  );

  page.drawLine({ start: { x: ML, y: footerY - 15 }, end: { x: width - MR, y: footerY - 15 }, thickness: 0.3, color: BRD });
  page.drawText(
    `© ${new Date().getFullYear()} Luderis · Buenos Aires, Argentina · contacto@luderis.com`,
    { x: ML, y: footerY - 28, font: fontReg, size: 8, color: GRY }
  );
  const pageNumStr = "Página 1";
  const pnW = fontReg.widthOfTextAtSize(pageNumStr, 8);
  page.drawText(pageNumStr, { x: width - MR - pnW, y: footerY - 28, font: fontReg, size: 8, color: GRY });

  return doc.save();
}

// ── Handler principal ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const INTERNAL_SECRET = Deno.env.get("GENERAR_LIQ_SECRET") ?? "";
  const APP_URL         = Deno.env.get("APP_URL") ?? "https://classelink.vercel.app";

  // Validar secret
  const authHeader = req.headers.get("Authorization") ?? "";
  if (INTERNAL_SECRET && authHeader !== `Bearer ${INTERNAL_SECRET}`) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: CORS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const { periodo: periodoParam, docente_email: docenteParam } = body;

    // Determinar período (default: mes anterior)
    const periodo = periodoParam ?? periodoAnterior();
    const { start, end } = periodoToRange(periodo);

    console.log(`generar-liquidacion: periodo=${periodo} start=${start} end=${end} docente=${docenteParam ?? "todos"}`);

    // ── Consultar pagos liberados del período ──────────────────────────────
    let query = supabase
      .from("pagos")
      .select("id, monto, docente_email, alumno_email, publicacion_id, liberado_at")
      .eq("estado_escrow", "liberado")
      .gte("liberado_at", start)
      .lt("liberado_at", end);

    if (docenteParam) {
      query = query.eq("docente_email", docenteParam);
    }

    const { data: pagosRaw, error: pagosErr } = await query;
    if (pagosErr) throw pagosErr;
    if (!pagosRaw || pagosRaw.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, mensaje: "No hay pagos liberados para este período", periodo }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Obtener títulos de publicaciones ──────────────────────────────────
    const pubIds = [...new Set(pagosRaw.map(p => p.publicacion_id).filter(Boolean))];
    const { data: pubs } = await supabase
      .from("publicaciones")
      .select("id, titulo")
      .in("id", pubIds);
    const pubMap: Record<string, string> = {};
    for (const p of pubs ?? []) pubMap[p.id] = p.titulo;

    // Enriquecer pagos con título
    const pagosEnriquecidos = pagosRaw.map(p => ({
      ...p,
      pub_titulo: pubMap[p.publicacion_id] ?? "Clase particular",
    }));

    // ── Agrupar por docente ───────────────────────────────────────────────
    const porDocente: Record<string, typeof pagosEnriquecidos> = {};
    for (const p of pagosEnriquecidos) {
      if (!porDocente[p.docente_email]) porDocente[p.docente_email] = [];
      porDocente[p.docente_email].push(p);
    }

    const docentes = Object.keys(porDocente);
    console.log(`generar-liquidacion: procesando ${docentes.length} docentes`);

    // ── Datos de docentes (nombre, CUIT, situación) ───────────────────────
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("email, nombre")
      .in("email", docentes);
    const usuarioMap: Record<string, string> = {};
    for (const u of usuarios ?? []) usuarioMap[u.email] = u.nombre;

    const { data: verifs } = await supabase
      .from("verificaciones_usuario")
      .select("usuario_email, cuit, situacion_fiscal")
      .in("usuario_email", docentes);
    const verifMap: Record<string, { cuit: string | null; situacion_fiscal: string | null }> = {};
    for (const v of verifs ?? []) verifMap[v.usuario_email] = { cuit: v.cuit, situacion_fiscal: v.situacion_fiscal };

    // ── Procesar cada docente ─────────────────────────────────────────────
    const resultados: Array<{ docente_email: string; ok: boolean; error?: string; pdf_url?: string }> = [];

    for (const docenteEmail of docentes) {
      const pagosDocente = porDocente[docenteEmail];
      const docNombre    = usuarioMap[docenteEmail] ?? docenteEmail.split("@")[0];
      const verifData    = verifMap[docenteEmail] ?? { cuit: null, situacion_fiscal: null };

      try {
        // ── Generar PDF ─────────────────────────────────────────────────
        const pdfBytes = await generarPDF({
          docente_nombre:   docNombre,
          docente_email:    docenteEmail,
          cuit:             verifData.cuit,
          situacion_fiscal: verifData.situacion_fiscal,
          periodo,
          pagos:            pagosDocente,
        });

        // ── Subir a Storage ─────────────────────────────────────────────
        const storagePath = `${docenteEmail}/${periodo}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("liquidaciones")
          .upload(storagePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);

        // Obtener URL pública temporal (signed URL de 7 días para el email)
        const { data: signedData } = await supabase.storage
          .from("liquidaciones")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 días

        const pdfUrl = signedData?.signedUrl ?? null;

        // URL permanente para guardar en BD (el docente accede vía signed URL generada en el momento)
        const pdfStorageUrl = `${SUPABASE_URL}/storage/v1/object/liquidaciones/${storagePath}`;

        // ── Calcular totales ────────────────────────────────────────────
        const montoBruto  = pagosDocente.reduce((s, p) => s + Number(p.monto), 0);
        const comision    = Math.round(montoBruto * COMISION * 100) / 100;
        const montoNeto   = montoBruto - comision;

        // ── Upsert en liquidaciones ─────────────────────────────────────
        const { error: upsertErr } = await supabase.from("liquidaciones").upsert({
          docente_email:    docenteEmail,
          periodo,
          monto_bruto:      montoBruto,
          monto_neto:       montoNeto,
          comision_luderis: comision,
          cantidad_clases:  pagosDocente.length,
          pdf_url:          pdfStorageUrl,
        }, { onConflict: "docente_email,periodo" });

        if (upsertErr) throw new Error(`Upsert liquidacion: ${upsertErr.message}`);

        // ── Notificación interna ────────────────────────────────────────
        await supabase.from("notificaciones").insert({
          alumno_email:   docenteEmail, // campo genérico de destinatario
          tipo:           "liquidacion_disponible",
          publicacion_id: null,
          leida:          false,
        }).catch(() => {});

        // ── Enviar email con PDF ────────────────────────────────────────
        if (pdfUrl) {
          await supabase.functions.invoke("send-email", {
            body: {
              template: "liquidacion_disponible",
              to: docenteEmail,
              data: {
                nombre:         docNombre,
                periodo_label:  periodoToLabel(periodo),
                periodo:        periodo,
                monto_bruto:    montoBruto,
                monto_neto:     montoNeto,
                comision:       comision,
                cantidad_clases: pagosDocente.length,
                pdf_url:        pdfUrl,
                app_url:        APP_URL,
              },
            },
          });
        }

        resultados.push({ docente_email: docenteEmail, ok: true, pdf_url: pdfStorageUrl });
        console.log(`generar-liquidacion: OK docente=${docenteEmail} bruto=${montoBruto} neto=${montoNeto}`);

      } catch (docErr) {
        console.error(`generar-liquidacion: ERROR docente=${docenteEmail}`, docErr);
        resultados.push({ docente_email: docenteEmail, ok: false, error: (docErr as Error).message });
      }
    }

    const exitosos = resultados.filter(r => r.ok).length;
    const fallidos  = resultados.filter(r => !r.ok).length;

    return new Response(
      JSON.stringify({ ok: true, periodo, exitosos, fallidos, resultados }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("generar-liquidacion error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
