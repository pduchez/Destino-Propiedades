/**
 * Métricas de impacto por post (estilo Meta Business).
 * POST { postId, likes, comments, shares, impressions, reach, clicks, saves, source }
 *   -> registra/actualiza el snapshot de métricas del post (entrada manual hoy;
 *      en Fase 2 lo llenarán las APIs de cada red automáticamente).
 * GET ?postId=... -> métrica de un post (o null).
 */
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";

const FIELDS = ["likes", "comments", "shares", "impressions", "reach", "clicks", "saves"] as const;

export const POST = withAuth(async (req) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const postId = typeof body.postId === "string" ? body.postId : "";
  if (!postId) return errorJson("Falta postId.");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return errorJson("Post no encontrado", 404);

  const nums: Record<string, number> = {};
  for (const f of FIELDS) {
    const v = body[f];
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    nums[f] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  const source = typeof body.source === "string" ? body.source : "manual";

  const metric = await prisma.postMetric.upsert({
    where: { postId },
    create: { postId, ...nums, source, capturedAt: new Date() },
    update: { ...nums, source, capturedAt: new Date() },
  });

  return json({ ok: true, metric });
});

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const postId = url.searchParams.get("postId");
  if (!postId) return errorJson("Falta postId.");
  const metric = await prisma.postMetric.findUnique({ where: { postId } });
  return json({ metric });
});

export const dynamic = "force-dynamic";
