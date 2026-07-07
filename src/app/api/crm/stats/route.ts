import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute } from "@/lib/crmServer";
import { STAGES, OPEN_STAGES } from "@/lib/crm";

export const dynamic = "force-dynamic";

/** GET /api/crm/stats — agregados para el tablero, según el rol. */
export const GET = crmRoute(async () => {
  const user = await requireUser();
  const scope = leadScope(user);
  const isAdmin = user.role === "admin";

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Conteo por etapa (embudo).
  const byStageRaw = await prisma.lead.groupBy({
    by: ["stage"],
    where: scope,
    _count: { _all: true },
    _sum: { value: true },
  });
  const byStage = STAGES.map((s) => {
    const r = byStageRaw.find((x) => x.stage === s.key);
    return { ...s, count: r?._count._all ?? 0, value: r?._sum.value ?? 0 };
  });

  const openLeads = byStage
    .filter((s) => OPEN_STAGES.includes(s.key))
    .reduce((a, s) => a + s.count, 0);
  const pipelineValue = byStage
    .filter((s) => OPEN_STAGES.includes(s.key))
    .reduce((a, s) => a + s.value, 0);
  const won = byStage.find((s) => s.key === "ganado");
  const lost = byStage.find((s) => s.key === "perdido");
  const totalClosed = (won?.count ?? 0) + (lost?.count ?? 0);
  const conversion = totalClosed > 0 ? (won!.count / totalClosed) * 100 : 0;

  // Ganados / perdidos del mes.
  const wonThisMonth = await prisma.lead.aggregate({
    where: { ...scope, stage: "ganado", updatedAt: { gte: startMonth } },
    _count: { _all: true },
    _sum: { value: true },
  });

  // Tareas: vencidas y de hoy (seguimiento).
  const overdueTasks = await prisma.activity.count({
    where: {
      type: "tarea",
      done: false,
      dueAt: { lt: startDay },
      lead: scope,
    },
  });
  const todayTasks = await prisma.activity.count({
    where: {
      type: "tarea",
      done: false,
      dueAt: { gte: startDay, lt: new Date(startDay.getTime() + 86400000) },
      lead: scope,
    },
  });

  // Por fuente.
  const bySourceRaw = await prisma.lead.groupBy({
    by: ["source"],
    where: scope,
    _count: { _all: true },
  });
  const bySource = bySourceRaw
    .map((r) => ({ source: r.source, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  // Por proyecto (top 6).
  const byProjectRaw = await prisma.lead.groupBy({
    by: ["projectName"],
    where: { ...scope, projectName: { not: "" } },
    _count: { _all: true },
  });
  const byProject = byProjectRaw
    .map((r) => ({ project: r.projectName, count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Ranking de vendedores (sólo director).
  let byVendor: {
    userId: string | null;
    name: string;
    open: number;
    won: number;
    value: number;
  }[] = [];
  if (isAdmin) {
    const users = await prisma.user.findMany({
      where: { role: "sales" },
      select: { id: true, username: true, displayName: true },
    });
    const grouped = await prisma.lead.groupBy({
      by: ["assignedToId", "stage"],
      _count: { _all: true },
      _sum: { value: true },
    });
    byVendor = users
      .map((u) => {
        const rows = grouped.filter((g) => g.assignedToId === u.id);
        const open = rows
          .filter((r) => OPEN_STAGES.includes(r.stage))
          .reduce((a, r) => a + r._count._all, 0);
        const wonRows = rows.filter((r) => r.stage === "ganado");
        return {
          userId: u.id,
          name: u.displayName || u.username,
          open,
          won: wonRows.reduce((a, r) => a + r._count._all, 0),
          value: wonRows.reduce((a, r) => a + (r._sum.value ?? 0), 0),
        };
      })
      .sort((a, b) => b.won - a.won || b.value - a.value);
  }

  return Response.json({
    role: user.role,
    kpis: {
      openLeads,
      pipelineValue,
      wonThisMonthCount: wonThisMonth._count._all,
      wonThisMonthValue: wonThisMonth._sum.value ?? 0,
      conversion: Math.round(conversion),
      overdueTasks,
      todayTasks,
      lostTotal: lost?.count ?? 0,
    },
    byStage,
    bySource,
    byProject,
    byVendor,
  });
});
