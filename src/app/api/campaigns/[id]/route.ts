import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { isNetwork } from "@/lib/networks";

type Ctx = { params: { id: string } };

export const PATCH = withAuth(async (req, { params }: Ctx) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of ["name", "objective", "instructions", "status"]) {
    if (typeof body[k] === "string") data[k] = body[k];
  }
  if (Array.isArray(body.networks)) {
    data.networks = stringify((body.networks as unknown[]).map(String).filter(isNetwork));
  }
  if (body.startDate !== undefined)
    data.startDate = body.startDate ? new Date(String(body.startDate)) : null;
  if (body.endDate !== undefined)
    data.endDate = body.endDate ? new Date(String(body.endDate)) : null;

  const campaign = await prisma.campaign.update({ where: { id: params.id }, data });
  return json(campaign);
});

export const DELETE = withAuth(async (_req, { params }: Ctx) => {
  await prisma.campaign.delete({ where: { id: params.id } });
  return json({ ok: true });
});
