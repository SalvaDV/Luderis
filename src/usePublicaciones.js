/**
 * usePublicaciones.js
 *
 * Hook reutilizable que encapsula toda la lógica de carga de publicaciones.
 * Elimina el código duplicado entre ExplorePage, AgendaPage, etc.
 *
 * USO:
 *   const { posts, loading, error, reload } = usePublicaciones({ tipo: "oferta" });
 */

import { useState, useEffect, useCallback } from "react";
import * as sb from "../supabase.js";
import { useSession } from "../contexts/SessionContext.jsx";

/**
 * @param {Object} options
 * @param {string} [options.tipo] - "oferta" | "busqueda" | undefined (todos)
 * @param {string} [options.autor] - email del autor para filtrar
 * @param {boolean} [options.enabled] - si false, no carga (default: true)
 */
export function usePublicaciones({ tipo, autor, enabled = true } = {}) {
  const { token } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await sb.getPublicaciones({ tipo, autor }, token);
      setPosts(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, tipo, autor, enabled]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, error, reload: load };
}

/**
 * Versión para "mis publicaciones" del usuario autenticado.
 */
export function useMisPublicaciones() {
  const { token, user } = useSession();
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const data = await sb.getMisPublicaciones(user.email, token);
      setPubs(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.email]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (post) => {
    if (post.activo === false && post.estado_validacion === "pendiente") return;
    try {
      await sb.updatePublicacion(post.id, { activo: !post.activo }, token);
      await load();
    } catch (e) {
      throw e;
    }
  }, [token, load]);

  const remove = useCallback(async (post) => {
    try {
      await sb.deletePublicacion(post.id, token);
      await load();
    } catch (e) {
      throw e;
    }
  }, [token, load]);

  return { pubs, loading, error, reload: load, toggle, remove };
}
