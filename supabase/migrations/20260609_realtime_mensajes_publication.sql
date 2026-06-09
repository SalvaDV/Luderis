-- Habilita Supabase Realtime (postgres_changes) en la tabla mensajes.
-- Antes solo 'notificaciones' estaba en la publicación supabase_realtime, por lo
-- que el WebSocket del chat 1-a-1 nunca recibía los INSERT → los mensajes no
-- aparecían en vivo (había que cerrar y reabrir el chat para re-fetchear).
-- El cliente (src/components/ChatModal.jsx) se suscribe con el access_token del
-- usuario, así que la entrega queda scopeada por las políticas RLS de mensajes.
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
