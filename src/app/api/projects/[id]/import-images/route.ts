/**
 * Importa fotos del proyecto desde su página en el portal.
 * POST { url? } -> usa body.url o, si falta, el websiteUrl del proyecto.
 * Descarga la página (server-side), extrae las URLs de imágenes y las agrega
 * como stock del proyecto (sin descargar el archivo: guarda la URL pública).
 *
 * Nota: si el portal bloquea la lectura por servidor o renderiza las imágenes
 * con JavaScript, puede que no encuentre ninguna; en ese caso, pega las URLs
 * manualmente en "Stock de imágenes".
 */
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";

type Ctx = { params: { id: string } };

export const POST = withAuth(async (req, { params }: Ctx) => {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return errorJson("Proyecto no encontrado", 404);

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const pageUrl = (body.url || project.websiteUrl || "").trim();
  if (!/^https?:\/\//i.test(pageUrl)) {
    return errorJson(
      "Configura la URL del proyecto en el portal (campo 'URL del proyecto') o envía una URL válida.",
    );
  }

  let html: string;
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      return errorJson(
        `El portal respondió ${res.status} al leer ${pageUrl}. Puede que bloquee la lectura automática; pega las fotos manualmente en Stock.`,
        400,
      );
    }
    html = await res.text();
  } catch (e) {
    return errorJson(`No se pudo leer la página: ${(e as Error).message}`, 400);
  }

  const urls = extractImageUrls(html, pageUrl);
  if (urls.length === 0) {
    return errorJson(
      "No se encontraron imágenes en la página (puede que el portal las cargue con JavaScript). Pega las URLs en Stock de imágenes.",
      400,
    );
  }

  // Evita duplicar las que ya existan para el proyecto.
  const existing = await prisma.asset.findMany({
    where: { projectId: project.id },
    select: { url: true },
  });
  const have = new Set(existing.map((a) => a.url));

  let created = 0;
  for (const url of urls) {
    if (have.has(url)) continue;
    await prisma.asset.create({
      data: {
        projectId: project.id,
        filename: url,
        originalName: url.split("/").pop()?.split("?")[0] || "imagen",
        url,
        mimeType: guessMime(url),
        tags: stringify(["portal", project.slug]),
      },
    });
    have.add(url);
    created++;
  }

  return json({ ok: true, found: urls.length, created });
});

/**
 * Extrae URLs de imágenes del HTML. Cubre los patrones reales de galerías
 * inmobiliarias: og:image, <img src>, atributos de carga diferida (lazy:
 * data-src/data-lazy/data-original), srcset/<picture>, fondos CSS
 * (background-image:url(...)), enlaces de lightbox (<a href="...jpg">) y
 * preloads (<link rel="preload" as="image">).
 */
function extractImageUrls(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  const push = (raw: string | undefined) => {
    if (!raw) return;
    const u = resolve(raw.trim(), baseUrl);
    if (u && isLikelyPhoto(u)) found.add(u);
  };
  const pushSrcset = (value: string) => {
    for (const part of value.split(",")) {
      push(part.trim().split(/\s+/)[0]);
    }
  };

  // og:image / twitter:image (en cualquier orden de atributos)
  for (const m of html.matchAll(
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)[^"']*["'][^>]*>/gi,
  )) {
    const c = /content=["']([^"']+)["']/i.exec(m[0]);
    if (c) push(c[1]);
  }
  // <img> y <source>: src + atributos de carga diferida más comunes
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
  // srcset sueltos (por si el regex de tag no capturó alguno)
  for (const m of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    pushSrcset(m[1]);
  }
  // Fondos CSS: background-image:url(...) o style="...url(...)"
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    push(m[1]);
  }
  // Enlaces de lightbox a la imagen a resolución completa
  for (const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["']/gi)) {
    push(m[1]);
  }
  // <link rel="preload" as="image" href="...">
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (/as=["']image["']/i.test(m[0]) || /rel=["'][^"']*image[^"']*["']/i.test(m[0])) {
      const h = /href=["']([^"']+)["']/i.exec(m[0]);
      if (h) push(h[1]);
    }
  }

  return Array.from(found).slice(0, 30);
}

function resolve(raw: string, base: string): string | null {
  if (!raw || raw.startsWith("data:")) return null;
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

function isLikelyPhoto(url: string): boolean {
  const u = url.toLowerCase();
  if (!/^https?:\/\//.test(u)) return false;
  // Descarta SVG y elementos de UI (logos, íconos, sprites, etc.) por nombre.
  if (/\.svg(\?|$)/.test(u)) return false;
  const file = u.split("?")[0].split("/").pop() || "";
  if (/(logo|icon|sprite|favicon|avatar|placeholder|spinner|loader|banner-ad)/.test(file)) return false;
  // Acepta extensiones de foto o rutas típicas de media.
  return (
    /\.(jpe?g|png|webp|avif)(\?|$)/.test(u) ||
    /(uploads|media|images|img|wp-content|cdn|gallery|fotos?|photos?)/.test(u)
  );
}

function guessMime(url: string): string {
  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

export const dynamic = "force-dynamic";
