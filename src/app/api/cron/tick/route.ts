/**
 * Punto de entrada del cron diario (Vercel Cron). Ejecuta el "tick" de
 * automatización de ARS. Corre SIN solicitud del operador.
 *
 * Autorización (cualquiera):
 *  - Vercel Cron / externo: header "Authorization: Bearer <CRON_SECRET>" o
 *    query ?key=<CRON_SECRET> (si CRON_SECRET está configurado).
 *  - Operador desde el tablero: sesión autorizada del dashboard.
 * ?force=1 ignora las fechas (para probar los loops de inmediato).
 */
import { json, errorJson } from "@/lib/api";
import { isAuthorized } from "@/lib/auth";
import { runTick } from "@/lib/automation";

function cronAuthorized(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true; // sin secreto configurado: permite (Vercel Cron interno)
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization") || "";
  return bearer === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

async function handle(req: Request) {
  if (!cronAuthorized(req) && !isAuthorized()) return errorJson("No autorizado", 401);
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const result = await runTick(new Date(), force);
  return json({ ok: true, at: new Date().toISOString(), result });
}

export const GET = handle;
export const POST = handle;
export const dynamic = "force-dynamic";
