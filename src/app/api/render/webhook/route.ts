/**
 * Webhook de JSON2Video: se llama cuando un render termina.
 * No usa la sesión del dashboard (lo llama un servidor externo). Se valida por
 * `?key=CRON_SECRET` si está configurado, y siempre se resuelve por el id del
 * render (externalId), que es no adivinable.
 */
import { json, errorJson } from "@/lib/api";
import { settleByExternalId } from "@/lib/video/render";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret && url.searchParams.get("key") !== secret) {
    return errorJson("No autorizado", 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    project?: string;
    id?: string;
    movie?: { status?: string; url?: string };
    status?: string;
    url?: string;
  };
  const externalId = body.project || body.id;
  if (!externalId) return errorJson("Falta el id del render.");

  const videoUrl = body.movie?.url || body.url;
  await settleByExternalId(externalId, videoUrl);
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
