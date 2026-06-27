import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { isAIConfigured } from "@/lib/ai/generate";

export const GET = withAuth(async () => {
  const [projects, drafts, published, assets] = await Promise.all([
    prisma.project.count(),
    prisma.post.count({ where: { status: "draft" } }),
    prisma.post.count({ where: { status: "published" } }),
    prisma.asset.count(),
  ]);
  return json({
    aiConfigured: isAIConfigured(),
    model: process.env.AI_MODEL || "claude-opus-4-8",
    counts: { projects, drafts, published, assets },
  });
});

export const dynamic = "force-dynamic";
