# Integración WhatsApp ⇄ DestinoPropiedades (guía para Sebastián)

**Objetivo:** el bot de WhatsApp (movido por Claude) atiende al prospecto, responde con
datos reales del portal y, sin intervención humana, crea el lead y agenda la cita en
nuestro CRM. Cuando el prospecto pide un humano, se transfiere al vendedor asignado.

## La idea clave (arquitectura desacoplada)
El bot **no vive dentro de nuestro código** ni necesita nuestra base de datos. Se conecta
por **dos endpoints** del portal (ya en producción):

| Qué | Endpoint | Auth | Uso |
|---|---|---|---|
| **Leer** proyectos (nombres, precios, fotos, URLs) | `GET /proyectos.json` | Ninguna (público) | Que el bot conteste con info real y mande el link/fotos |
| **Escribir** al CRM (lead + conversación + handoff + cita) | `POST /api/crm/intake` | `Authorization: Bearer <INTAKE_SECRET>` | Alimentar el CRM y agendar |

> `GET /api/crm/intake` (sin body) devuelve el contrato completo como documentación viva.

Base URL de producción: **`https://www.destinopropiedades.com`** (o `https://destino-portal.vercel.app` mientras se conecta el dominio).

---

## 1) Leer proyectos — `GET /proyectos.json`
Devuelve un arreglo de proyectos con `slug`, `nombre`, `url` (página), `departamento`,
`tipo`, `precioDesde`, `imagenes` (URLs absolutas), etc. El bot lo usa para responder
precios/disponibilidad y enviar el enlace o una foto. No requiere llave.

## 2) Escribir al CRM — `POST /api/crm/intake`
Cabecera: `Authorization: Bearer <INTAKE_SECRET>` (o `?key=<INTAKE_SECRET>`).
Cuerpo (JSON) — todos los campos son opcionales salvo identificar al prospecto por
`waThreadId` **o** `phone`:

```json
{
  "waThreadId": "id-del-hilo-de-whatsapp",      // recomendado (clave estable de dedupe)
  "phone": "+503 7712 3456",
  "name": "Marta González",
  "source": "whatsapp",                          // o instagram/facebook (de dónde vino)
  "projectSlug": "bypass-la-poza",               // slug tomado de /proyectos.json
  "projectName": "ByPass La Poza",
  "messages": [                                   // se registran en la línea de tiempo
    { "from": "prospect",  "text": "Hola, vi el anuncio..." },
    { "from": "assistant", "text": "Hola! Tenemos lotes desde $19,900..." }
  ],
  "temperature": "caliente",                      // caliente|tibio|frio (opcional)
  "value": 25000,                                 // valor estimado (opcional)
  "requestHuman": false,                          // true => transfiere a un vendedor
  "assignTo": "ventas1",                          // vendedor específico; si se omite, reparto equitativo
  "appointment": {                                // si el bot agenda una cita
    "at": "2026-07-11T16:00:00.000Z",             // ISO 8601 (UTC)
    "location": "Oficina de ventas ByPass La Poza",
    "notes": "Cliente quiere ver lotes esquineros"
  }
}
```

Respuesta:
```json
{ "ok": true, "leadId": "...", "stage": "visita", "assignedTo": "ventas1", "handedOff": true, "appointmentId": "..." }
```

**Comportamiento (ya implementado):**
- **Dedupe:** mismo `waThreadId` (o `phone`) → siempre el mismo lead. Se puede llamar en
  cada turno de la conversación; los mensajes se van acumulando.
- **Handoff:** con `requestHuman:true` (o `assignTo`) se asigna vendedor, se marca el
  traspaso y el lead sube de etapa. Los vendedores válidos son `ventas1`…`ventas5`.
- **Cita:** con `appointment` se crea en la **Agenda** del vendedor y en el **log** del
  cliente; el lead pasa a etapa "Visita".

