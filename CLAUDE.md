# DestinoPropiedades.com — Contexto del proyecto

## Qué es
Portal inmobiliario premium para la diáspora salvadoreña en EE.UU. Vende lotes
dentro de lotificaciones/proyectos en El Salvador. Objetivo: generar confianza
y llevar al visitante a contactar por WhatsApp. Estilo portal de búsqueda
(tipo MapaInmueble.com) pero con estética de lujo, no de catálogo masivo.

Independiente de Odoo. No integrar Odoo.

## Negocio
- **DestinoPropiedades.com** = la plataforma (marca principal).
- **Grupo Inmobiliario Chacón** = desarrollador aliado actual, primer
  "inquilino". Es un módulo intercambiable: el modelo de datos debe permitir
  agregar otro desarrollador sin rediseñar nada.
- Compradores prioritarios: salvadoreños en EE.UU. (celular, buscan confianza
  y raíces). También desarrolladores regionales e inversionistas jóvenes.
- Jerarquía de decisión: Confianza → Inteligencia → Demanda → Conversaciones
  → Oportunidades calificadas → Transacciones → Escalabilidad.
- Idioma: español de El Salvador, registro neutro. Moneda: USD. Áreas en
  varas² y/o m².

## Stack
- Astro + Tailwind CSS. Salida estática (HTML pre-generado).
- Islas de interactividad solo donde haga falta (buscador/filtros, galería,
  favoritos).
- Imágenes WebP, lazy loading, tamaños responsivos.
- Sin backend ni base de datos en v1. Sin dependencias innecesarias.
- Si Astro complica la publicación para un dueño no técnico, se puede migrar
  a HTML/CSS/JS plano manteniendo el mismo modelo de datos. Se decide en
  conjunto con el dueño del proyecto antes de hacerlo.

## Identidad visual
- Tipografías: Playfair Display (títulos/encabezados), Hanken Grotesk
  (menú/cuerpo). Google Fonts.
- Paleta base (provisional, hasta tener el logo real): navy profundo
  (primario), dorado/arena (acento), neutros claros. Definida en
  `tailwind.config.mjs`.
- Mobile-first obligatorio.

## Modelo de datos (src/data/) — el corazón intercambiable
Todo el contenido vive en datos editables, no en el diseño/lógica.

- `src/data/sitio.ts` — config del tenant actual: marca, desarrollador
  actual, contacto, redes, colores, jurisdicción legal.
- `src/data/proyectos.ts` — lista de proyectos (lotificaciones). Cada uno con
  galería, precio, tipos de lote, servicios, ubicación, SEO propio y plantilla
  de mensaje de WhatsApp.
- `src/data/zonas.ts` — zonas (departamento/municipio) para páginas SEO con
  FAQ y proyectos relacionados.

Regla: cambiar un dato = cambiar el sitio. Nunca hardcodear contenido de
proyectos/contacto en componentes o páginas.

## Convenciones
- Componentes Astro en `src/components/`, layouts en `src/layouts/`.
- Una sola etiqueta `<h1>` por página.
- Precio: regla única — `"Desde $X por lote"` o `"Consultar"` (campo
  `etiquetaPrecio` en cada proyecto).
- Enlaces: nunca usar `href="#"` ni páginas vacías. Si una red social no
  existe, ocultar el ícono, no dejar el enlace vacío.
- WhatsApp: cada proyecto tiene su propio mensaje pre-escrito
  (`whatsappMensaje`) con el patrón
  `https://wa.me/NUMERO?text=...nombre del proyecto...URL de su página...`.
- Sin carrito, sin checkout, sin lista de deseos de e-commerce. Favoritos
  (corazón) usan `localStorage`, no backend.

## Datos pendientes de reemplazar (placeholders activos)
- WhatsApp y teléfono reales → en `src/data/sitio.ts`, marcados
  `// PENDIENTE: reemplazar con número real`.
- Logo de Grupo Inmobiliario Chacón → `public/assets/chacon-logo.webp`
  (placeholder de texto por ahora).
- Fotos reales de proyectos → `public/assets/proyectos/...` (placeholders
  por ahora).
- Correo de contacto real.
- Los 2-3 proyectos de ejemplo (`riviera-del-pacifico`, etc.) son inventados
  para poblar el sitio mientras llegan los reales — reemplazar o borrar
  cuando haya datos reales.

## SEO y redes (Fase 4) — es el corazón comercial
- Canal de promoción: redes sociales (Instagram, TikTok, Facebook) + pauta
  digital. Por eso el preview al compartir importa tanto como Google.
- `Layout.astro` emite: title/description únicos, Open Graph completo
  (con og:image absoluta 1200x630, og:locale es_SV, og:site_name), Twitter
  Card (summary_large_image), canonical, theme-color y robots.
- Imágenes de compartir "de marca" (1200x630, JPG para compatibilidad con
  WhatsApp/Facebook) en `public/assets/og/`. Se generan con `npm run og`
  (script `scripts/generar-og.ts`, usa sharp). Regenerar tras cambiar fotos,
  nombres o precios.
- Datos estructurados (JSON-LD) vía `src/lib/seo.ts` + `JsonLd.astro`:
  - Inicio: WebSite (con SearchAction) + Organization (sameAs = redes).
  - Ficha de proyecto: Product + AggregateOffer (precio) + BreadcrumbList.
  - Zona: CollectionPage + FAQPage + BreadcrumbList.
- `sitemap.xml` automático (@astrojs/sitemap) + `public/robots.txt` (no
  bloquea nada, apunta al sitemap). `site` configurado en `astro.config.mjs`.
- Páginas SEO de zona: `src/pages/[zona].astro`, datos en `src/data/zonas.ts`
  (descripcion + contexto + ventajas + faq + titulo/metaDescripcion).

## Estado del proyecto (fases)
- Fase 0 — Arranque: hecho.
- Fase 1 — Diseño base: hecho.
- Fase 2 — Fichas de proyecto (galería, datos, WhatsApp): hecho.
- Fase 3 — Búsqueda/listados (buscador, filtros, burbujas): hecho.
- Fase 4 — SEO + redes: hecho.
- Fases siguientes: Favoritos/formulario/legal (5), Revisión local (6),
  Publicación (7).

## Cómo correr el sitio localmente
```
npm install
npm run dev
```

## Regenerar imágenes sociales (al cambiar fotos/precios/nombres)
```
npm run og
```
