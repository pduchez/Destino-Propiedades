/**
 * Integración con el portal (DestinoPropiedades.com): lectura server-side de
 * las páginas de proyecto para traer DATOS e IMÁGENES reales, sin inventar y
 * sin duplicar la captura manual. Genérico y reutilizable (enlatado).
 */

export async function fetchPortalPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw Object.assign(
      new Error(`El portal respondió ${res.status} al leer ${url}.`),
      { status: 400 },
    );
  }
  return res.text();
}

/* ───────────────────────────── IMÁGENES ───────────────────────────── */

/** Extrae URLs de imágenes del HTML (galerías reales: lazy, srcset, bg, etc.). */
export function extractImageUrls(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  const push = (raw: string | undefined) => {
    if (!raw) return;
    const u = resolveUrl(raw.trim(), baseUrl);
    if (u && isLikelyPhoto(u)) found.add(u);
  };
  const pushSrcset = (value: string) => {
    for (const part of value.split(",")) push(part.trim().split(/\s+/)[0]);
  };

  for (const m of html.matchAll(
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)[^"']*["'][^>]*>/gi,
  )) {
    const c = /content=["']([^"']+)["']/i.exec(m[0]);
    if (c) push(c[1]);
  }
  for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const tag = m[0];
    for (const attr of [
      "src",
      "data-src",
      "data-lazy-src",
      "data-lazy",
      "data-original",
      "data-image",
      "data-bg",
    ]) {
      const a = new RegExp(`\\b${attr}=["']([^"']+)["']`, "i").exec(tag);
      if (a) push(a[1]);
    }
    const ss = /\b(?:data-)?srcset=["']([^"']+)["']/i.exec(tag);
    if (ss) pushSrcset(ss[1]);
  }
  for (const m of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) pushSrcset(m[1]);
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) push(m[1]);
  for (const m of html.matchAll(
    /<a\b[^>]*\bhref=["']([^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["']/gi,
  )) {
    push(m[1]);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (/as=["']image["']/i.test(m[0]) || /rel=["'][^"']*image[^"']*["']/i.test(m[0])) {
      const h = /href=["']([^"']+)["']/i.exec(m[0]);
      if (h) push(h[1]);
    }
  }
  return Array.from(found).slice(0, 30);
}

