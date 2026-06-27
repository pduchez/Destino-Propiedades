import { json, errorJson, withAuth } from "@/lib/api";
import { generateDrafts } from "@/lib/generation";

/** POST: genera borradores a partir de proyecto/campaña + redes. */
export const POST = withAuth(async (req) => {
  const body = (await req.json()) as {
    projectId?: string | null;
    campaignId?: string | null;
    networks?: string[];
    countPerNetwork?: number;
    attachImage?: boolean;
  };

  if (!Array.isArray(body.networks) || body.networks.length === 0) {
    return errorJson("Selecciona al menos una red.");
  }

  const results = await generateDrafts({
    projectId: body.projectId ?? null,
    campaignId: body.campaignId ?? null,
    networks: body.networks,
    countPerNetwork: body.countPerNetwork,
    attachImage: body.attachImage,
  });

  return json({ created: results.length, posts: results }, 201);
});

export const dynamic = "force-dynamic";
