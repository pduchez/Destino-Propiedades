/**
 * Generación de reportes del CRM en 3 periodicidades, cada una pensada para un
 * objetivo distinto de seguimiento:
 *
 *  - daily   (día a día): ¿qué requiere ACCIÓN HOY para no perder prospectos?
 *            follow-ups vencidos, tareas de hoy, leads nuevos sin contactar y
 *            leads calientes que se están enfriando.
 *  - weekly  (semana a semana): salud del embudo — nuevos por fuente, avances
 *            de etapa, leads estancados, cierres de la semana.
 *  - monthly (mes a mes): resultados — ventas y valor cerrado, conversión,
 *            ranking de vendedores y demanda por proyecto.
 */
import { prisma } from "@/lib/db";
import { leadScore, STAGE_LABEL, OPEN_STAGES, SOURCE_LABEL } from "@/lib/crm";

export type Period = "daily" | "weekly" | "monthly";

export interface ReportSection {
  label: string;
  value: string;
  tone?: "danger" | "ok" | "muted";
  items?: string[];
}
export interface Report {
  period: Period;
  title: string;
  subtitle: string;
  sections: ReportSection[];
  text: string; // versión de texto plano (para WhatsApp)
}

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const PERIOD_LABEL: Record<Period, string> = {
  daily: "Reporte diario",
  weekly: "Reporte semanal",
  monthly: "Reporte mensual",
};

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "daily") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "weekly") {
    const d = new Date(now);
    const dow = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - dow);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Construye un reporte para un alcance dado (todo el equipo si scope={}, o un
 * vendedor si scope={assignedToId}). `who` es el nombre para el encabezado.
 */
export async function buildReport(
  period: Period,
  scope: { assignedToId?: string },
  who: string,
): Promise<Report> {
  const now = new Date();
  const start = periodStart(period);
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leads = await prisma.lead.findMany({
    where: scope,
    select: {
      id: true, name: true, stage: true, value: true, source: true,
      lastContactAt: true, createdAt: true, updatedAt: true, projectName: true,
      nextActionAt: true,
    },
  });

  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage));
  const sections: ReportSection[] = [];

  if (period === "daily") {
    // Follow-ups vencidos (tareas no hechas con fecha pasada).
    const overdue = await prisma.activity.findMany({
      where: { type: "tarea", done: false, dueAt: { lt: startDay }, lead: scope },
      include: { lead: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 20,
    });
    const todayTasks = await prisma.activity.count({
      where: {
        type: "tarea", done: false,
        dueAt: { gte: startDay, lt: new Date(startDay.getTime() + 86400000) },
        lead: scope,
      },
    });
    // Leads nuevos sin contactar (etapa nuevo, sin contacto en 2+ días).
    const sinContactar = open.filter(
      (l) =>
        l.stage === "nuevo" &&
        (!l.lastContactAt || Date.now() - new Date(l.lastContactAt).getTime() > 2 * 86400000),
    );
    // Leads calientes enfriándose (score alto pero sin actividad 3+ días).
    const enfriando = open
      .map((l) => ({ l, s: leadScore(l) }))
      .filter(
        ({ l, s }) =>
          s >= 65 &&
          l.lastContactAt &&
          Date.now() - new Date(l.lastContactAt).getTime() > 3 * 86400000,
      )
      .map(({ l }) => l);

    sections.push({
      label: "🚨 Follow-ups vencidos",
      value: String(overdue.length),
      tone: overdue.length ? "danger" : "ok",
      items: overdue.map((o) => `${o.lead.name}: ${o.body}`),
    });
    sections.push({ label: "⏰ Tareas para hoy", value: String(todayTasks) });
    sections.push({
      label: "🆕 Nuevos sin contactar",
      value: String(sinContactar.length),
      tone: sinContactar.length ? "danger" : "ok",
      items: sinContactar.map((l) => l.name),
    });
    sections.push({
      label: "🌡️ Calientes enfriándose (3+ días sin contacto)",
      value: String(enfriando.length),
      tone: enfriando.length ? "danger" : "ok",
      items: enfriando.map((l) => `${l.name} — ${l.projectName || "s/proyecto"}`),
    });
  } else if (period === "weekly") {
    const nuevos = leads.filter((l) => new Date(l.createdAt) >= start);
    const bySource: Record<string, number> = {};
    for (const l of nuevos) bySource[l.source] = (bySource[l.source] || 0) + 1;
    // Avances de etapa esta semana.
    const avances = await prisma.activity.count({
      where: { type: "etapa", createdAt: { gte: start }, lead: scope },
    });
    // Visitas registradas esta semana.
    const visitas = await prisma.activity.count({
      where: { type: "visita", createdAt: { gte: start }, lead: scope },
    });
    // Estancados: abiertos sin movimiento 7+ días.
    const estancados = open.filter(
      (l) => Date.now() - new Date(l.updatedAt).getTime() > 7 * 86400000,
    );
    const cerradosSemana = leads.filter(
      (l) => ["ganado", "perdido"].includes(l.stage) && new Date(l.updatedAt) >= start,
    );
    const ganadosSemana = cerradosSemana.filter((l) => l.stage === "ganado");

    sections.push({
      label: "🆕 Nuevos esta semana",
      value: String(nuevos.length),
      items: Object.entries(bySource).map(([s, n]) => `${SOURCE_LABEL[s] ?? s}: ${n}`),
    });
    sections.push({ label: "📈 Avances de etapa", value: String(avances) });
    sections.push({ label: "🏠 Visitas registradas", value: String(visitas) });
    sections.push({
      label: "🐢 Leads estancados (7+ días)",
      value: String(estancados.length),
      tone: estancados.length ? "danger" : "ok",
      items: estancados.slice(0, 15).map((l) => `${l.name} — ${STAGE_LABEL[l.stage]}`),
    });
    sections.push({
      label: "🏆 Cerrados esta semana",
      value: `${ganadosSemana.length} ganados${
        cerradosSemana.length ? ` de ${cerradosSemana.length}` : ""
      }`,
    });
  } else {
    const ganadosMes = leads.filter(
      (l) => l.stage === "ganado" && new Date(l.updatedAt) >= start,
    );
    const cerradosMes = leads.filter(
      (l) => ["ganado", "perdido"].includes(l.stage) && new Date(l.updatedAt) >= start,
    );
    const valorGanado = ganadosMes.reduce((a, l) => a + l.value, 0);
    const conv = cerradosMes.length
      ? Math.round((ganadosMes.length / cerradosMes.length) * 100)
      : 0;
    const pipeline = open.reduce((a, l) => a + l.value, 0);
    const byProject: Record<string, number> = {};
    for (const l of leads) if (l.projectName) byProject[l.projectName] = (byProject[l.projectName] || 0) + 1;
    const topProjects = Object.entries(byProject).sort((a, b) => b[1] - a[1]).slice(0, 5);

    sections.push({ label: "🏆 Ventas cerradas (mes)", value: String(ganadosMes.length) });
    sections.push({ label: "💰 Valor cerrado", value: money(valorGanado) });
    sections.push({ label: "📊 Conversión del mes", value: `${conv}%` });
    sections.push({ label: "🔮 Valor del embudo abierto", value: money(pipeline) });
    sections.push({
      label: "🏗️ Demanda por proyecto",
      value: String(topProjects.length),
      items: topProjects.map(([p, n]) => `${p}: ${n}`),
    });
  }

  const title = PERIOD_LABEL[period];
  const subtitle = `${who} · ${now.toLocaleDateString("es-SV", { dateStyle: "full" })}`;
  return { period, title, subtitle, sections, text: reportText(title, subtitle, sections) };
}

