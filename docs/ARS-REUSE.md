# ARS — Agente de Redes Sociales · Guía de reutilización (enlatado)

ARS es una plataforma **genérica y reutilizable**: el mismo código sirve para
cualquier portal inmobiliario. Todo lo específico de un cliente vive en **datos
editables desde el dashboard**, no en el código. Para levantar ARS en un
proyecto nuevo no hace falta programar: se clona el despliegue y se configura.

## Qué es genérico (el "core") y qué se personaliza

| Genérico (no se toca) | Se personaliza (por cliente, desde el dashboard) |
|---|---|
| Generación con Claude, prompts, redes (FB/IG/X/TikTok) | Estrategia de marca (nombre, portal, tono) en **Configuración** |
| Cola de aprobación y vista previa por red | **Instrucción Madre** (subir/pegar la del cliente) |
| Importar datos y fotos del portal | **Proyectos** (crear a mano o **Importar del portal**) |
| Métricas, informe y autoevaluación de estrategia | Número de WhatsApp y fichas por proyecto |
| Publicación (Meta/X/TikTok) | Credenciales de las redes en **Configuración** |

El único código específico de Destino es `prisma/seed-condado.ts` (un proyecto
de **ejemplo**). No afecta al core.

## Montar ARS para un portal nuevo (paso a paso)

1. **Despliega una instancia nueva** (Vercel + Postgres + Vercel Blob). Variables:
   - `ANTHROPIC_API_KEY` — clave de Claude.
   - `DATABASE_URL` — Postgres (p. ej. Neon).
   - `BLOB_READ_WRITE_TOKEN` — almacenamiento de imágenes.
   - `DASHBOARD_PASSWORD` — (opcional) protege el panel.
   - `ARS_SEED_EXAMPLE=off` — **arranca limpio**, sin el proyecto de ejemplo.
2. **Configuración → Estrategia de marca**: nombre de marca, URL del portal, tono.
3. **Configuración → Instrucción Madre**: sube o pega la instrucción del cliente
   (voz, personas, guardrails, lógica comercial). Es la autoridad estratégica.
4. **Proyectos**: crea cada proyecto y usa **📄 Importar datos del portal** y
   **🖼️ Importar fotos del portal** para traer precio "desde", descripción,
   ubicación y fotos reales sin reescribir nada.
5. **Generar → Aprobación**: genera borradores por red, revísalos con **👁 Vista
   previa**, edita y publica.
6. **Métricas e informe**: carga los números de cada red (o, en Fase 2, se
   llenan solos por API) y usa **Autoevaluación** para que ARS proponga y
   aplique ajustes a la estrategia (mejora continua).

## Principios que ARS aplica siempre

- **Datos solo del portal**, nunca inventados. Si falta un dato, se omite.
- **Precio = gancho de accesibilidad**: se promociona el **"desde"** (el más
  accesible), nunca el más caro.
- **Coherencia total con el portal**: información, imagen, espíritu y enfoque.
- **Revisión humana** antes de publicar (Fase 1); publicación híbrida en Fase 2.
