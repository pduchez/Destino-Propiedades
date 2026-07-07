import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute, HttpError } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** POST — agrega una actividad (WhatsApp, nota, tarea, etc.) al lead. */
export const POST = crmRoute(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, ...leadScope(user) },
  });
  if (!lead) throw new HttpError("Lead no encontrado", 404);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const type = String(body.type || "nota");
  const text = String(body.body || "").trim();
  if (!text) throw new HttpError("El contenido no puede estar vacío", 400);

  const activity = await prisma.activity.create({
    data: {
      leadId: lead.id,
      userId: user.id,
      type,
      body: text,
      dueAt: body.dueAt ? new Date(body.dueAt as string) : null,
    },
  });

  // Una actividad de contacto actualiza "último contacto"; una tarea con fecha
  // fija la próxima acción del lead (clave para los reportes de seguimiento).
  const leadPatch: Record<string, unknown> = { lastContactAt: new Date() };
  if (type === "tarea" && body.dueAt) {
    leadPatch.nextActionAt = new Date(body.dueAt as string);
    leadPatch.nextActionNote = text;
  }
  await prisma.lead.update({ where: { id: lead.id }, data: leadPatch });

  return Response.json({ activity }, { status: 201 });
});

/** PATCH — marca una tarea como completada. Body: { activityId, done } */
export const PATCH = crmRoute(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, ...leadScope(user) },
  });
  if (!lead) throw new HttpError("Lead no encontrado", 404);

  const body = (await req.json().catch(() => ({}))) as {
    activityId?: string;
    done?: boolean;
  };
  if (!body.activityId) throw new HttpError("Falta activityId", 400);
  await prisma.activity.update({
    where: { id: body.activityId },
    data: { done: body.done ?? true },
  });
  return Response.json({ ok: true });
});
