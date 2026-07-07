import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";
import { whatsappConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

function assertAdmin(role: string) {
  if (role !== "admin") throw new HttpError("Sólo el director", 403);
}

/** GET — programaciones + teléfonos de vendedores + estado de WhatsApp. */
export const GET = crmRoute(async () => {
  const user = await requireUser();
  assertAdmin(user.role);
  const schedules = await prisma.reportSchedule.findMany({ orderBy: { createdAt: "asc" } });
  const sellers = await prisma.user.findMany({
    where: { role: "sales" },
    select: { id: true, username: true, displayName: true, phone: true },
    orderBy: { username: "asc" },
  });
  return Response.json({ schedules, sellers, whatsappReady: whatsappConfigured() });
});

/** POST — crea o actualiza una programación. */
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  assertAdmin(user.role);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data = {
    kind: String(b.kind || "director_summary"),
    period: String(b.period || "daily"),
    hour: Math.max(0, Math.min(23, Number(b.hour) || 7)),
    channel: "whatsapp",
    destination: String(b.destination || ""),
    enabled: b.enabled !== false,
  };
  const id = b.id ? String(b.id) : "";
  const schedule = id
    ? await prisma.reportSchedule.update({ where: { id }, data })
    : await prisma.reportSchedule.create({ data });
  return Response.json({ schedule });
});

/** DELETE ?id= — elimina una programación. */
export const DELETE = crmRoute(async (req: Request) => {
  const user = await requireUser();
  assertAdmin(user.role);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError("Falta id", 400);
  await prisma.reportSchedule.delete({ where: { id } });
  return Response.json({ ok: true });
});
