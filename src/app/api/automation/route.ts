/**
 * Configuración de automatización de ARS (singleton).
 * GET  -> configuración actual.
 * PATCH { autopilot?, dailyNetworks?, postsPerDay?, trendsLoop?,
 *         autoUpdateInstruction?, salesCheckinDay?, videoProvider? }
 */
import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { stringify, parseArray } from "@/lib/json";
import { isNetwork } from "@/lib/networks";

export const GET = withAuth(async () => {
  const cfg = await prisma.automation.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return json({ ...cfg, dailyNetworks: parseArray(cfg.dailyNetworks) });
});

export const PATCH = withAuth(async (req) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const k of ["autopilot", "trendsLoop", "autoUpdateInstruction"]) {
    if (typeof body[k] === "boolean") data[k] = body[k];
  }
  if (body.postsPerDay !== undefined) {
    const n = Number(body.postsPerDay);
    if (Number.isFinite(n)) data.postsPerDay = Math.min(Math.max(Math.round(n), 1), 4);
  }
  if (body.salesCheckinDay !== undefined) {
    const n = Number(body.salesCheckinDay);
    if (Number.isFinite(n)) data.salesCheckinDay = Math.min(Math.max(Math.round(n), 1), 28);
  }
  if (typeof body.videoProvider === "string") data.videoProvider = body.videoProvider;
  if (Array.isArray(body.dailyNetworks)) {
    data.dailyNetworks = stringify(body.dailyNetworks.map(String).filter(isNetwork));
  }

  const cfg = await prisma.automation.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
  return json({ ...cfg, dailyNetworks: parseArray(cfg.dailyNetworks) });
});

export const dynamic = "force-dynamic";
