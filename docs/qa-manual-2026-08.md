# QA manual — lo que tienen que probar ustedes

> Generado 2026-08-06. Todo lo de acá está detrás del login o depende de dinero
> real, así que no lo pude ejercitar yo. Verifiqué que compila, que pasan los 92
> tests, el lint y los tipos, y que la app levanta sin errores de consola — pero
> eso no prueba que el flujo funcione con datos reales.
>
> **Contexto que importa**: la plataforma tiene 3 inscripciones, 0 clases
> registradas y 0 movimientos de billetera. Nada del circuito de dinero se
> ejercitó nunca de verdad. La primera venta real es el test que cuenta.

---

## 🔴 Crítico — el circuito del dinero

Hacer esto de punta a punta con **dos cuentas** (una docente, una alumna) y, si
se puede, con Mercado Pago en modo sandbox.

### 1. Comprar varias unidades

- [ ] Publicar una clase particular a **$10 la hora**, sin paquetes armados.
- [ ] Desde la cuenta alumna, tocar **Inscribirme**.
- [ ] **Tiene que aparecer el paso "Inscribirme" con el selector − / +**, no
      saltar directo a "Elegí cómo pagar". Si salta, `precio_tipo` no se guardó.
- [ ] Subir a 5 horas: el total tiene que decir **$50**, no $10.
- [ ] Pagar y confirmar que la inscripción quede con 5 unidades.

### 2. Comprar una clase con duración declarada

- [ ] Publicar una clase a **$50 la clase**, con duración **30 min**.
- [ ] En la ficha tiene que decir "$50 /clase **de 30 min**".
- [ ] Comprar 2. La capacidad interna tiene que ser **60 minutos**, no 120.
      (Antes el sistema asumía 60 min por clase y el docente cobraba la mitad.)

### 3. Registrar y confirmar una clase

- [ ] Desde la cuenta docente, ir a **Mi agenda**.
- [ ] Tiene que aparecer **"Confirmá las clases que diste"** con las clases de
      los últimos 14 días.
- [ ] Tocar "La di" y verificar que la alumna **reciba la notificación**
      (`confirmar_clase`). Este aviso estuvo roto: nunca llegaba.
- [ ] Desde la alumna, confirmar. Verificar que:
  - [ ] el saldo del docente **suba solo por las horas de esa clase**,
  - [ ] las unidades restantes **bajen**.
- [ ] Tocar "La di" dos veces sobre la misma clase: **no debe duplicar** ni pagar
      de nuevo.

### 4. Objetar horas

- [ ] El docente declara más horas de las dictadas.
- [ ] La alumna **objeta** indicando menos horas.
- [ ] Verificar que el pago **no se libere** mientras la objeción esté abierta.
- [ ] Probar las dos salidas: que el docente **acepte** la objeción, y que **no**
      la acepte y lo resuelva el admin.

### 5. Reembolso

- [ ] Con un pago retenido, desinscribirse.
- [ ] El monto tiene que volver al **saldo de la alumna, completo, con comisión
      incluida**.
- [ ] Verificar que el texto de la política de devoluciones coincida con lo que
      pasó (acredita a saldo, no al medio de pago original).

---

## 🟠 Importante — lo que cambié y no vi funcionar

- [ ] **Inscribirse ya no permite "coordinar el pago con el docente"**. Ese botón
      se quitó. Confirmar que no quedó ningún camino de inscripción sin pago
      (salvo cursos gratis y clase de prueba, que son deliberados).
- [ ] **Clase de prueba solo en cursos**: al publicar una clase particular ya no
      debería ofrecerse. Se desactivó en 2 publicaciones que la tenían.
- [ ] **Ficha de un curso**: no debe decir "/hora" ni ofrecer certificado si es
      particular; la frecuencia no debe aparecer en particulares.
- [ ] **Pedido sin precio**: debe decir "A convenir", no "Gratis" en verde.
- [ ] **Barra superior del detalle**: revisar que el aire nuevo se vea bien, en
      claro y oscuro, y en celular.
- [ ] **Botón Salir** del menú lateral: en una sola línea.
- [ ] **Eliminar cuenta** (Mi cuenta → Ajustes): ahora registra una solicitud
      real. Verificar que llegue al panel de admin como queja de categoría
      `baja_cuenta`.

