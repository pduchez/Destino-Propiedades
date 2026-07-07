import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

/** PATCH { userId, phone } — el director fija el WhatsApp de un vendedor. */
export const PATCH = crmRoute(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError("Sólo el director", 403);
  const b = (await req.json().catch(() => ({}))) as { userId?: string; phone?: string };
  if (!b.userId) throw new HttpError("Falta userId", 400);
  await prisma.user.update({
    where: { id: b.userId },
    data: { phone: String(b.phone || "").trim() },
  });
  return Response.json({ ok: true });
});
