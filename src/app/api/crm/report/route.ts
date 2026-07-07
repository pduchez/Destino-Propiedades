import { requireUser, crmRoute } from "@/lib/crmServer";
import { buildDirectorReport, buildSellerReport, type Period } from "@/lib/reports";

export const dynamic = "force-dynamic";

/** GET /api/crm/report?period=daily|weekly|monthly — reporte según el rol. */
export const GET = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const period = (new URL(req.url).searchParams.get("period") || "daily") as Period;
  const report =
    user.role === "admin"
      ? await buildDirectorReport(period)
      : await buildSellerReport(user.id, user.username, period);
  return Response.json({ report });
});
