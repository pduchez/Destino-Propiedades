import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { DEFAULT_MASTER_INSTRUCTION } from "@/lib/ai/masterInstruction";

export const GET = withAuth(async () => {
  let strategy = await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  // Pre-carga la Instrucción Madre por defecto si aún está vacía.
  if (!strategy.masterInstruction || !strategy.masterInstruction.trim()) {
    strategy = await prisma.brandStrategy.update({
      where: { id: "default" },
      data: { masterInstruction: DEFAULT_MASTER_INSTRUCTION },
    });
  }
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
    "masterInstruction",
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

export const dynamic = "force-dynamic";
