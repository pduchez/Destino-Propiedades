/**
 * Orquestación de generación: a partir de un proyecto/campaña y un conjunto de
 * redes, genera borradores (Post) combinando copy de IA + imagen aleatoria del stock.
 */
import { prisma } from "@/lib/db";
import { parseArray, stringify } from "@/lib/json";
import { isNetwork, NETWORK_META, type Network } from "@/lib/networks";
import { generateCopy } from "@/lib/ai/generate";
import type {
  BrandContext,
  ProjectContext,
  CampaignContext,
} from "@/lib/ai/prompts";

export interface GenerateRequest {
  projectId?: string | null;
  campaignId?: string | null;
  networks: string[];
  /** Cuántos borradores por red (por defecto 1). */
  countPerNetwork?: number;
  /** Adjuntar imagen del stock automáticamente (por defecto true). */
  attachImage?: boolean;
}

export interface GeneratedPostSummary {
  id: string;
  network: Network;
  usedAI: boolean;
}

async function loadBrand(): Promise<BrandContext> {
  const b = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
  return {
    brandName: b?.brandName ?? "Destino Propiedades",
    portalUrl: b?.portalUrl ?? "https://destinopropiedades.com",
    mission: b?.mission ?? "",
    toneOfVoice: b?.toneOfVoice ?? "",
    targetAudience: b?.targetAudience ?? "",
    generalInstructions: b?.generalInstructions ?? "",
    defaultHashtags: parseArray(b?.defaultHashtags),
    language: b?.language ?? "es",
  };
}

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;

/** Elige una imagen/video aleatorio del stock para un proyecto y red. */
async function pickRandomAsset(
  projectId: string | null,
  network: Network,
): Promise<string | null> {
  // Stock disponible: del proyecto + globales (projectId null).
  const where = projectId
    ? { OR: [{ projectId }, { projectId: null }] }
    : { projectId: null };
  const assets = await prisma.asset.findMany({ where });
  if (assets.length === 0) return null;

  // TikTok prefiere video.
  let pool = assets;
  if (network === "tiktok") {
    const videos = assets.filter((a) => VIDEO_EXT.test(a.filename));
    if (videos.length) pool = videos;
  } else {
    const images = assets.filter((a) => a.mimeType.startsWith("image/"));
    if (images.length) pool = images;
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen.id;
}

export async function generateDrafts(
  req: GenerateRequest,
): Promise<GeneratedPostSummary[]> {
  const networks = req.networks.filter(isNetwork) as Network[];
  if (networks.length === 0) throw new Error("Selecciona al menos una red válida.");

  const brand = await loadBrand();

  const project = req.projectId
    ? await prisma.project.findUnique({ where: { id: req.projectId } })
    : null;
  const campaign = req.campaignId
    ? await prisma.campaign.findUnique({ where: { id: req.campaignId } })
    : null;

  const projectCtx: ProjectContext | null = project
    ? {
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
      }
    : null;

  const campaignCtx: CampaignContext | null = campaign
    ? {
        name: campaign.name,
        objective: campaign.objective,
        instructions: campaign.instructions,
      }
    : null;

  const count = Math.min(Math.max(req.countPerNetwork ?? 1, 1), 5);
  const attachImage = req.attachImage ?? true;
  const results: GeneratedPostSummary[] = [];

  for (const network of networks) {
    for (let i = 0; i < count; i++) {
      const assetId = attachImage
        ? await pickRandomAsset(project?.id ?? null, network)
        : null;

      let imageHint: string | null = null;
      if (assetId) {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        const tags = parseArray(asset?.tags);
        imageHint = tags.length
          ? tags.join(", ")
          : asset?.originalName || null;
      }

      const copy = await generateCopy({
        brand,
        project: projectCtx,
        campaign: campaignCtx,
        network,
        imageHint,
      });

      const post = await prisma.post.create({
        data: {
          projectId: project?.id ?? null,
          campaignId: campaign?.id ?? null,
          network,
          status: "draft",
          caption: copy.caption,
          hashtags: stringify(copy.hashtags),
          callToAction: copy.callToAction,
          assetIds: stringify(assetId ? [assetId] : []),
          model: copy.model,
        },
      });

      results.push({ id: post.id, network, usedAI: copy.usedAI });
    }
  }

  return results;
}

/** Aviso si una red requiere video pero el stock no lo tiene. */
export function networkRequiresVideo(network: Network): boolean {
  return NETWORK_META[network].requiresVideo;
}