export function resolveUrl(raw: string, base: string): string | null {
  if (!raw || raw.startsWith("data:")) return null;
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

export function isLikelyPhoto(url: string): boolean {
  const u = url.toLowerCase();
  if (!/^https?:\/\//.test(u)) return false;
  if (/\.svg(\?|$)/.test(u)) return false;
  const file = u.split("?")[0].split("/").pop() || "";
  if (/(logo|icon|sprite|favicon|avatar|placeholder|spinner|loader|banner-ad)/.test(file))
    return false;
  return (
    /\.(jpe?g|png|webp|avif)(\?|$)/.test(u) ||
    /(uploads|media|images|img|wp-content|cdn|gallery|fotos?|photos?)/.test(u)
  );
}

export function guessMime(url: string): string {
  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

/* ───────────────────────────── DATOS ───────────────────────────── */

export interface PortalData {
  name?: string;
  description?: string;
  location?: string;
  priceFrom?: string;
  currency?: string;
  priceLabel?: string;
}

export function extractPortalData(html: string): PortalData {
  const out: PortalData = {};

  for (const block of jsonLdBlocks(html)) {
    for (const node of flattenNodes(block)) {
      const type = String(node["@type"] ?? "").toLowerCase();
      if (type.includes("product") || node.offers) {
        if (!out.name && typeof node.name === "string") out.name = node.name;
        if (!out.description && typeof node.description === "string")
          out.description = node.description;
        if (!out.location && typeof node.areaServed === "string")
          out.location = node.areaServed;
        const offer = pickOffer(node.offers);
        if (offer) {
          const low = offer.lowPrice ?? offer.price;
          if (low != null && !out.priceFrom) {
            out.priceFrom = formatNumber(low);
            if (typeof offer.priceCurrency === "string") out.currency = offer.priceCurrency;
          }
        }
      }
    }
  }

  const labelMatch = /\b(desde|from)\b[^<$]*\$\s*([\d][\d.,]*)[^<]*/i.exec(stripTags(html));
  if (labelMatch) {
    out.priceLabel = labelMatch[0].replace(/\s+/g, " ").trim();
    if (!out.priceFrom) {
      out.priceFrom = formatNumber(labelMatch[2]);
      out.currency ??= "USD";
    }
  }

  if (!out.description) {
    const og =
      /<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*>/i.exec(html);
    if (og) {
      const c = /content=["']([^"']+)["']/i.exec(og[0]);
      if (c) out.description = decodeEntities(c[1]);
    }
  }
  if (!out.name) {
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (h1) out.name = decodeEntities(stripTags(h1[1]).trim());
  }

  return out;
}

interface OfferLike {
  lowPrice?: number | string;
  price?: number | string;
  priceCurrency?: string;
}
function pickOffer(offers: unknown): OfferLike | null {
  if (!offers) return null;
  const o = Array.isArray(offers) ? offers[0] : offers;
  return o && typeof o === "object" ? (o as OfferLike) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonLdBlocks(html: string): Record<string, any>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: Record<string, any>[] = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* ignora bloques malformados */
    }
  }
  return blocks;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenNodes(node: Record<string, any>): Record<string, any>[] {
  if (Array.isArray(node["@graph"])) return node["@graph"];
  return [node];
}

function formatNumber(v: number | string): string {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (!isFinite(n) || n <= 0) return String(v);
  return n.toLocaleString("en-US");
}
function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
}
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* ─────────────────────── DESCUBRIMIENTO DE PROYECTOS ─────────────────────── */

/**
 * Encuentra las URLs de páginas de proyecto del portal a partir de un índice
 * (/proyectos) o de un sitemap. Busca enlaces del patrón /proyectos/<slug>.
 */
export function discoverProjectUrls(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  // Enlaces href="/proyectos/<slug>" y URLs absolutas en sitemap (<loc>).
  const patterns = [
    /href=["']([^"']*\/proyectos\/[^"'/?#]+\/?)["']/gi,
    /<loc>\s*([^<\s]*\/proyectos\/[^<\s?#]+\/?)\s*<\/loc>/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const u = resolveUrl(m[1], baseUrl);
      if (!u) continue;
      // Excluye el índice /proyectos y /proyectos?...; queremos /proyectos/<slug>
      if (/\/proyectos\/[^/?#]+\/?($|[?#])/.test(u)) urls.add(stripQuery(u));
    }
  }
  return Array.from(urls);
}

export function slugFromUrl(url: string): string {
  const clean = stripQuery(url).replace(/\/+$/, "");
  return clean.split("/").pop() || "";
}

function stripQuery(u: string): string {
  const i = u.search(/[?#]/);
  return i === -1 ? u : u.slice(0, i);
}

/* ─────────────────────── FEED ESTRUCTURADO DEL PORTAL ─────────────────────── */
// El portal publica /proyectos.json (fuente de verdad, sin scraping). Es más
// robusto que leer el HTML y trae AMENIDADES y NOVEDADES que el scraping no ve.

export interface PortalFeedProject {
  slug: string;
  nombre: string;
  url: string;
  tipo?: string;
  tipoLabel?: string;
  estado?: string;
  destacado?: boolean;
  departamento?: string;
  municipio?: string;
  ubicacion?: string;
  etiquetaPrecio?: string;
  precioDesde?: number | null;
  moneda?: string;
  descripcion?: string;
  servicios?: string[];
  imagenes?: string[];
  novedad?: string | null;
  actualizado?: string;
}
export interface PortalFeed {
  marca?: string;
  portalUrl?: string;
  generado?: string;
  total?: number;
  proyectos: PortalFeedProject[];
}

/**
 * Lee el feed estructurado /proyectos.json del portal. Devuelve null si no
 * existe o no es válido, para que el llamador caiga al scraping (compatibilidad).
 */
export async function fetchPortalFeed(base: string): Promise<PortalFeed | null> {
  const url = `${base.replace(/\/+$/, "")}/proyectos.json`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as PortalFeed;
    if (!data || !Array.isArray(data.proyectos) || data.proyectos.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

/** Convierte una entrada del feed en los campos que guarda el ARS (Project). Puro. */
export function feedProjectToFields(p: PortalFeedProject): {
  slug: string;
  name: string;
  fields: Record<string, string>;
  images: string[];
} {
  const fields: Record<string, string> = {};
  if (p.url) fields.websiteUrl = p.url;
  if (p.tipoLabel || p.tipo) fields.propertyType = String(p.tipoLabel || p.tipo);
  if (p.ubicacion) fields.location = p.ubicacion;
  if (p.precioDesde != null) fields.priceFrom = formatNumber(p.precioDesde);
  else if (p.etiquetaPrecio) fields.priceFrom = p.etiquetaPrecio;
  if (p.moneda) fields.currency = p.moneda;
  if (p.descripcion && p.descripcion.length > 20) fields.description = p.descripcion;
  if (Array.isArray(p.servicios)) fields.amenities = JSON.stringify(p.servicios);
  fields.novedad = (p.novedad ?? "").toString();
  return {
    slug: p.slug,
    name: p.nombre || p.slug,
    fields,
    images: Array.isArray(p.imagenes) ? p.imagenes : [],
  };
}
