# Destino — Agente de Redes Sociales

Agente automatizado que **genera y publica contenido** en redes sociales
(Facebook, Instagram, X y TikTok) para el portal inmobiliario
**Destinopropiedades.com**, controlado desde un **dashboard web**.

A partir de una **estrategia general de marca** y/o **campañas específicas por
proyecto inmobiliario**, el bot redacta los mensajes con **IA (Claude)**, los
combina con una **imagen aleatoria de un stock**, y deja los borradores listos
para **revisión y aprobación humana** antes de publicarse.

---

## ✨ Capacidades

- **Multi-proyecto**: maneja todo el portafolio inmobiliario del portal.
- **Estrategia + campañas**: una instrucción estratégica general del portal y
  campañas específicas (global o por proyecto) que guían la generación.
- **Stock de imágenes**: sube imágenes/videos (globales o por proyecto) que el
  bot elige aleatoriamente para cada post.
- **Generación con IA**: copys adaptados a cada red (tono, longitud, hashtags)
  usando Claude. Si no hay API key, funciona con plantillas (modo demo).
- **Cola de aprobación (Fase 1)**: revisa, edita y aprueba cada borrador; luego
  publica con un clic.
- **Publicación**: adaptadores para Meta (Facebook + Instagram), X y TikTok.
- **Dashboard**: administra todo (estrategia, proyectos, campañas, stock,
  generación, aprobación y credenciales) desde una sola interfaz.

### Fases de publicación

- **Fase 1 (actual): aprobación humana.** El bot genera borradores; tú apruebas
  y publicas.
- **Fase 2 (cuando lo indiques): híbrido por red.** Cada cuenta tiene un
  interruptor `Auto-publicar` ya preparado en Configuración para automatizar
  algunas redes y dejar otras en aprobación manual.

---

## 🧱 Stack

- **Next.js 14** (App Router) — dashboard + API + integraciones, app standalone.
- **Prisma + PostgreSQL** — base de datos (local y producción).
- **Anthropic SDK (Claude)** — generación de copys.
- **Vercel Blob** (o `./uploads` en local) — almacenamiento de imágenes.
- **Tailwind CSS** — interfaz.

> ¿Quieres una **URL pública**? Sigue **[DEPLOY.md](./DEPLOY.md)** para
> desplegar en Vercel en ~15 minutos.

---

## 🚀 Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   - DATABASE_URL: una Postgres (crea una gratis en https://neon.tech).
#   - ANTHROPIC_API_KEY: opcional (sin ella usa plantillas).

# 3. Crear las tablas y datos iniciales
npm run setup        # prisma generate + db push + seed

# 4. Levantar el dashboard
npm run dev
#   Abre http://localhost:3000
```

> Sin `ANTHROPIC_API_KEY` el sistema funciona igual, pero genera los textos con
> **plantillas** en lugar de IA. Añade la key para activar Claude.
>
> Para una **URL pública** (Vercel + Postgres + Blob), ver **[DEPLOY.md](./DEPLOY.md)**.

### Flujo de uso

1. **Configuración** → define la estrategia de marca y (opcional) credenciales.
2. **Proyectos** → registra tus proyectos inmobiliarios.
3. **Stock de imágenes** → sube imágenes (globales o por proyecto).
4. **Campañas** (opcional) → crea campañas con instrucciones específicas.
5. **Generar** → elige proyecto/campaña + redes y genera borradores.
6. **Aprobación** → revisa, edita, aprueba y publica.

---

## 🔑 Variables de entorno

Ver [`.env.example`](./.env.example). Las principales:

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Claude (genera los copys). |
| `AI_MODEL` | Modelo de IA (por defecto `claude-opus-4-8`). |
| `DASHBOARD_PASSWORD` | Protege el dashboard (si está vacío, queda abierto en dev). |
| `PUBLIC_BASE_URL` | URL pública base (para enviar imágenes a las redes). |
| `META_*`, `X_*`, `TIKTOK_*` | Credenciales de publicación (Fase 2 / publicación real). |

Las credenciales de redes **no son obligatorias en Fase 1**: puedes generar y
aprobar borradores sin ellas. Configúralas en **Configuración** para publicar
directamente.

### Notas de integración por red

- **Meta (Facebook + Instagram)**: requiere una App de Meta, una Página y una
  cuenta de Instagram Business vinculada, con un *Page Access Token* de larga
  duración. Las imágenes deben ser URLs públicas (de ahí `PUBLIC_BASE_URL`).
- **X (Twitter)**: API v2 con OAuth 1.0a (API key/secret + access token/secret).
- **TikTok**: Content Posting API; publica **video** (sube .mp4/.mov al stock).

---

## 🗂️ Estructura

```
prisma/schema.prisma     Modelos: BrandStrategy, Project, Campaign, Asset, Post, SocialAccount
src/lib/ai/              Prompts + generación con Claude
src/lib/social/          Adaptadores Meta / X / TikTok + orquestación de publicación
src/lib/generation.ts    Orquestación: genera borradores (copy + imagen)
src/lib/storage.ts       Almacenamiento de imágenes (local; migrable a S3)
src/app/api/             API del dashboard (route handlers)
src/app/                 Páginas del dashboard
```

---

## 🔭 Roadmap (Fase 2 y más)

- Activar `Auto-publicar` por red (publicación híbrida).
- Programación/calendario de publicaciones (`scheduledAt` ya existe en el modelo).
- Subida de imágenes a X (media v1.1) y publicación de carruseles en IG.
- Métricas de desempeño por post.
- Integración opcional con Meta Business Suite.
