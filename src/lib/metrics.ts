/**
 * Agregación de métricas de impacto (estilo Meta Business): suma likes,
 * comentarios, compartidos/reposts, impresiones, alcance, clics y guardados
 * por red social y por proyecto, en un período. Sirve al informe semanal y a
 * la autoevaluación de la estrategia.
 */
import { prisma } from "@/lib/db";

export interface MetricTotals {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  /** Interacciones / impresiones (0–1). null si no hay impresiones. */
  engagement: number | null;
}

export interface NetworkAgg extends MetricTotals {
  network: string;
}
export interface ProjectAgg extends MetricTotals {
  projectId: string | null;
  projectName: string;
}

export interface MetricsReport {
  since: string;
  until: string;
  totals: MetricTotals;
  byNetwork: NetworkAgg[];
  byProject: ProjectAgg[];
  /** Post de mejor desempeño (por interacciones), si hay datos. */
  topPosts: {
    id: string;
    network: string;
    project: string;
    caption: string;
    likes: number;
    shares: number;
    impressions: number;
    engagement: number | null;
  }[];
}

function emptyTotals(): MetricTotals {
  return {
    posts: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    saves: 0,
    engagement: null,
  };
}

function add(t: MetricTotals, m: { likes: number; comments: number; shares: number; impressions: number; reach: number; clicks: number; saves: number }) {
  t.posts += 1;
  t.likes += m.likes;
  t.comments += m.comments;
  t.shares += m.shares;
  t.impressions += m.impressions;
  t.reach += m.reach;
  t.clicks += m.clicks;
  t.saves += m.saves;
}

function finalize<T extends MetricTotals>(t: T): T {
  const interactions = t.likes + t.comments + t.shares + t.saves + t.clicks;
  t.engagement = t.impressions > 0 ? interactions / t.impressions : null;
  return t;
}

/** Construye el informe de un período (por defecto, últimos 7 días). */
export async function buildReport(since: Date, until: Date): Promise<MetricsReport> {
  // Posts con métrica registrada en el período (por fecha del post).
  const posts = await prisma.post.findMany({
    where: {
      metric: { isNot: null },
      OR: [
        { publishedAt: { gte: since, lte: until } },
        { AND: [{ publishedAt: null }, { createdAt: { gte: since, lte: until } }] },
      ],
    },
    include: { metric: true, project: { select: { name: true } } },
  });

  const totals = emptyTotals();
  const netMap = new Map<string, NetworkAgg>();
  const projMap = new Map<string, ProjectAgg>();

  for (const p of posts) {
    const m = p.metric!;
    add(totals, m);

    const net = netMap.get(p.network) ?? { network: p.network, ...emptyTotals() };
    add(net, m);
    netMap.set(p.network, net);

    const key = p.projectId ?? "__inst__";
    const proj =
      projMap.get(key) ??
      ({
        projectId: p.projectId,
        projectName: p.project?.name ?? "Institucional",
        ...emptyTotals(),
      } as ProjectAgg);
    add(proj, m);
    projMap.set(key, proj);
  }

  const topPosts = posts
    .map((p) => {
      const m = p.metric!;
      const interactions = m.likes + m.comments + m.shares + m.saves + m.clicks;
      return {
        id: p.id,
        network: p.network,
        project: p.project?.name ?? "Institucional",
        caption: p.caption.slice(0, 120),
        likes: m.likes,
        shares: m.shares,
        impressions: m.impressions,
        engagement: m.impressions > 0 ? interactions / m.impressions : null,
        interactions,
      };
    })
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 5)
    .map(({ interactions: _i, ...rest }) => rest);

  return {
    since: since.toISOString(),
    until: until.toISOString(),
    totals: finalize(totals),
    byNetwork: Array.from(netMap.values()).map(finalize),
    byProject: Array.from(projMap.values()).map(finalize),
    topPosts,
  };
}

/** Período por defecto: últimos `days` días hasta ahora. */
export function lastDays(days: number): { since: Date; until: Date } {
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { since, until };
}
