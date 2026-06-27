import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";

export const GET = withAuth(async () => {
  const strategy = await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return json(strategy);
});

export const PATCH = withAuth(async (req) => {
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of [
    "brandName",
    "portalUrl",
    "mission",
    "toneOfVoice",
    "targetAudience",
    "generalInstructions",
    "language",
  ]) {
    if (typeof body[k] === "string") data[k] = body[k];
  }
  if (Array.isArray(body.defaultHashtags)) {
    data.defaultHashtags = stringify(body.defaultHashtags);
  }
  const updated = await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return json(updated);
});
