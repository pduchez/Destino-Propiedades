/**
 * Motor de envío de reportes programados. Lo dispara el cron (cada hora). Para
 * cada programación habilitada evalúa si "toca" ahora (según periodicidad y la
 * hora elegida, en horario de El Salvador, UTC-6) y, de ser así, genera el
 * reporte y lo envía por WhatsApp, registrando lastRunAt para no duplicar.
 */
import { prisma } from "@/lib/db";
import { buildDirectorReport, buildSellerReport, type Period } from "@/lib/reports";
import { sendWhatsApp } from "@/lib/notify";

const SV_OFFSET_MS = 6 * 3600 * 1000; // El Salvador = UTC-6 (sin horario de verano)

/** Devuelve la "fecha/hora local" de El Salvador para un instante dado. */
function svParts(nowUtc: Date) {
  const local = new Date(nowUtc.getTime() - SV_OFFSET_MS);
  return {
    hour: local.getUTCHours(),
    dow: (local.getUTCDay() + 6) % 7, // lunes = 0
    dom: local.getUTCDate(),
    ymd: `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`,
    yw: `${local.getUTCFullYear()}-W${Math.floor(local.getUTCDate() / 7)}-${local.getUTCMonth()}`,
    ym: `${local.getUTCFullYear()}-${local.getUTCMonth()}`,
  };
}

/** ¿Ya se ejecutó dentro del periodo vigente? (evita duplicar). */
function alreadyRan(period: Period, lastRunAt: Date | null, now: Date): boolean {
  if (!lastRunAt) return false;
  const a = svParts(lastRunAt);
  const b = svParts(now);
  if (period === "daily") return a.ymd === b.ymd;
  if (period === "weekly") return a.yw === b.yw;
  return a.ym === b.ym;
}

/** ¿Corresponde enviar hoy según la periodicidad? (weekly=lunes, monthly=día 1). */
function dueToday(period: Period, now: Date): boolean {
  const p = svParts(now);
  if (period === "daily") return true;
  if (period === "weekly") return p.dow === 0;
  return p.dom === 1;
}

export interface DispatchResult {
  evaluated: number;
  sent: { kind: string; to: string; delivered: boolean; preview: boolean; error?: string }[];
}

export async function runDueSchedules(now = new Date(), force = false): Promise<DispatchResult> {
  const schedules = await prisma.reportSchedule.findMany({ where: { enabled: true } });
  const nowHour = svParts(now).hour;
  const sent: DispatchResult["sent"] = [];

  for (const sch of schedules) {
    const period = sch.period as Period;
    const hourMatch = force || sch.hour === nowHour;
    if (!hourMatch) continue;
    if (!force && !dueToday(period, now)) continue;
    if (!force && alreadyRan(period, sch.lastRunAt, now)) continue;

    if (sch.kind === "director_summary") {
      const report = await buildDirectorReport(period);
      const r = await sendWhatsApp(sch.destination, report.text);
      sent.push({ kind: sch.kind, to: r.to, delivered: r.delivered, preview: r.preview, error: r.error });
    } else if (sch.kind === "seller_portfolio") {
      const sellers = await prisma.user.findMany({ where: { role: "sales" } });
      for (const s of sellers) {
        if (!s.phone) {
          sent.push({ kind: sch.kind, to: `${s.username} (sin teléfono)`, delivered: false, preview: false, error: "Sin teléfono" });
          continue;
        }
        const report = await buildSellerReport(s.id, s.displayName || s.username, period);
        const r = await sendWhatsApp(s.phone, report.text);
        sent.push({ kind: `${sch.kind}:${s.username}`, to: r.to, delivered: r.delivered, preview: r.preview, error: r.error });
      }
    }
    await prisma.reportSchedule.update({ where: { id: sch.id }, data: { lastRunAt: now } });
  }
  return { evaluated: schedules.length, sent };
}