### Traspaso al WhatsApp del vendedor
El CRM registra a qué vendedor va (`assignedTo`). El "cómo" físico del traspaso de la
conversación lo maneja el bot. Números de WhatsApp de cada vendedor: **los define Pedro**
(hoy el CRM guarda un teléfono por vendedor en Configuración → reportes; podemos exponerlo
por API si lo necesitas — pídelo y lo agrego).

---

## Qué construye Sebastián
1. **Webhook de WhatsApp Cloud API** (Meta) para el número salvadoreño definitivo.
2. **El agente Claude** que conversa, consulta `/proyectos.json` para datos reales y llama
   a `POST /api/crm/intake` en los momentos clave (nuevo prospecto, cada turno, cita, handoff).
3. Hospedaje del bot (su propio proyecto: Vercel, Cloud Run, etc. — a su criterio).

**Recomendado:** el bot como **servicio aparte**. Así no toca nuestro repo ni nuestra BD,
y el acoplamiento es solo por los 2 endpoints. (Si prefiere meter el webhook dentro de
nuestra app, es posible pero requiere acceso a GitHub/Vercel — ver más abajo.)

---

## Accesos que Pedro debe dar (mínimo indispensable)
Con el bot como servicio aparte, Sebastián **NO necesita** Vercel, Neon ni fal. Solo:

| Acceso | Para qué | Cómo |
|---|---|---|
| **`INTAKE_SECRET`** (el valor) | Autenticar las llamadas al CRM | Pedro lo crea en Vercel (ver abajo) y se lo pasa por canal seguro |
| **Base URL de producción** | Saber a dónde llamar | Compartir `https://www.destinopropiedades.com` |
| **Meta WhatsApp / Business** | Configurar el número y el webhook | Agregar a Sebastián como **usuario** en tu **Meta Business** con acceso a la app y al número de WhatsApp (Business Settings → Usuarios → Agregar) |

**NO le des:** Neon (BD), fal.ai, ni tu contraseña de Vercel/registrador. No los necesita.

### (Opción B) Si el bot vivirá dentro de nuestro repo
Solo entonces dale: **GitHub** (colaborador del repo `pduchez/Destino-Propiedades`) y
**Vercel** (miembro del proyecto `destino-portal`). Sigue **sin** necesitar Neon/fal directos.

---

## Pasos de Pedro (una sola vez)
1. **Crear el secreto del CRM en Vercel:**
   `vercel.com/pduchez/destino-portal/settings/environment-variables` → **Add**:
   - Key: `INTAKE_SECRET`
   - Value: una cadena larga y aleatoria (ej. genera 32+ caracteres)
   - Entornos: los 3 → **Save** → **Redeploy**.
   Comparte ese valor con Sebastián por un canal seguro (no por chat abierto).
2. **Conectar el dominio** `www.destinopropiedades.com` a Vercel:
   `…/settings/domains` → **Add** → Vercel te dará un registro **CNAME** (o A). Ponlo en
   tu registrador (Name.com). No necesitas darle acceso al registrador a nadie.
3. **Meta/WhatsApp:** agrega a Sebastián a tu **Meta Business** con acceso al número y a la
   app de WhatsApp, para que configure el webhook y el envío/recepción de mensajes.

## Verificación (cuando Sebastián conecte)
- `GET https://www.destinopropiedades.com/proyectos.json` → responde el catálogo. ✅
- `GET https://www.destinopropiedades.com/api/crm/intake` → responde el contrato. ✅
- Una llamada de prueba con el `INTAKE_SECRET` crea un lead visible en el CRM
  (`/crm/leads`) y, si manda `appointment`, aparece en `/crm/agenda`. ✅

## Resumen
El bot lee `/proyectos.json` (público) para responder, y escribe en `/api/crm/intake`
(con `INTAKE_SECRET`) para alimentar el CRM y agendar. Es todo. El portal/CRM/ARS ya
están listos y esperando esas llamadas.
