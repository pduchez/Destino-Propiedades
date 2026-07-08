import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute, HttpError } from "@/lib/crmServer";
import { STAGE_LABEL } from "@/lib/crm";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

async function loadOwned(id: string, user: Awaited<ReturnType<typeof requireUser>>) {
  const lead = await prisma.lead.findFirst({
    where: { id, ...leadScope(user) },
  });
  if (!lead) throw new HttpError("Lead no encontrado", 404);
  return lead;
}

/** GET — detalle del lead + su línea de tiempo. */
export const GET = crmRoute(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, ...leadScope(user) },
    include: {
      assignedTo: { select: { id: true, username: true, displayName: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true, displayName: true } } },
      },
      appointments: { orderBy: { scheduledAt: "asc" } },
    },
  });
  if (!lead) throw new HttpError("Lead no encontrado", 404);
  return Response.json({ lead });
});

/** PATCH — actualiza campos; registra cambio de etapa en la línea de tiempo. */
export const PATCH = crmRoute(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const lead = await loadOwned(params.id, user);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  const fields = [
    "name",
    "phone",
    "email",
    "source",
    "projectSlug",
    "projectName",
    "budget",
    "temperature",
    "notes",
    "lostReason",
    "nextActionNote",
  ];
  for (const f of fields) if (f in body) data[f] = String(body[f] ?? "");
  if ("value" in body) data.value = Number(body.value) || 0;
  if ("nextActionAt" in body)
    data.nextActionAt = body.nextActionAt ? new Date(body.nextActionAt as string) : null;
  // Sólo el director reasigna vendedor.
  if ("assignedToId" in body && user.role === "admin")
    data.assignedToId = (body.assignedToId as string) || null;

  const stageChanged = "stage" in body && body.stage !== lead.stage;
  if (stageChanged) {
    data.stage = String(body.stage);
    data.lastContactAt = new Date();
  }

  const updated = await prisma.lead.update({ where: { id: lead.id }, data });

  if (stageChanged) {
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        type: "etapa",
        fromStage: lead.stage,
        toStage: String(body.stage),
        body: `Etapa: ${STAGE_LABEL[lead.stage] ?? lead.stage} → ${
          STAGE_LABEL[String(body.stage)] ?? body.stage
        }`,
      },
    });
  }
  return Response.json({ lead: updated });
});

/** DELETE — sólo el director puede eliminar leads. */
export const DELETE = crmRoute(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError("Sólo el director puede eliminar", 403);
  await prisma.lead.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
});
