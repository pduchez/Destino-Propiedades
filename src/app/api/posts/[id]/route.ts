import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { POST_STATUSES, type PostStatus } from "@/lib/networks";

type Ctx = { params: { id: string } };

/** PATCH: editar caption/hashtags/CTA, cambiar estado (aprobar/rechazar), programar. */
export const PATCH = withAuth(async (req, { params }: Ctx) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.caption === "string") data.caption = body.caption;
  if (typeof body.callToAction === "string") data.callToAction = body.callToAction;
  if (body.hashtags !== undefined) {
    const tags = Array.isArray(body.hashtags)
      ? (body.hashtags as unknown[]).map(String)
      : String(body.hashtags)
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`));
    data.hashtags = stringify(tags);
  }
  if (Array.isArray(body.assetIds)) {
    data.assetIds = stringify((body.assetIds as unknown[]).map(String));
  }
  if (typeof body.status === "string") {
    if (!POST_STATUSES.includes(body.status as PostStatus)) {
      return errorJson("Estado inválido.");
    }
    data.status = body.status;
  }
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : null;
  }

  const post = await prisma.post.update({ where: { id: params.id }, data });
  return json(post);
});

export const DELETE = withAuth(async (_req, { params }: Ctx) => {
  await prisma.post.delete({ where: { id: params.id } });
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
