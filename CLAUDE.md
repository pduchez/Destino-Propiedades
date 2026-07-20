# CLAUDE.md — Manual de a bordo (DestinoPropiedades.com)

> Este archivo es la **memoria del proyecto**. Cualquier sesión de Claude Code
> que se abra en este repo debe leerlo primero para entender todo el sistema.

## 1. Qué es este repo
**UNA sola app Next.js (App Router)** que unifica TODO el ecosistema de
DestinoPropiedades.com. Secciones (en `src/app/`):

| Sección | Qué es |
|---|---|
| `(portal)` / `inicio` | Sitio público (portal inmobiliario) |
| `acceso-ventas` | **ARS** — Agente de Redes Sociales (genera, mide y mejora contenido social) |
| `crm` | CRM de prospectos/leads |
| `asistente` | Asistente de Cierre de ventas (integrado al CRM) |
| `proyectos.json` | Feed de datos de proyectos que ARS consume |
| `api` | Rutas de servidor de todo lo anterior |

Una sesión abierta sobre este repo puede cambiar **portal, ARS, CRM y Asistente**
a la vez: es un único taller para todo.

## 2. Fuente de verdad y despliegue (CRÍTICO)
- Rama de verdad: **`main`** → despliega a **destino-portal.vercel.app** (SITIO EN VIVO).
- **REGLA: NO empujar directo a `main`.** Trabajar en una rama a partir de `main` y
  abrir PR. Cada despliegue a la web es **decisión del dueño**.
- Repo: `pduchez/Destino-Propiedades`.
- ⚠️ `pduchez/asistente-cierre-ventas` es un **repo APARTE** (Asistente standalone),
  en proceso de retiro. El Asistente bueno es el **integrado** aquí.

## 3. El ecosistema (la visión)
```
PORTAL (atrae) → ARS (amplifica en redes) → CRM (captura) → ASISTENTE (cierra)
```
**Objetivo #1:** generar **conversaciones de WhatsApp con compradores de alta
intención** (leads calientes) para DP. La métrica estrella NO es "likes": es
**clics/conversaciones a WhatsApp**.

## 4. Principios NO negociables (el ADN)
1. **Datos SOLO del portal**, reales y verificados. PROHIBIDO inventar precios,
   m², financiamiento o cifras. Si falta un dato, se omite (no se rellena).
2. **Precio = gancho de accesibilidad**: usar SIEMPRE el precio **"desde"** (el más
   accesible), NUNCA el más caro.
3. **Coherencia total con el portal** (información, imagen, espíritu, enfoque).
4. **Revisión humana antes de publicar** (Fase 1). Autopublicación híbrida = Fase 2.
5. Español salvadoreño, cálido; **WhatsApp** siempre como destino.

## 5. Estructura técnica
- **src/lib**: `ai/` (generate, prompts, masterInstruction, evaluate, trends,
  campaignAnalysis), `automation.ts`, `metrics.ts`, `portal.ts`, `generation.ts`,
  `crmServer.ts`/`crm.ts`, `social/` (meta, x, tiktok), `embellecer.ts`,
  `reports.ts`, `notify.ts`, `storage.ts`.
- **prisma/schema.prisma**: PostgreSQL, ~21 modelos.
  - ARS: `BrandStrategy` (+`learnings`), `Project` (+`autoPost`,`postNetworks`),
    `Campaign`, `Asset`, `Post`, `PostMetric`, `StrategyReview`, `Automation`,
    `SalesCheckin`, `SocialAccount`.
  - CRM/Asistente: `Lead`, `Appointment`, `Activity`, `Organization`, `User`,
    `LoteReserva`, `FaqCierre`, `CartaDoc`, `CampaignAnalysis`, `ReportSchedule`,
    `StoredImage`.

