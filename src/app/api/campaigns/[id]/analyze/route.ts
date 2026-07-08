import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { parseArray, stringify } from "@/lib/json";
import { analyzeCampaign, type MetricsAgg } from "@/lib/ai/campaignAnalysis";
import { researchTrends } from "@/lib/ai/trends";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

type Ctx = { params: { id: string } };

/** Agrega las métricas de una lista de posts (con su PostMetric). */
async function metricsForCampaign(campaignId: string): Promise<MetricsAgg> {
  const posts = await prisma.post.findMany({
    where: { campaignId },
    include: { metric: true },
  });
  const agg: MetricsAgg = {
    posts: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0, clicks: 0,
  };
  for (const p of posts) {
    if (!p.metric) continue;
    agg.likes += p.metric.likes;
    agg.comments += p.metric.comments;
    agg.shares += p.metric.shares;
    agg.impressions += p.metric.impressions;
    agg.reach += p.metric.reach;
    agg.clicks += p.metric.clicks;
  }
  return agg;
}

/** POST — Claude analiza la campaña y guarda el análisis (log). */
export const POST = withAuth(async (_req, { params }: Ctx) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!campaign) return errorJson("Campaña no encontrada", 404);

  const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });

  // Campañas anteriores del mismo proyecto (o globales si esta es global).
  const siblings = await prisma.campaign.findMany({
    where: {
      id: { not: campaign.id },
      projectId: campaign.projectId,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const previous = [];
  for (const s of siblings) {
    previous.push({
      name: s.name,
      objective: s.objective,
      instructions: s.instructions,
      metrics: await metricsForCampaign(s.id),
    });
  }

  // Tendencias del mercado (best-effort).
  let trends: string[] = [];
  try {
    const brief = await researchTrends(
      brand?.brandName || "Destino Propiedades",
      `Bienes raíces El Salvador. Proyecto: ${campaign.project?.name || "institucional"}. Objetivo: ${campaign.objective}.`,
    );
    trends = [brief.brief, brief.instructionDelta].filter(Boolean);
  } catch {
    trends = [];
  }

  const analysis = await analyzeCampaign({
    brandName: brand?.brandName || "Destino Propiedades",
    learnings: brand?.learnings || "",
    campaign: {
      name: campaign.name,
      objective: campaign.objective,
      instructions: campaign.instructions,
      networks: parseArray(campaign.networks),
      status: campaign.status,
      projectName: campaign.project?.name || "Institucional",
    },
    metricsSelf: await metricsForCampaign(campaign.id),
    previous,
    trends,
  });

  const saved = await prisma.campaignAnalysis.create({
    data: {
      campaignId: campaign.id,
      summary: analysis.summary,
      comparison: analysis.comparison,
      recommendations: stringify(analysis.recommendations),
    },
  });

  return json({ analysis, analysisId: saved.id });
});

/** GET — historial (log) de análisis de la campaña. */
export const GET = withAuth(async (_req, { params }: Ctx) => {
  const list = await prisma.campaignAnalysis.findMany({
    where: { campaignId: params.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return json(list);
});
