/**
 * Sincroniza TODO el portafolio desde el portal.
 * POST { base? } -> descubre todas las páginas de proyecto del portal (índice
 * /proyectos + sitemap), y por cada una importa DATOS reales (precio "desde",
 * descripción, ubicación) e IMÁGENES reales. Crea/actualiza cada proyecto en
 * ARS sin duplicar la carga manual.
 */
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { slugify } from "@/lib/slug";
import {
  fetchPortalPage,
  extractPortalData,
  extractImageUrls,
  discoverProjectUrls,
  slugFromUrl,
  guessMime,
} from "@/lib/portal";

export const POST = withAuth(async (req) => {
  const body = (await req.json().catch(() => ({}))) as { base?: string };
  const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
  const base = (body.base || brand?.portalUrl || "https://destinopropiedades.com").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return errorJson("URL base del portal inválida.");

  // 1) Descubrir URLs de proyectos (índice + sitemaps).
  const urls = new Set<string>();
  const tryDiscover = async (u: string) => {
    try {
      const html = await fetchPortalPage(u);
      for (const p of discoverProjectUrls(html, base)) urls.add(p);
      // Si es un sitemap-index, sigue los sub-sitemaps.
      for (const m of html.matchAll(/<loc>\s*([^<\s]+sitemap[^<\s]*\.xml)\s*<\/loc>/gi)) {
        try {
          const sub = await fetchPortalPage(m[1]);
          for (const p of discoverProjectUrls(sub, base)) urls.add(p);
        } catch {
          /* ignora sub-sitemap inaccesible */
        }
      }
    } catch {
      /* ignora fuente inaccesible */
    }
  };
  await tryDiscover(`${base}/proyectos/`);
  await tryDiscover(`${base}/sitemap-index.xml`);
  await tryDiscover(`${base}/sitemap.xml`);

  const projectUrls = Array.from(urls).slice(0, 40);
  if (projectUrls.length === 0) {
    return errorJson(
      `No se encontraron páginas de proyecto en ${base}. Verifica la URL del portal (¿es la versión publicada?) o sincroniza cada proyecto desde su ficha.`,
      400,
    );
  }

  // 2) Importar cada proyecto (datos + fotos).
  const results: { slug: string; url: string; ok: boolean; priceFrom?: string; photos?: number; note?: string }[] = [];
  for (const url of projectUrls) {
    try {
      const html = await fetchPortalPage(url);
      const data = extractPortalData(html);
      const slug = slugFromUrl(url) || slugify(data.name || "proyecto");
      const name = data.name || slug;

      const fields: Record<string, string> = { websiteUrl: url };
      if (data.priceFrom) fields.priceFrom = data.priceFrom;
      if (data.currency) fields.currency = data.currency;
      if (data.description && data.description.length > 20) fields.description = data.description;
      if (data.location) fields.location = data.location;

      const project = await prisma.project.upsert({
        where: { slug },
        update: fields,
        create: { name, slug, ...fields },
      });

      // Fotos: agrega las nuevas del portal.
      const imgs = extractImageUrls(html, url);
      const existing = await prisma.asset.findMany({
        where: { projectId: project.id },
        select: { url: true },
      });
      const have = new Set(existing.map((a) => a.url));
      let photos = 0;
      for (const imgUrl of imgs) {
        if (have.has(imgUrl)) continue;
        await prisma.asset.create({
          data: {
            projectId: project.id,
            filename: imgUrl,
            originalName: imgUrl.split("/").pop()?.split("?")[0] || "imagen",
            url: imgUrl,
            mimeType: guessMime(imgUrl),
            tags: stringify(["portal", slug]),
          },
        });
        have.add(imgUrl);
        photos++;
      }

      results.push({
        slug,
        url,
        ok: true,
        priceFrom: data.priceFrom,
        photos,
        note: imgs.length === 0 ? "sin fotos en el portal todavía" : undefined,
      });
    } catch (e) {
      results.push({ slug: slugFromUrl(url), url, ok: false, note: (e as Error).message });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const totalPhotos = results.reduce((s, r) => s + (r.photos ?? 0), 0);
  return json({
    ok: true,
    base,
    discovered: projectUrls.length,
    imported: okCount,
    totalPhotos,
    results,
  });
});

export const dynamic = "force-dynamic";