## 6. Variables de entorno (en Vercel, no en el código)
`DATABASE_URL` (Postgres) · `ANTHROPIC_API_KEY` · `AI_MODEL` (claude-opus-4-8) ·
`DASHBOARD_PASSWORD` · `STORAGE_DRIVER` + `BLOB_READ_WRITE_TOKEN` (Vercel Blob) ·
`META_PAGE_ID`/`META_PAGE_ACCESS_TOKEN`/`META_IG_USER_ID`/`META_GRAPH_VERSION`
(publicar en FB/IG) · `X_API_KEY`/`X_API_SECRET`/`X_ACCESS_TOKEN`/`X_ACCESS_SECRET` ·
`TIKTOK_ACCESS_TOKEN` · `PUBLIC_BASE_URL`.
- **Pendientes:** `JSON2VIDEO_API_KEY` (Fase A de video) · `CRON_SECRET` (opcional,
  protege `/api/cron/tick`).
- Nunca poner secretos en el repo. Tras editar variables en Vercel → **Redeploy**.

## 7. ARS — cómo funciona
- **Instrucción Madre** (`BrandStrategy.masterInstruction`): autoridad estratégica,
  editable/subible en Configuración. Incluye §0.5 "Lógica comercial" (precio de entrada).
- **Ficha por proyecto** (`Project.instructionDoc`): prioridad sobre los defaults.
- **Aprendizajes** (`BrandStrategy.learnings`): se inyectan en la generación; los
  alimentan la autoevaluación y las tendencias.
- **Sincronización del portal** (`/api/portal/sync`): usa el feed **`/proyectos.json`**
  (fuente de verdad); si no hay feed, cae a scraping HTML/sitemap.
- **Métricas + autoevaluación** (`/acceso-ventas/metrics`): optimiza hacia WhatsApp.
- **Automatización** (cron diario `/api/cron/tick`, ver `vercel.json`): generación
  diaria por proyecto/red, tendencias quincenales que **autoactualizan la
  Instrucción Madre**, y chequeo mensual de ventas. Autopiloto OFF por defecto;
  se controla en `/acceso-ventas/automation`.

## 8. Video (Fase A — en construcción)
- **Motor: JSON2Video** (API JSON→MP4, TTS incluido, render async por webhook).
  **NO CapCut** (no tiene API pública para esto).
- **Estilo elegido:** fotos reales + texto en pantalla + subtítulos + música
  (**SIN voz**).
- **Cobertura:** UN reel maestro 9:16 por proyecto/día, **adaptado por red** (ahorra render).
- Requiere **≥4 fotos reales** por proyecto; si no, ARS pide subir material crudo.

## 9. Estado de despliegues (Vercel) — limpieza pendiente
| Vercel | Rama/Repo | Estado |
|---|---|---|
| **destino-portal.vercel.app** | `main` | ✅ **CANÓNICO** (app unificada) |
| destino-propiedades-huz5 | `main` | Duplicado → retirar |
| destino-propiedades | rama `ars` | ARS viejo standalone → retirar |
| asistente-cierre-ventas | repo aparte | Asistente standalone → retirar tras confirmar paridad |

Ramas obsoletas del repo: `ars`, `portal`, `claude/determined-curie-u890uo`,
`claude/social-media-automation-agent-4j7b22`.

## 10. Convenciones
- Next.js 14 App Router. `export const dynamic = "force-dynamic"` en TODAS las
  rutas API (evita caché estática con datos obsoletos).
- Prisma + PostgreSQL. Tras cambiar el schema: `npx prisma generate`.
- TypeScript estricto: `npx tsc --noEmit` debe pasar. Si aparecen errores de tipos
  "fantasma" tras mover archivos, borrar `.next/` y reintentar.
- Commits claros. No exponer secretos.

## 11. Pendientes / contexto para retomar
- **Meta (FB/IG) auto-publicación:** viable; el adaptador ya existe
  (`src/lib/social/meta.ts`). Falta: app de Meta + token (System User) +
  verificación de negocio. Escalón 1 = **semi-automático** (aprobar → publicar).
- **1000 contactos EE.UU.** (salvadoreños): entran al CRM en un paso futuro.
- **Retirar el Asistente standalone** y dejar solo el integrado.
