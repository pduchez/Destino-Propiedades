/**
 * Importa los DATOS REALES del proyecto desde su página en el portal.
 * POST { url? } -> usa body.url o, si falta, el websiteUrl del proyecto.
 *
 * Lee la página (server-side) y extrae información VERIFICADA, sin inventar:
 *  - Precio de ENTRADA ("desde"): de los datos estructurados JSON-LD
 *    (offers.lowPrice) o del texto visible "Desde $X". Es el precio comercial
 *    correcto (el más accesible), no el más caro.
 *  - Descripción, ubicación y nombre: de JSON-LD / meta tags.
 *
 * Solo sobreescribe los campos que encuentra; nunca rellena con suposiciones.
 */
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";

type Ctx = { params: { id: string } };

interface PortalData {
  name?: string;
  description?: string;
  location?: string;
  priceFrom?: string; // solo dígitos con separadores, ej. "24,693"
  currency?: string;
  priceLabel?: string; // ej. "Desde $24,693 por lote"
}

export const POST = withAuth(async (req, { params }: Ctx) => {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return errorJson("Proyecto no encontrado", 404);

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const pageUrl = (body.url || project.websiteUrl || "").trim();
  if (!/^https?:\/\//i.test(pageUrl)) {
    return errorJson(
      "Configura la URL del proyecto en el portal o envía una URL válida.",
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
        `El portal respondió ${res.status} al leer ${pageUrl}. Puede que bloquee la lectura automática.`,
        400,
      );
    }
    html = await res.text();
  } catch (e) {
    return errorJson(`No se pudo leer la página: ${(e as Error).message}`, 400);
  }

  const data = extractPortalData(html);

  // Construye el update solo con lo que sí se encontró (no inventa).
  const update: Record<string, string> = {};
  const applied: string[] = [];
  if (data.priceFrom) {
    update.priceFrom = data.priceFrom;
    if (data.currency) update.currency = data.currency;
    applied.push(`precio "desde ${data.priceFrom} ${data.currency ?? project.currency}"`);
  }
  if (data.description && data.description.length > 20) {
    update.description = data.description;
    applied.push("descripción");
  }
  if (data.location) {
    update.location = data.location;
    applied.push(`ubicación (${data.location})`);
  }

  if (Object.keys(update).length === 0) {
    return errorJson(
      "No se encontraron datos estructurados en la página (precio/descripción/ubicación). Puede que el portal los cargue con JavaScript.",
      400,
    );
  }

  await prisma.project.update({ where: { id: project.id }, data: update });

  return json({
    ok: true,
    applied,
    priceLabel: data.priceLabel ?? null,
    data,
  });
});

/** Extrae datos del proyecto desde JSON-LD y, como respaldo, del texto visible. */
function extractPortalData(html: string): PortalData {
  const out: PortalData = {};

  // 1) JSON-LD (datos estructurados schema.org). Fuente más fiable.
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
            if (typeof offer.priceCurrency === "string")
              out.currency = offer.priceCurrency;
          }
        }
      }
    }
  }

  // 2) Texto visible "Desde $X ..." (etiqueta de precio del portal).
  const labelMatch =
    /\b(desde|from)\b[^<$]*\$\s*([\d][\d.,]*)[^<]*/i.exec(stripTags(html));
  if (labelMatch) {
    out.priceLabel = labelMatch[0].replace(/\s+/g, " ").trim();
    if (!out.priceFrom) {
      out.priceFrom = formatNumber(labelMatch[2]);
      out.currency ??= "USD";
    }
  }

  // 3) Descripción de respaldo: og:description / meta description.
  if (!out.description) {
    const og =
      /<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*>/i.exec(
        html,
      );
    if (og) {
      const c = /content=["']([^"']+)["']/i.exec(og[0]);
      if (c) out.description = decodeEntities(c[1]);
    }
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

/** Devuelve los bloques JSON-LD parseados (tolerante a errores). */
function jsonLdBlocks(html: string): Record<string, any>[] {
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

/** Aplana @graph y arreglos anidados en una lista de nodos. */
function flattenNodes(node: Record<string, any>): Record<string, any>[] {
  if (Array.isArray(node["@graph"])) return node["@graph"];
  return [node];
}

function formatNumber(v: number | string): string {
  const n =
    typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (!isFinite(n) || n <= 0) return String(v);
  return n.toLocaleString("en-US"); // 24693 -> "24,693"
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

export const dynamic = "force-dynamic";
