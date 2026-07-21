/**
 * Lista las plantillas de reel disponibles (para elegir en el dashboard).
 */
import { json, withAuth } from "@/lib/api";
import { REEL_TEMPLATES } from "@/lib/video/reelTemplates";

export const GET = withAuth(async () => {
  return json(
    REEL_TEMPLATES.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, best: t.best })),
  );
});

export const dynamic = "force-dynamic";
