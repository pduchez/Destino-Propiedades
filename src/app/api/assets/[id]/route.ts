import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { deleteStored } from "@/lib/storage";

type Ctx = { params: { id: string } };

export const PATCH = withAuth(async (req, { params }: Ctx) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags)
      ? (body.tags as unknown[]).map(String)
      : String(body.tags)
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
    data.tags = stringify(tags);
  }
  if (typeof body.projectId === "string" || body.projectId === null) {
    data.projectId = body.projectId || null;
  }
  const asset = await prisma.asset.update({ where: { id: params.id }, data });
  return json(asset);
});

export const DELETE = withAuth(async (_req, { params }: Ctx) => {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) return errorJson("Asset no encontrado", 404);
  await deleteStored(asset.filename);
  await prisma.asset.delete({ where: { id: params.id } });
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
