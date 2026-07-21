/**
 * Orquestador de video (modo PLANTILLA). ARS ya no diseña el video: elige una
 * plantilla profesional, la rellena con datos REALES (copy + fotos/clips) y la
 * envía a JSON2Video. El render es asíncrono; al terminar se adjunta el MP4 a
 * los borradores por red (Fase 1: aprobación humana).
 */
import { prisma } from "@/lib/db";
import { parseArray, stringify } from "@/lib/json";
import { NETWORKS, isNetwork, type Network } from "@/lib/networks";
import type { ProjectContext } from "@/lib/ai/prompts";
import { generateReelCopy } from "@/lib/video/reelCopy";
import {
  REEL_TEMPLATES,
  resolveMovie,
  type ReelVariables,
  type MediaKind,
} from "@/lib/video/reelTemplates";
import { submitMovie, getMovieStatus, isVideoConfigured } from "@/lib/video/json2video";

/** Medios mínimos (fotos o clips) para un reel decente. */
export const MIN_MEDIA = 3;
const VIDEO = /^video\//;
const IMG = /^image\//;

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

function priceLabel(priceFrom: string, currency: string): string {
  if (!priceFrom) return "Consultá el precio";
  return currency === "USD" ? `Desde $${priceFrom}` : `Desde ${priceFrom} ${currency}`;
}

export interface GenerateVideoResult {
  jobId: string;
  externalId: string;
  templateId: string;
  posts: number;
  usedAI: boolean;
}

