/**
 * Informe de impacto por red social y por proyecto.
 * GET ?days=7 -> agrega las métricas de los posts del período.
 */
import { json, withAuth } from "@/lib/api";
import { buildReport, lastDays } from "@/lib/metrics";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "7", 10) || 7, 1), 365);
  const { since, until } = lastDays(days);
  const report = await buildReport(since, until);
  return json({ days, report });
});

export const dynamic = "force-dynamic";
