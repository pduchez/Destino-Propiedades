import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { saveBuffer } from "@/lib/storage";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const scope = url.searchParams.get("scope"); // "global" | "all"
  let where: Record<string, unknown> | undefined;
  if (scope === "global") where = { projectId: null };
  else if (projectId) where = { OR: [{ projectId }, { projectId: null }] };
  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return json(assets);
});

/**
 * Crea imágenes en el stock. Dos modos:
 *  - JSON  { url, projectId?, tags? }  -> registra una imagen de stock PÚBLICA
 *    por URL (no requiere almacenamiento; ideal para Vercel sin Blob).
 *  - multipart con campo "file"        -> sube uno o varios archivos.
 */
export const POST = withAuth(async (req) => {
  const contentType = req.headers.get("content-type") || "";

  // --- Modo URL pública (JSON) ---
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      url?: string;
      projectId?: string | null;
      tags?: unknown;
      originalName?: string;
    };
    const externalUrl = String(body.url ?? "").trim();
    if (!/^https?:\/\//i.test(externalUrl)) {
      return errorJson("Proporciona una URL de imagen válida (http/https).");
    }
    const tags = toTags(body.tags);
    const mime = guessMime(externalUrl);
    const asset = await prisma.asset.create({
      data: {
        projectId: body.projectId ? String(body.projectId) : null,
        filename: externalUrl, // para URLs externas el filename es la propia URL
        originalName: body.originalName || externalUrl.split("/").pop() || "imagen",
        url: externalUrl,
        mimeType: mime,
        tags: stringify(tags),
      },
    });
    return json([asset], 201);
  }

  // --- Modo subida de archivos (multipart) ---
  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return errorJson("No se recibió ningún archivo.");

  const projectIdRaw = form.get("projectId");
  const projectId =
    typeof projectIdRaw === "string" && projectIdRaw ? projectIdRaw : null;
  const tags = toTags(form.get("tags"));

  const created = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await saveBuffer(
      buffer,
      file.name || "imagen",
      file.type || "image/jpeg",
    );
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filename: stored.filename,
        originalName: file.name || "",
        url: stored.url,
        mimeType: file.type || "image/jpeg",
        sizeBytes: stored.sizeBytes,
        tags: stringify(tags),
      },
    });
    created.push(asset);
  }
  return json(created, 201);
});

function toTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string")
    return v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function guessMime(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".mp4")) return "video/mp4";
  if (clean.endsWith(".mov")) return "video/quicktime";
  return "image/jpeg";
}

export const dynamic = "force-dynamic";
