import { json, errorJson, withAuth } from "@/lib/api";
import { publishPost } from "@/lib/social";

type Ctx = { params: { id: string } };

/** POST: publica el post en su red (Fase 1: tras aprobación humana). */
export const POST = withAuth(async (_req, { params }: Ctx) => {
  const result = await publishPost(params.id);
  if (!result.ok) return errorJson(result.error || "No se pudo publicar", 400);
  return json(result);
});
