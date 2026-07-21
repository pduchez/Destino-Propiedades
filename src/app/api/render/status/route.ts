/**
 * Estado de los renders de video.
 * GET ?jobId=... -> consulta y ACTUALIZA ese job (útil para sondear desde la UI).
 * GET            -> lista los renders recientes (sin sondear).
 */
import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { settleJob } from "@/lib/video/render";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (jobId) {
    await settleJob(jobId); // intenta cerrar si ya terminó
    const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
    return json({ job });
  }
  const jobs = await prisma.renderJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return json({ jobs });
});

export const dynamic = "force-dynamic";
