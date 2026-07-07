/**
 * Motor de automatización de ARS (autonomía). Un "tick" diario decide qué
 * loops correr según la configuración y las fechas:
 *  - Generación diaria de borradores por proyecto/red (calendario rotativo).
 *  - Investigación quincenal de tendencias -> actualiza la instrucción.
 *  - Chequeo mensual de ventas -> pregunta al operador.
 * Diseñado para ejecutarse desde un cron diario (Vercel Cron).
 */
import { prisma } from "@/lib/db";
import { parseArray } from "@/lib/json";
import { isNetwork, type Network } from "@/lib/networks";
import { generateDrafts } from "@/lib/generation";
import { researchTrends } from "@/lib/ai/trends";

const DAY_MS = 24 * 60 * 60 * 1000;
const ALL_NETWORKS: Network[] = ["facebook", "instagram", "x", "tiktok"];

export interface TickResult {
  ran: string[];
  daily?: { projects: number; drafts: number };
  trends?: { usedAI: boolean };
  sales?: { period: string };
  skipped: string[];
}

async function getConfig() {
  return prisma.automation.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Ejecuta el tick de automatización. `force` ignora las fechas (para pruebas). */
export async function runTick(now = new Date(), force = false): Promise<TickResult> {
  const cfg = await getConfig();
  const ran: string[] = [];
  const skipped: string[] = [];
  const out: TickResult = { ran, skipped };

  // 1) GENERACIÓN DIARIA (autopiloto).
  if (cfg.autopilot && (force || !cfg.lastDailyRun || !sameDay(cfg.lastDailyRun, now))) {
    const r = await runDailyGeneration(now, parseArray(cfg.dailyNetworks), cfg.postsPerDay);
    out.daily = r;
    ran.push("daily");
    await prisma.automation.update({ where: { id: "default" }, data: { lastDailyRun: now } });
  } else skipped.push("daily");

  // 2) TENDENCIAS QUINCENALES -> actualización de instrucción.
  const trendsDue = force || !cfg.lastTrendsRun || now.getTime() - cfg.lastTrendsRun.getTime() >= 14 * DAY_MS;
  if (cfg.trendsLoop && trendsDue) {
    out.trends = await runTrendsUpdate(now, cfg.autoUpdateInstruction);
    ran.push("trends");
    await prisma.automation.update({ where: { id: "default" }, data: { lastTrendsRun: now } });
  } else skipped.push("trends");

  // 3) CHEQUEO MENSUAL DE VENTAS.
  const period = now.toISOString().slice(0, 7); // YYYY-MM
  if (force || now.getUTCDate() === cfg.salesCheckinDay) {
    const existing = await prisma.salesCheckin.findUnique({ where: { period } });
    if (!existing) {
      await prisma.salesCheckin.create({ data: { period } });
      out.sales = { period };
      ran.push("sales");
      await prisma.automation.update({ where: { id: "default" }, data: { lastSalesCheckin: now } });
    } else skipped.push("sales");
  } else skipped.push("sales");

  return out;
}

/** Calendario diario: por cada proyecto en autopiloto, elige red(es) del día. */
async function runDailyGeneration(
  now: Date,
  defaultNetworks: string[],
  postsPerDay: number,
): Promise<{ projects: number; drafts: number }> {
  const projects = await prisma.project.findMany({
    where: { status: "active", autoPost: true },
  });
  const dayIndex = Math.floor(now.getTime() / DAY_MS);
  const fallback = (defaultNetworks.filter(isNetwork) as Network[]);
  const baseNets = fallback.length ? fallback : ALL_NETWORKS;

  let drafts = 0;
  for (const p of projects) {
    const own = (parseArray(p.postNetworks).filter(isNetwork) as Network[]);
    const nets = own.length ? own : baseNets;
    // Rota la red del día para distribuir el calendario "según convenga".
    const perDay = Math.max(1, Math.min(postsPerDay, nets.length));
    const chosen: Network[] = [];
    for (let i = 0; i < perDay; i++) {
      chosen.push(nets[(dayIndex + i) % nets.length]);
    }
    const created = await generateDrafts({
      projectId: p.id,
      networks: chosen,
      countPerNetwork: 1,
      attachImage: true,
    });
    drafts += created.length;
  }
  return { projects: projects.length, drafts };
}

/** Investiga tendencias y las incorpora a los aprendizajes / la instrucción. */
async function runTrendsUpdate(now: Date, updateInstruction: boolean): Promise<{ usedAI: boolean }> {
  const brand = await prisma.brandStrategy.findUnique({ where: { id: "default" } });
  const projectCount = await prisma.project.count();
  const context = `Marca: ${brand?.brandName ?? "ARS"}. Portal: ${brand?.portalUrl ?? ""}. ${projectCount} proyectos inmobiliarios (lotificaciones en El Salvador). Objetivo: generar conversaciones de WhatsApp con compradores de alta intención.`;

  const trends = await researchTrends(brand?.brandName ?? "ARS", context);
  const stamp = now.toISOString().slice(0, 10);

  // Guarda el informe.
  await prisma.strategyReview.create({
    data: {
      periodStart: new Date(now.getTime() - 14 * DAY_MS),
      periodEnd: now,
      scope: "trends",
      summary: trends.brief,
      recommendations: trends.instructionDelta,
      applied: updateInstruction,
    },
  });

  // Incorpora a los aprendizajes (siempre) y, si procede, a la instrucción viva.
  const prevLearn = (brand?.learnings ?? "").trim();
  const block = `## Tendencias ${stamp}\n${trends.instructionDelta.trim()}`;
  const learnings = prevLearn ? `${prevLearn}\n\n${block}` : block;

  const data: { learnings: string; masterInstruction?: string } = { learnings };
  if (updateInstruction) {
    const mi = (brand?.masterInstruction ?? "").trim();
    const marker = "## Tendencias vigentes (autoactualizado)";
    const section = `${marker}\nActualizado ${stamp}. ${trends.brief.trim()}\nAjustes:\n${trends.instructionDelta.trim()}`;
    // Reemplaza la sección previa de tendencias si existe; si no, la añade.
    const idx = mi.indexOf(marker);
    data.masterInstruction = idx === -1 ? `${mi}\n\n${section}` : `${mi.slice(0, idx).trim()}\n\n${section}`;
  }

  await prisma.brandStrategy.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return { usedAI: trends.usedAI };
}
