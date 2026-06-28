/**
 * Autoevaluación de la estrategia general a partir del rendimiento real.
 * POST { days?, apply? }
 *   - Construye el informe del período (default 7 días).
 *   - Analiza con Claude (o heurística) qué funcionó y qué ajustar.
 *   - Guarda un StrategyReview.
 *   - Si apply=true, incorpora las recomendaciones a los "aprendizajes" de la
 *     marca, que se inyectan en la generación (autocorrección de la estrategia).
 * GET -> lista de evaluaciones anteriores.
 */
import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { buildReport, lastDays } from "@/lib/metrics";
import { evaluateStrategy } from "@/lib/ai/evaluate";
import { stringify } from "@/lib/json";

export const POST = withAuth(async (req) => {
  const body = (await req.json().catch(() => ({}))) as { days?: number; apply?: boolean };
  const days = Math.min(Math.max(body.days ?? 7, 1), 365);
  const { since, until } = lastDays(days);
  const report = await buildReport(since, until);

  const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
  const evaluation = await evaluateStrategy({
    report,
    brandName: brand?.brandName ?? "Destino Propiedades",
    masterInstruction: brand?.masterInstruction ?? "",
    existingLearnings: brand?.learnings ?? "",
  });

  const review = await prisma.strategyReview.create({
    data: {
      periodStart: since,
      periodEnd: until,
      scope: "global",
      summary: evaluation.summary,
      recommendations: evaluation.recommendations,
      metricsSnapshot: stringify(report),
      applied: !!body.apply,
    },
  });

  if (body.apply) {
    const stamp = new Date().toISOString().slice(0, 10);
    const prev = (brand?.learnings ?? "").trim();
    const block = `## Ajustes ${stamp} (basados en métricas)\n${evaluation.recommendations.trim()}`;
    const learnings = prev ? `${prev}\n\n${block}` : block;
    await prisma.brandStrategy.upsert({
      where: { id: "default" },
      create: { id: "default", learnings },
      update: { learnings },
    });
  }

  return json({ ok: true, review, evaluation, report, applied: !!body.apply });
});

export const GET = withAuth(async () => {
  const reviews = await prisma.strategyReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return json(reviews);
});

export const dynamic = "force-dynamic";
