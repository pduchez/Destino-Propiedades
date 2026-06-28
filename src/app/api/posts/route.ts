import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const network = url.searchParams.get("network");
  const projectId = url.searchParams.get("projectId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (network) where.network = network;
  if (projectId) where.projectId = projectId;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      project: { select: { name: true } },
      campaign: { select: { name: true } },
      metric: true,
    },
  });

  // Adjunta los assets de cada post
  const allAssetIds = new Set<string>();
  for (const p of posts) {
    try {
      (JSON.parse(p.assetIds) as string[]).forEach((id) => allAssetIds.add(id));
    } catch {
      /* ignore */
    }
  }
  const assets = allAssetIds.size
    ? await prisma.asset.findMany({ where: { id: { in: [...allAssetIds] } } })
    : [];
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const enriched = posts.map((p) => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(p.assetIds) as string[];
    } catch {
      /* ignore */
    }
    return {
      ...p,
      assets: ids.map((id) => assetMap.get(id)).filter(Boolean),
    };
  });

  return json(enriched);
});

export const dynamic = "force-dynamic";
