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

/** Extrae URLs de imágenes del HTML (og:image, <img src>, y srcset). */
function extractImageUrls(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  const push = (raw: string) => {
    const u = resolve(raw, baseUrl);
    if (u && isLikelyPhoto(u)) found.add(u);
  };

  // og:image / twitter:image
  for (const m of html.matchAll(
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)[^"']*["'][^>]+content=["']([^"']+)["']/gi,
  )) {
    push(m[1]);
  }
  // <img src="...">
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    push(m[1]);
  }
  // srcset (toma la primera URL de cada entrada)
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) push(u);
    }
  }

  return Array.from(found).slice(0, 20);
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
  // Descarta logos, íconos, sprites, svg y placeholders.
  if (/(logo|icon|sprite|favicon|avatar|placeholder|\.svg)(\?|$|[/_-])/.test(u)) return false;
  // Acepta extensiones de foto o rutas típicas de media.
  return (
    /\.(jpe?g|png|webp|avif)(\?|$)/.test(u) ||
    /(uploads|media|images|img|wp-content|cdn)/.test(u)
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
