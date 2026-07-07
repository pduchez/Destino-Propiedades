/**
 * Chequeo mensual de ventas: ARS pregunta cómo van las ventas para
 * retroalimentar la instrucción con efectividad real.
 * GET  -> chequeos (el más reciente primero); incluye si hay uno pendiente.
 * POST { period, salesNote } -> responde y alimenta los aprendizajes de la marca.
 */
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";

export const GET = withAuth(async () => {
  const checkins = await prisma.salesCheckin.findMany({
    orderBy: { askedAt: "desc" },
    take: 12,
  });
  const pending = checkins.find((c) => !c.answered) ?? null;
  return json({ pending, checkins });
});

export const POST = withAuth(async (req) => {
  const body = (await req.json()) as { period?: string; salesNote?: string };
  if (!body.period) return errorJson("Falta el período (YYYY-MM).");
  const salesNote = (body.salesNote || "").trim();

  const checkin = await prisma.salesCheckin.upsert({
    where: { period: body.period },
    create: { period: body.period, answered: true, salesNote, answeredAt: new Date() },
    update: { answered: true, salesNote, answeredAt: new Date() },
  });

  // Retroalimenta la estrategia: incorpora el pulso de ventas a los aprendizajes.
  if (salesNote) {
    const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
    const prev = (brand?.learnings ?? "").trim();
    const block = `## Ventas ${body.period} (retroalimentación del operador)\n${salesNote}`;
    const learnings = prev ? `${prev}\n\n${block}` : block;
    await prisma.brandStrategy.upsert({
      where: { id: "default" },
      create: { id: "default", learnings },
      update: { learnings },
    });
  }

  return json({ ok: true, checkin });
});

export const dynamic = "force-dynamic";