export async function generateVideoForProject(
  projectId: string,
  networksIn?: string[],
  templateId?: string,
): Promise<GenerateVideoResult> {
  if (!isVideoConfigured()) {
    throw Object.assign(
      new Error("Falta JSON2VIDEO_API_KEY en el servidor (Vercel). Configúrala y vuelve a desplegar."),
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw Object.assign(new Error("Proyecto no encontrado"), { status: 404 });

  // Medios reales: clips de video (excepto 360 crudos) + fotos (embellecidas primero).
  const assets = await prisma.asset.findMany({ where: { projectId } });
  const videos = assets.filter((a) => VIDEO.test(a.mimeType) && !/"360"/.test(a.tags));
  const images = assets.filter((a) => IMG.test(a.mimeType));
  images.sort((a, b) => Number(/"embellecida"/.test(b.tags)) - Number(/"embellecida"/.test(a.tags)));

  // Lista ordenada: video primero (luce mejor), luego fotos.
  const mediaList: { url: string; kind: MediaKind }[] = [
    ...videos.map((a) => ({ url: a.url, kind: "video" as MediaKind })),
    ...images.map((a) => ({ url: a.url, kind: "image" as MediaKind })),
  ];
  if (mediaList.length < MIN_MEDIA) {
    throw Object.assign(
      new Error(
        `Este proyecto tiene ${mediaList.length} medio(s); se necesitan al menos ${MIN_MEDIA} (fotos o clips de dron planos). Sube más en Stock de imágenes.`,
      ),
      { status: 400 },
    );
  }

  const networks = ((networksIn && networksIn.filter(isNetwork)) as Network[] | undefined)?.length
    ? (networksIn!.filter(isNetwork) as Network[])
    : NETWORKS;

  const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
  const projectCtx: ProjectContext = {
    name: project.name,
    location: project.location,
    propertyType: project.propertyType,
    priceFrom: project.priceFrom,
    currency: project.currency,
    description: project.description,
    amenities: parseArray(project.amenities),
    highlights: parseArray(project.highlights),
    hashtags: parseArray(project.hashtags),
    websiteUrl: project.websiteUrl,
    contactInfo: project.contactInfo,
    instructionDoc: project.instructionDoc,
  };

  const copy = await generateReelCopy({
    brandName: brand?.brandName ?? "Destino Propiedades",
    project: projectCtx,
    networks,
  });

  // Asigna medios a media_1..6 (cicla si hay menos) y arma el mapa de tipos.
  const kinds: Record<string, MediaKind> = {};
  const media: Record<string, string> = {};
  for (let i = 1; i <= 6; i++) {
    const m = mediaList[(i - 1) % mediaList.length];
    media[`media_${i}`] = m.url;
    kinds[`media_${i}`] = m.kind;
  }

  const vars: ReelVariables = {
    logo_url: process.env.VIDEO_LOGO_URL || "",
    brand_name: brand?.brandName ?? "Destino Propiedades",
    project_name: project.name,
    location: project.location,
    hook: copy.hook,
    benefit_1: copy.benefit_1,
    benefit_2: copy.benefit_2,
    benefit_3: copy.benefit_3,
    price_label: priceLabel(project.priceFrom, project.currency),
    cta: copy.cta,
    accent_color: process.env.VIDEO_ACCENT_COLOR || "#C9A463",
    music_url: process.env.JSON2VIDEO_MUSIC_URL || "",
    media_1: media.media_1,
    media_2: media.media_2,
    media_3: media.media_3,
    media_4: media.media_4,
    media_5: media.media_5,
    media_6: media.media_6,
  };

  // Plantilla: la elegida, o una rotación al azar entre las 5.
  const chosen =
    (templateId && REEL_TEMPLATES.find((t) => t.id === templateId)?.id) ||
    REEL_TEMPLATES[Math.floor(Math.random() * REEL_TEMPLATES.length)].id;

  const movie = resolveMovie(chosen, vars, kinds);

  // Webhook de entrega (si hay URL pública); si no, el cron/sondeo lo cierra.
  const webhookUrl = baseUrl()
    ? `${baseUrl()}/api/render/webhook${process.env.CRON_SECRET ? `?key=${process.env.CRON_SECRET}` : ""}`
    : undefined;
  if (webhookUrl) {
    (movie as Record<string, unknown>).exports = [
      { destinations: [{ type: "webhook", endpoint: webhookUrl }] },
    ];
  }

  const submit = await submitMovie(movie);
  if (!submit.ok || !submit.externalId) {
    throw Object.assign(new Error(submit.error || "No se pudo iniciar el render."), { status: 400 });
  }

  const job = await prisma.renderJob.create({
    data: {
      projectId,
      provider: "json2video",
      status: "rendering",
      externalId: submit.externalId,
      networks: stringify(networks),
      spec: JSON.stringify({ template: chosen }).slice(0, 20000),
    },
  });

  const postIds: string[] = [];
  for (const network of networks) {
    const cap = copy.captions[network];
    const post = await prisma.post.create({
      data: {
        projectId,
        network,
        status: "draft",
        caption: cap?.caption ?? "",
        hashtags: stringify(cap?.hashtags ?? projectCtx.hashtags),
        callToAction: cap?.callToAction ?? "Escríbenos por WhatsApp",
        assetIds: stringify([]),
        renderJobId: job.id,
        model: `reel: ${chosen}${copy.usedAI ? " + claude" : ""}`,
      },
    });
    postIds.push(post.id);
  }
  await prisma.renderJob.update({ where: { id: job.id }, data: { postIds: stringify(postIds) } });

  return { jobId: job.id, externalId: submit.externalId, templateId: chosen, posts: postIds.length, usedAI: copy.usedAI };
}

/* ─────────────────── Cierre del render (webhook / sondeo) ─────────────────── */

async function attachVideo(jobId: string, videoUrl: string): Promise<void> {
  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "done") return;
  const project = job.projectId
    ? await prisma.project.findUnique({ where: { id: job.projectId } })
    : null;

  const asset = await prisma.asset.create({
    data: {
      projectId: job.projectId,
      filename: videoUrl,
      originalName: `reel-${project?.slug ?? "proyecto"}.mp4`,
      url: videoUrl,
      mimeType: "video/mp4",
      tags: stringify(["video", "reel", project?.slug].filter(Boolean)),
    },
  });

  for (const pid of parseArray(job.postIds)) {
    await prisma.post
      .update({ where: { id: pid }, data: { assetIds: stringify([asset.id]) } })
      .catch(() => {});
  }
  await prisma.renderJob.update({ where: { id: jobId }, data: { status: "done", videoUrl } });
}

export async function settleJob(jobId: string): Promise<string> {
  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job || !job.externalId || job.status !== "rendering") return job?.status ?? "unknown";
  const st = await getMovieStatus(job.externalId);
  if (st.status === "done" && st.videoUrl) {
    await attachVideo(jobId, st.videoUrl);
    return "done";
  }
  if (st.status === "failed") {
    await prisma.renderJob.update({
      where: { id: jobId },
      data: { status: "failed", error: st.error || "Render falló." },
    });
    for (const pid of parseArray(job.postIds)) {
      await prisma.post
        .update({ where: { id: pid }, data: { status: "failed", error: st.error || "Render de video falló." } })
        .catch(() => {});
    }
    return "failed";
  }
  return "rendering";
}

export async function settleByExternalId(externalId: string, videoUrl?: string): Promise<void> {
  const job = await prisma.renderJob.findFirst({ where: { externalId, status: "rendering" } });
  if (!job) return;
  if (videoUrl) await attachVideo(job.id, videoUrl);
  else await settleJob(job.id);
}

export async function settlePendingRenders(limit = 20): Promise<{ settled: number }> {
  const jobs = await prisma.renderJob.findMany({ where: { status: "rendering" }, take: limit });
  let settled = 0;
  for (const j of jobs) {
    const s = await settleJob(j.id);
    if (s === "done" || s === "failed") settled++;
  }
  return { settled };
}
