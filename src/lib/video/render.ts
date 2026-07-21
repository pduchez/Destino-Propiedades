/**
 * Orquestador de video: genera UN reel maestro por proyecto (fotos reales +
 * texto + música, sin voz) y lo adapta a cada red con caption propio. El render
 * es asíncrono (JSON2Video): se crea un RenderJob "rendering" y borradores de
 * Post; al terminar, se adjunta el MP4 como Asset y los borradores quedan en la
 * cola de aprobación (Fase 1).
 */
import { prisma } from "@/lib/db";
import { parseArray, stringify } from "@/lib/json";
import { NETWORKS, isNetwork, type Network } from "@/lib/networks";
import type { ProjectContext } from "@/lib/ai/prompts";
import { generateStoryboard } from "@/lib/video/storyboard";
import { buildMovie } from "@/lib/video/movie";
import {
  submitMovie,
  getMovieStatus,
  isVideoConfigured,
} from "@/lib/video/json2video";

/** Fotos reales mínimas para armar un reel decente. */
export const MIN_PHOTOS = 4;

const IMG = /^image\//;

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

export interface GenerateVideoResult {
  jobId: string;
  externalId: string;
  posts: number;
  usedAI: boolean;
}

export async function generateVideoForProject(
  projectId: string,
  networksIn?: string[],
): Promise<GenerateVideoResult> {
  if (!isVideoConfigured()) {
    throw Object.assign(
      new Error("Falta JSON2VIDEO_API_KEY en el servidor (Vercel). Configúrala y vuelve a desplegar."),
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw Object.assign(new Error("Proyecto no encontrado"), { status: 404 });

  // Fotos reales del proyecto (solo imágenes). Se priorizan las EMBELLECIDAS
  // (mejoradas por IA): son las más aspiracionales y dan mejor primera impresión.
  const assets = await prisma.asset.findMany({ where: { projectId } });
  const images = assets.filter((a) => IMG.test(a.mimeType));
  const isEmbellecida = (a: (typeof images)[number]) => /"embellecida"/.test(a.tags);
  images.sort((a, b) => Number(isEmbellecida(b)) - Number(isEmbellecida(a)));
  const photos = images.map((a) => ({
    url: a.url,
    alt: parseArray(a.tags).join(", ") || a.originalName || "",
  }));

  if (photos.length < MIN_PHOTOS) {
    throw Object.assign(
      new Error(
        `Este proyecto tiene ${photos.length} foto(s); se necesitan al menos ${MIN_PHOTOS} para un reel. Sube más fotos reales en Stock de imágenes.`,
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

  const storyboard = await generateStoryboard({
    brand: { brandName: brand?.brandName ?? "Destino Propiedades" },
    project: projectCtx,
    photos,
    networks,
  });

  const webhookUrl = baseUrl()
    ? `${baseUrl()}/api/render/webhook${process.env.CRON_SECRET ? `?key=${process.env.CRON_SECRET}` : ""}`
    : undefined;

  const movie = buildMovie(storyboard, {
    photos: photos.map((p) => p.url),
    webhookUrl,
    musicUrl: process.env.JSON2VIDEO_MUSIC_URL || undefined,
  });

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
      spec: JSON.stringify(movie).slice(0, 20000),
    },
  });

  // Borradores por red (un mismo reel, caption adaptado). El video se adjunta
  // cuando el render termine (webhook o sondeo).
  const postIds: string[] = [];
  for (const network of networks) {
    const cap = storyboard.captions[network];
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
        model: storyboard.usedAI ? "json2video + claude (reel)" : "json2video (plantilla)",
      },
    });
    postIds.push(post.id);
  }

  await prisma.renderJob.update({ where: { id: job.id }, data: { postIds: stringify(postIds) } });

  return { jobId: job.id, externalId: submit.externalId, posts: postIds.length, usedAI: storyboard.usedAI };
}

/** Adjunta el video terminado a los posts del trabajo y cierra el job. */
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

  const postIds = parseArray(job.postIds);
  for (const pid of postIds) {
    await prisma.post.update({
      where: { id: pid },
      data: { assetIds: stringify([asset.id]) },
    }).catch(() => {});
  }

  await prisma.renderJob.update({
    where: { id: jobId },
    data: { status: "done", videoUrl },
  });
}

/** Consulta el estado de un job y lo cierra si terminó (done/failed). */
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
    // Marca los posts como fallidos para que el operador lo vea.
    for (const pid of parseArray(job.postIds)) {
      await prisma.post
        .update({ where: { id: pid }, data: { status: "failed", error: st.error || "Render de video falló." } })
        .catch(() => {});
    }
    return "failed";
  }
  return "rendering";
}

/** Cierra por externalId (para el webhook de JSON2Video). */
export async function settleByExternalId(externalId: string, videoUrl?: string): Promise<void> {
  const job = await prisma.renderJob.findFirst({ where: { externalId, status: "rendering" } });
  if (!job) return;
  if (videoUrl) {
    await attachVideo(job.id, videoUrl);
  } else {
    await settleJob(job.id);
  }
}

/** Cierra todos los renders pendientes (fallback por sondeo, ej. desde el cron). */
export async function settlePendingRenders(limit = 20): Promise<{ settled: number }> {
  const jobs = await prisma.renderJob.findMany({
    where: { status: "rendering" },
    take: limit,
  });
  let settled = 0;
  for (const j of jobs) {
    const s = await settleJob(j.id);
    if (s === "done" || s === "failed") settled++;
  }
  return { settled };
}
