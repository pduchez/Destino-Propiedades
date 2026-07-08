import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { saveBuffer, isDurableStorage } from "@/lib/storage";
import {
  buildEditPrompt,
  runFalKontext,
  stampDisclaimer,
  fetchToBuffer,
  falConfigured,
  type ProjectHint,
} from "@/lib/embellecer";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // la generación puede tardar

/** GET -> estado de configuración (para la UI). */
export const GET = withAuth(async () => {
  return json({ falReady: falConfigured(), storageReady: isDurableStorage() });
});

/**
 * POST { assetId?, imageUrl?, projectId?, estilo? }
 * Embellece una foto real y la guarda como un Asset nuevo tagueado "embellecida".
 * Nunca toca la imagen original.
 */
export const POST = withAuth(async (req) => {
  if (!falConfigured()) {
    return errorJson(
      "Falta la variable FAL_KEY en Vercel. Agrégala (Settings → Environment Variables) y vuelve a desplegar.",
      400,
    );
  }
  // Sin Blob no hay dónde guardar la imagen generada (el disco de Vercel es de
  // solo lectura). Fallamos rápido y claro ANTES de gastar crédito de fal.ai.
  if (!isDurableStorage()) {
    return errorJson(
      "Falta conectar un almacenamiento Vercel Blob. En Vercel → tu proyecto → Storage → Create → Blob, conéctalo y vuelve a desplegar. (Crea la variable BLOB_READ_WRITE_TOKEN automáticamente.)",
      400,
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    assetId?: string;
    imageUrl?: string;
    projectId?: string | null;
    estilo?: string;
  };
  const estilo = body.estilo || "auto";

  // Resolver la imagen origen (absoluta y pública) y el proyecto.
  const origin = new URL(req.url).origin;
  let sourceUrl = "";
  let projectId: string | null = body.projectId ?? null;

  if (body.assetId) {
    const asset = await prisma.asset.findUnique({ where: { id: body.assetId } });
    if (!asset) return errorJson("Asset no encontrado.", 404);
    sourceUrl = asset.url;
    projectId = projectId ?? asset.projectId;
  } else if (body.imageUrl) {
    sourceUrl = body.imageUrl;
  } else {
    return errorJson("Indica assetId o imageUrl.", 400);
  }
  // Absolutizar URLs relativas (p. ej. /proyectos/..\/foto.webp) para fal.ai.
  const absSource = /^https?:\/\//i.test(sourceUrl)
    ? sourceUrl
    : new URL(sourceUrl, origin).href;

  // Contexto del proyecto para que Claude escriba un prompt certero.
  let hint: ProjectHint | null = null;
  if (projectId) {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (p) {
      hint = {
        name: p.name,
        tipo: /playa|beach/i.test(p.propertyType) ? "playa" : p.propertyType || "residencial",
        location: p.location,
        description: p.description,
      };
    }
  }

  // 1) Cerebro: prompt de edición. 2) fal.ai. 3) sello. 4) guardar.
  const prompt = await buildEditPrompt(hint, estilo);
  const outUrl = await runFalKontext(absSource, prompt);
  const raw = await fetchToBuffer(outUrl);
  const stamped = await stampDisclaimer(raw);
  const stored = await saveBuffer(stamped, `embellecida-${estilo}.jpg`, "image/jpeg");

  const asset = await prisma.asset.create({
    data: {
      projectId: projectId || null,
      filename: stored.filename,
      originalName: `Embellecida (${estilo})`,
      url: stored.url,
      mimeType: "image/jpeg",
      sizeBytes: stored.sizeBytes,
      tags: stringify(["embellecida", estilo]),
    },
  });

  return json({ asset, promptUsed: prompt, before: absSource, after: stored.url });
});
