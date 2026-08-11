import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import * as sb from "../supabase";
import { C, FONT, tx, toast, Spinner } from "../shared";

// ─── PENDIENTES ───────────────────────────────────────────────────────────────
// La pantalla de entrada a Mi cuenta: solo lo que requiere una acción hoy.
//
// Antes cada cosa vivía en su propia pestaña y había que salir a buscarlas.
// Declarar horas ni siquiera estaba en Mi cuenta: vivía en la Agenda, que es un
// calendario — nada ahí sugería que ese era el lugar donde se cobra.
//
// Las horas por aprobar aparecen para todos. Antes estaban en la pestaña "Mis
// clases", que solo se mostraba a los docentes: el alumno, que es justamente
// quien tiene que aprobarlas, no tenía dónde hacerlo.

export default function PendientesTab({ session, misPubs, onIr }) {
  const miEmail = session.user.email;
  const [porDeclarar, setPorDeclarar] = useState([]); // {pub, horasDisp, medido}
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horas, setHoras] = useState({});   // pubId → horas a declarar
  const [fecha, setFecha] = useState({});   // pubId → fecha
  const [guardando, setGuardando] = useState(null);

  const hoyISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      // Solo las particulares declaran horas: los cursos se liberan solos.
      const particulares = (misPubs || []).filter(
        p => p.tipo === "oferta" && p.modo === "particular" && !p.finalizado);
      const [cls, ...disp] = await Promise.all([
        sb.getClasesRealizadas(miEmail, session.access_token).catch(() => []),
        ...particulares.map(p => sb.horasPorRegistrar(p.id, session.access_token).catch(() => 0)),
      ]);
      setClases(cls || []);

      const conHoras = particulares
        .map((p, i) => ({ pub: p, horasDisp: Number(disp[i] || 0) }))
        .filter(x => x.horasDisp > 0);

      // Cuánto midió la app hoy, para pre-cargar el número en vez de que lo
      // tipeen de memoria.
      const medidos = await Promise.all(conHoras.map(
        x => sb.minutosMedidos(x.pub.id, hoyISO, session.access_token).catch(() => null)));
      const filas = conHoras.map((x, i) => ({
        ...x,
        medido: medidos[i]?.error ? null : Number(medidos[i]?.minutos || 0),
      }));

      setPorDeclarar(filas);
      setHoras(Object.fromEntries(filas.map(f => [f.pub.id,
        f.medido > 0 ? String(Math.min(f.medido / 60, f.horasDisp)) : "1"])));
      setFecha(Object.fromEntries(filas.map(f => [f.pub.id, hoyISO])));
    } finally { setLoading(false); }
  }, [miEmail, session.access_token, misPubs, hoyISO]);

  useEffect(() => { cargar(); }, [cargar]);

  const declarar = async (fila) => {
    const id = fila.pub.id;
    const h = Number(horas[id]);
    if (!h || h <= 0) { toast("Poné cuántas horas diste", "error"); return; }
    if (h > fila.horasDisp) { toast("Solo quedan " + fila.horasDisp + " h sin registrar", "error"); return; }
    setGuardando(id);
    try {
      const r = await sb.registrarClaseDictada(id, fecha[id] || hoyISO, session.access_token, h);
      if (r?.error) { toast(r.error, "error", 5000); return; }
      toast("Registraste " + h + " h. El alumno tiene que aprobarlas para que cobres.", "success", 4500);
      cargar();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setGuardando(null); }
  };

  // Clases donde soy alumno y todavía no aprobé: arranca un reloj sobre mi plata.
  const porConfirmar = clases.filter(c => c.alumno_email === miEmail && !c.confirmado_alumno && !c.objetada_at);
  const enDisputa = clases.filter(c => c.objetada_at);

  const Card = ({ children, tono }) => (
    <div style={{ background: C.card, border: "1px solid " + (tono || C.border), borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
      {children}
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>;

  const nadaQueHacer = !porDeclarar.length && !porConfirmar.length && !enDisputa.length;

  return (
    <div>
      {nadaQueHacer && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", color: C.successText }}><CheckCircle2 size={20} strokeWidth={2} /></span>
            <div>
              <div style={{ ...tx("cardTitle"), color: C.text }}>No tenés nada pendiente</div>
              <div style={{ ...tx("micro"), color: C.muted, marginTop: 2 }}>
                Cuando haya algo para hacer —declarar horas, aprobar una clase, responder un reclamo— te va a aparecer acá.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Horas que diste y no cobraste (docente) ── */}
      {porDeclarar.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...tx("h3"), color: C.text, marginBottom: 4 }}>Horas que diste y no cobraste</div>
          <div style={{ ...tx("micro"), color: C.muted, marginBottom: 10 }}>
            Declaralas para que el alumno las apruebe y se libere tu pago.
          </div>
          {porDeclarar.map(f => (
            <Card key={f.pub.id} tono={C.warn + "44"}>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...tx("cardTitle"), color: C.text, overflow: "hidden", textOverflow: "ellipsis" }}>{f.pub.titulo}</div>
                <div style={{ ...tx("micro"), color: C.muted, marginTop: 3 }}>
                  Quedan <strong>{f.horasDisp} h</strong> compradas sin registrar
                  {f.medido > 0 && <> · la app midió <strong>{(f.medido / 60).toLocaleString("es-AR", { maximumFractionDigits: 2 })} h</strong> hoy</>}
                  {f.medido === 0 && <> · sin registro de presencia hoy</>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input type="date" aria-label="Fecha de la clase" max={hoyISO}
                  value={fecha[f.pub.id] || hoyISO}
                  onChange={e => setFecha(p => ({ ...p, [f.pub.id]: e.target.value }))}
                  style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none" }} />
                <input type="number" min="0.25" step="0.25" max={f.horasDisp} inputMode="decimal" aria-label="Horas dictadas"
                  value={horas[f.pub.id] ?? ""}
                  onChange={e => setHoras(p => ({ ...p, [f.pub.id]: e.target.value }))}
                  style={{ width: 80, background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", textAlign: "center" }} />
                <span style={{ ...tx("micro"), color: C.muted }}>horas</span>
                <button onClick={() => declarar(f)} disabled={guardando === f.pub.id}
                  style={{ background: guardando === f.pub.id ? C.border : C.accent, border: "none", borderRadius: 20, color: guardando === f.pub.id ? C.muted : "#fff", padding: "8px 18px", cursor: guardando === f.pub.id ? "default" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
                  {guardando === f.pub.id ? "Registrando…" : "Declarar y cobrar"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Horas por aprobar (alumno) ── */}
      {porConfirmar.length > 0 && (
        <Card tono={C.warn + "44"}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...tx("cardTitle"), color: C.text }}>
                {porConfirmar.length === 1 ? "Tenés 1 clase por aprobar" : "Tenés " + porConfirmar.length + " clases por aprobar"}
              </div>
              <div style={{ ...tx("micro"), color: C.muted, marginTop: 2 }}>
                Si no respondés se aprueban solas y se le paga al docente. Podés aprobarlas u objetar las horas.
              </div>
            </div>
            <button onClick={() => onIr("clases")}
              style={{ background: C.accent, border: "none", borderRadius: 20, color: "#fff", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>
              Revisar
            </button>
          </div>
        </Card>
      )}

      {/* ── Reclamos abiertos ── */}
      {enDisputa.length > 0 && (
        <Card tono={C.danger + "44"}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...tx("cardTitle"), color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} strokeWidth={2} />
                {enDisputa.length === 1 ? "Hay 1 reclamo de horas abierto" : "Hay " + enDisputa.length + " reclamos de horas abiertos"}
              </div>
              <div style={{ ...tx("micro"), color: C.muted, marginTop: 2 }}>
                El pago queda frenado hasta resolverlo. Luderis responde en un máximo de 5 días hábiles.
              </div>
            </div>
            <button onClick={() => onIr("clases")}
              style={{ background: C.danger, border: "none", borderRadius: 20, color: "#fff", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>
              Ver
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
