/**
 * Cron horario que despacha los reportes programados del CRM. Independiente del
 * login del panel: se autoriza con CRON_SECRET (Vercel Cron), igual que el tick
 * de ARS. ?force=1 envía todo de inmediato (para pruebas).
 */
import { json, errorJson } from "@/lib/api";
import { runDueSchedules } from "@/lib/reportDispatch";

function cronAuthorized(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true;
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization") || "";
  return bearer === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

async function handle(req: Request) {
  if (!cronAuthorized(req)) return errorJson("No autorizado", 401);
  const force = new URL(req.url).searchParams.get("force") === "1";
  const result = await runDueSchedules(new Date(), force);
  return json({ ok: true, at: new Date().toISOString(), result });
}

export const GET = handle;
export const POST = handle;
export const dynamic = "force-dynamic";
