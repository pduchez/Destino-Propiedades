import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";

type Ctx = { params: { id: string } };

export const GET = withAuth(async (_req, { params }: Ctx) => {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { campaigns: true, assets: true },
  });
  if (!project) return errorJson("Proyecto no encontrado", 404);
  return json(project);
});

export const PATCH = withAuth(async (req, { params }: Ctx) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of [
    "name",
    "location",
    "propertyType",
    "status",
    "priceFrom",
    "currency",
    "description",
    "websiteUrl",
    "contactInfo",
    "instructionDoc",
  ]) {
    if (typeof body[k] === "string") data[k] = body[k];
  }
  for (const k of ["amenities", "highlights", "hashtags"]) {
    if (body[k] !== undefined) data[k] = stringify(toArray(body[k]));
  }
  const project = await prisma.project.update({
    where: { id: params.id },
    data,
  });
  return json(project);
});

export const DELETE = withAuth(async (_req, { params }: Ctx) => {
  await prisma.project.delete({ where: { id: params.id } });
  return json({ ok: true });
});

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string")
    return v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

export const dynamic = "force-dynamic";
