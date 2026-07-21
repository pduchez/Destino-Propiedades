/**
 * Genera un reel (video) del proyecto con JSON2Video.
 * POST { projectId, networks? } -> inicia el render (asíncrono) y crea los
 * borradores por red. El video se adjunta al terminar (webhook/sondeo).
 */
import { json, errorJson, withAuth } from "@/lib/api";
import { generateVideoForProject } from "@/lib/video/render";

export const POST = withAuth(async (req) => {
  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    networks?: string[];
    templateId?: string;
  };
  if (!body.projectId) return errorJson("Falta projectId.");
  const result = await generateVideoForProject(body.projectId, body.networks, body.templateId);
  return json({ ok: true, ...result }, 201);
});

export const dynamic = "force-dynamic";
