import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";
import { buildDirectorReport, buildSellerReport, type Period } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { sendWhatsApp } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * POST { kind, period, destination } — genera el reporte AHORA y lo envía
 * (o lo devuelve en vista previa si WhatsApp no está configurado).
 */
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError("Sólo el director", 403);
  const b = (await req.json().catch(() => ({}))) as {
    kind?: string;
    period?: Period;
    destination?: string;
  };
  const period = (b.period || "daily") as Period;

  if (b.kind === "seller_portfolio") {
    const sellers = await prisma.user.findMany({ where: { role: "sales" } });
    const results = [];
    for (const s of sellers) {
      const report = await buildSellerReport(s.id, s.displayName || s.username, period);
      const r = s.phone
        ? await sendWhatsApp(s.phone, report.text)
        : { delivered: false, preview: false, to: "(sin teléfono)", text: report.text };
      results.push({ seller: s.displayName || s.username, ...r });
    }
    return Response.json({ results });
  }

  const report = await buildDirectorReport(period);
  const r = await sendWhatsApp(b.destination || "", report.text);
  return Response.json({ result: r, text: report.text });
});
