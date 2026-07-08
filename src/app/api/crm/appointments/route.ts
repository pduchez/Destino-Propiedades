import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

/** GET — citas: el vendedor ve las suyas, el director ve todas. */
export const GET = crmRoute(async () => {
  const user = await requireUser();
  const where = user.role === "admin" ? {} : { sellerId: user.id };
  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: { lead: { select: { id: true, name: true, phone: true, projectName: true } } },
    take: 300,
  });
  // Nombre del vendedor (para la vista del director).
  const sellerIds = [...new Set(appointments.map((a) => a.sellerId).filter(Boolean))] as string[];
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, username: true, displayName: true },
  });
  const sellerName: Record<string, string> = {};
  for (const s of sellers) sellerName[s.id] = s.displayName || s.username;
  return Response.json({ appointments, sellerName, role: user.role });
});

/** POST — crear cita manual (vendedor o director). */
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!b.leadId || !b.scheduledAt) throw new HttpError("Faltan leadId y fecha", 400);
  const appt = await prisma.appointment.create({
    data: {
      leadId: String(b.leadId),
      sellerId: user.role === "admin" && b.sellerId ? String(b.sellerId) : user.id,
      scheduledAt: new Date(String(b.scheduledAt)),
      location: String(b.location || ""),
      notes: String(b.notes || ""),
      createdBy: user.role === "admin" ? "director" : "seller",
    },
  });
  await prisma.activity.create({
    data: {
      leadId: String(b.leadId),
      userId: user.id,
      type: "visita",
      body: `📅 Cita agendada para ${new Date(String(b.scheduledAt)).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" })}.`,
    },
  });
  return Response.json({ appointment: appt }, { status: 201 });
});

/** PATCH — cambiar estado de una cita. Body: { id, status } */
export const PATCH = crmRoute(async (req: Request) => {
  await requireUser();
  const b = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!b.id) throw new HttpError("Falta id", 400);
  const appt = await prisma.appointment.update({
    where: { id: b.id },
    data: { status: b.status || "done" },
  });
  return Response.json({ appointment: appt });
});
