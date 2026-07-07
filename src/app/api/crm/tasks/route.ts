import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

/** GET /api/crm/tasks — tareas/follow-ups pendientes (vencidas primero). */
export const GET = crmRoute(async () => {
  const user = await requireUser();
  const tasks = await prisma.activity.findMany({
    where: { type: "tarea", done: false, lead: leadScope(user) },
    orderBy: { dueAt: "asc" },
    include: {
      lead: { select: { id: true, name: true, stage: true, phone: true } },
      user: { select: { username: true, displayName: true } },
    },
    take: 200,
  });
  return Response.json({ tasks });
});