/** Reporte del director (todo el equipo) con ranking de vendedores. */
export async function buildDirectorReport(period: Period): Promise<Report> {
  const base = await buildReport(period, {}, "Equipo completo");
  if (period === "monthly") {
    const sellers = await prisma.user.findMany({
      where: { role: "sales" },
      select: { id: true, username: true, displayName: true },
    });
    const grouped = await prisma.lead.groupBy({
      by: ["assignedToId", "stage"],
      _count: { _all: true },
      _sum: { value: true },
    });
    const ranking = sellers
      .map((u) => {
        const rows = grouped.filter((g) => g.assignedToId === u.id && g.stage === "ganado");
        return {
          name: u.displayName || u.username,
          won: rows.reduce((a, r) => a + r._count._all, 0),
          value: rows.reduce((a, r) => a + (r._sum.value ?? 0), 0),
        };
      })
      .sort((a, b) => b.won - a.won || b.value - a.value);
    base.sections.push({
      label: "👥 Ranking de vendedores",
      value: String(ranking.length),
      items: ranking.map((r, i) => `${["🥇", "🥈", "🥉"][i] ?? "•"} ${r.name}: ${r.won} ganados (${money(r.value)})`),
    });
    base.text = reportText(base.title, base.subtitle, base.sections);
  }
  return base;
}

/** Reporte de un vendedor (su cartera). */
export async function buildSellerReport(
  userId: string,
  who: string,
  period: Period = "daily",
): Promise<Report> {
  return buildReport(period, { assignedToId: userId }, who);
}

/** Convierte el reporte a texto plano para WhatsApp. */
export function reportText(title: string, subtitle: string, sections: ReportSection[]): string {
  const lines: string[] = [`*${title}*`, subtitle, ""];
  for (const s of sections) {
    lines.push(`${s.label}: *${s.value}*`);
    if (s.items && s.items.length) {
      for (const it of s.items.slice(0, 8)) lines.push(`   • ${it}`);
    }
  }
  lines.push("", "— DestinoPropiedades CRM");
  return lines.join("\n");
}
