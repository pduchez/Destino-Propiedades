import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { isNetwork } from "@/lib/networks";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const campaigns = await prisma.campaign.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true } } },
  });
  return json(campaigns);
});

export const POST = withAuth(async (req) => {
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return errorJson("El nombre es obligatorio.");

  const networks = Array.isArray(body.networks)
    ? (body.networks as unknown[]).map(String).filter(isNetwork)
    : [];

  const campaign = await prisma.campaign.create({
    data: {
      projectId: body.projectId ? String(body.projectId) : null,
      name,
      objective: String(body.objective ?? "awareness"),
      instructions: String(body.instructions ?? ""),
      networks: stringify(networks),
      status: String(body.status ?? "active"),
      startDate: body.startDate ? new Date(String(body.startDate)) : null,
      endDate: body.endDate ? new Date(String(body.endDate)) : null,
    },
  });
  return json(campaign, 201);
});
