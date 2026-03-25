/**
 * useUnread.js
 *
 * Encapsula la lógica de polling de mensajes no leídos,
 * ofertas pendientes y notificaciones.
 *
 * Actualmente este código está inline en App.js en el componente raíz.
 * Al extraerlo, el componente App queda mucho más limpio.
 *
 * USO:
 *   const { unread, ofertasCount, notifCount, refresh } = useUnread();
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "../supabase.js";
import { useSession } from "../contexts/SessionContext.jsx";

const POLL_INTERVAL = 8_000; // ms

export function useUnread({ openChatRef } = {}) {
  const { session, token, user } = useSession();
  const [unread, setUnread] = useState(0);
  const [ofertasCount, setOfertasCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [ofertasAceptadasNuevas, setOfertasAceptadasNuevas] = useState(0);

  const refresh = useCallback(async () => {
    if (!session || !user?.email) return;
    try {
      const [msgs, ofertas, nfs] = await Promise.all([
        sb.getMisChats(user.email, token).catch(() => []),
        sb.getOfertasRecibidas(user.email, token).catch(() => []),
        sb.getNotificaciones(user.email, token).catch(() => []),
      ]);

      const openId    = openChatRef?.current?.id;
      const openOtro  = openChatRef?.current?.autor_email;

      setUnread(msgs.filter(m =>
        m.de_nombre !== user.email &&
        !m.leido &&
        m.para_nombre !== "__grupo__" &&
        !(m.publicacion_id === openId &&
          (m.de_nombre === openOtro || m.para_nombre === openOtro))
      ).length);

      setOfertasCount(ofertas.length);

      const notifsInsc = (nfs || []).filter(n =>
        ["valorar_curso", "nuevo_ayudante", "busqueda_acordada", "nuevo_contenido"].includes(n.tipo)
      );
      setNotifCount(notifsInsc.length);
      setNotifs(nfs || []);

      const notifsCuenta = (nfs || []).filter(n =>
        ["oferta_aceptada", "oferta_rechazada", "contraoferta", "nueva_oferta", "nueva_inscripcion"].includes(n.tipo)
      );
      setOfertasAceptadasNuevas(notifsCuenta.length);
    } catch {
      // Silencioso — no interrumpir la UX por un fallo de polling
    }
  }, [session, token, user?.email, openChatRef]);

  useEffect(() => {
    if (!session) return;
    refresh();
    let t = setInterval(refresh, POLL_INTERVAL);

    const onVisibility = () => {
      clearInterval(t);
      if (!document.hidden) {
        refresh();
        t = setInterval(refresh, POLL_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session, refresh]);

  const clearBadgesCuenta = useCallback(async () => {
    setOfertasAceptadasNuevas(0);
    setOfertasCount(0);
    try {
      await sb.marcarNotifsTipoLeidas(
        user.email,
        ["oferta_aceptada", "oferta_rechazada", "contraoferta", "nueva_oferta", "nueva_inscripcion"],
        token
      );
    } catch {}
    refresh();
  }, [user?.email, token, refresh]);

  const clearBadgesInscripciones = useCallback(async () => {
    try {
      await sb.marcarNotifsTipoLeidas(
        user.email,
        ["valorar_curso", "nuevo_ayudante", "busqueda_acordada", "nuevo_contenido"],
        token
      );
    } catch {}
    refresh();
  }, [user?.email, token, refresh]);

  return {
    unread,
    ofertasCount,
    notifCount,
    notifs,
    ofertasAceptadasNuevas,
    refresh,
    clearBadgesCuenta,
    clearBadgesInscripciones,
  };
}