---

## 🔴 Cuenta de Mercado Pago — separar la personal de la plataforma

Hoy el `MP_ACCESS_TOKEN` de Luderis es la **cuenta personal de Salvador**
(confirmado 2026-08-07: la venta de prueba aparece en su panel de MP). Eso
significa que la plata de todos los docentes, mientras está "retenida en
Luderis", está en realidad en una cuenta personal.

Por qué conviene cambiarlo:
- **Fiscal**: entra como ingreso al CUIT personal plata que en su mayoría es de
  terceros. El ingreso propio es solo la comisión.
- **Legal**: los Términos y la política de devoluciones dicen que Luderis retiene
  el pago. Sin cuenta separada no hay segregación de fondos de terceros.
- **Riesgo**: si MP limita la cuenta personal, se congela la plata de toda la
  plataforma.

Qué hacer:
- [ ] Crear una cuenta de MP para Luderis (idealmente con CUIT propio).
- [ ] Cambiar `MP_ACCESS_TOKEN` en los secrets de Supabase.
- [ ] ⚠️ Antes de cambiarlo: liberar o resolver todo lo que esté pendiente, porque
      `liberar-pago` transfiere desde la cuenta del token vigente y los pagos
      viejos quedan asociados a la cuenta anterior.
- [ ] Cuando MP apruebe Connect, el modelo cambia: la plata del docente va directo
      a su cuenta con split automático y Luderis deja de tocarla.

### Pago huérfano de mayo

`mp_payment_id 159789500111` ($1, del 22/05): está aprobado, creó la inscripción,
pero **no generó movimiento de billetera ni acreditó saldo**. Es anterior al
escrow interno (6/7), así que es del modelo viejo. Decidir si se regulariza a
mano o se deja documentado como dato histórico.

---

## 🟡 Configuración — cosas que no son código

- [ ] **`UNSUB_SECRET`** tiene que existir en los secrets de Supabase. Le saqué
      el valor por defecto, así que si falta, el link de desuscribir de los mails
      va a fallar ruidosamente (antes usaba un secreto conocido y falsificable).
- [ ] **Deploy de edge functions**: `ai-proxy`, `ludy-chat` y `send-push` **no**
      deben deployarse con `--no-verify-jwt`. Ahora validan la firma contra
      GoTrue, pero el gateway es la primera capa.
- [ ] **`smart-worker`** ahora exige service-role key o `x-cron-key`. Si hay un
      cron llamándolo, verificar que mande el header.
- [ ] **Dominio**: `luderis.com` devuelve 404. Producción sirve en
      `classelink.vercel.app`. Si el dominio propio debía estar apuntando, no lo está.
- [ ] **Cron de liquidaciones mensuales**: quedó comentado en la migración
      original y nunca se agendó. Hoy nadie recibe liquidación automática.

---

## 🔵 Decisiones de producto pendientes

- [ ] **`disputas` vs. el texto legal**: el flujo de objeción de horas ya existe,
      pero `PoliticaDevoluciones` S9 también habla de mediación general por email.
      Confirmar que eso es lo que quieren ofrecer.
- [ ] **Onboarding**: manda `modalidad_preferida` y `presupuesto` al guardar, y
      **esas columnas no existen**. Un `.catch()` vacío se traga el error, así que
      las preferencias del onboarding nunca se guardaron. Decidir si se crean las
      columnas o se sacan del payload.
- [ ] **`max_alumnos`**: el formulario lo ofrece para cursos pero ninguna
      publicación lo usa. Ver si tiene sentido mantenerlo.

---

## Cómo mirar el estado real de la base

```sql
-- ¿Se están registrando clases y liberando pagos?
select
  (select count(*) from inscripciones)          as inscripciones,
  (select count(*) from clases_realizadas)      as clases,
  (select count(*) from billetera_movimientos)  as movimientos,
  (select count(*) from disputas)               as disputas;

-- ¿Una inscripción quedó bien armada?
select clases_totales, clases_restantes, minutos_totales, minutos_consumidos,
       pagado_mp, mp_payment_id
  from inscripciones order by created_at desc limit 5;
```
