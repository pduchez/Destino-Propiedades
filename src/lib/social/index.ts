/**
 * Registro central de adaptadores + orquestación de publicación de un Post.
 */
import { prisma } from "@/lib/db";
import { parseArray, parseObject } from "@/lib/json";
import type { Network } from "@/lib/networks";
import type { SocialAdapter, PublishResult } from "./types";
import { facebookAdapter, instagramAdapter } from "./meta";
import { xAdapter } from "./x";
import { tiktokAdapter } from "./tiktok";

export const adapters: Record<Network, SocialAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  x: xAdapter,
  tiktok: tiktokAdapter,
};

export function getAdapter(network: Network): SocialAdapter {
  return adapters[network];
}

function publicBase(): string {
  return process.env.PUBLIC_BASE_URL || "http://localhost:3000";
}

/** Combina caption + hashtags + CTA en el texto final a publicar. */
export function composeText(post: {
  caption: string;
  hashtags: string;
  callToAction: string;
}): string {
  const tags = parseArray(post.hashtags);
  const parts = [post.caption.trim()];
  if (post.callToAction?.trim()) parts.push(post.callToAction.trim());
  if (tags.length) parts.push(tags.join(" "));
  return parts.filter(Boolean).join("\n\n");
}

/**
 * Publica un post existente en su red. Actualiza estado/externalId/error.
 * Devuelve el resultado del adaptador.
 */
export async function publishPost(postId: string): Promise<PublishResult> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { ok: false, error: "Post no encontrado." };

  const network = post.network as Network;
  const adapter = getAdapter(network);
  if (!adapter) return { ok: false, error: `Red no soportada: ${network}` };

  // Carga config de la cuenta + estado
  const account = await prisma.socialAccount.findUnique({ where: { network } });
  if (account && !account.enabled) {
    return {
      ok: false,
      error: `La cuenta de ${network} está deshabilitada. Actívala en Configuración.`,
    };
  }
  const config = account ? parseObject<Record<string, string>>(account.config, {}) : {};

  // Resuelve URLs absolutas de los medios
  const assetIds = parseArray(post.assetIds);
  const assets = assetIds.length
    ? await prisma.asset.findMany({ where: { id: { in: assetIds } } })
    : [];
  const mediaUrls = assets.map((a) =>
    a.url.startsWith("http") ? a.url : `${publicBase()}${a.url}`,
  );

  const text = composeText(post);

  await prisma.post.update({
    where: { id: postId },
    data: { status: "publishing", error: null },
  });

  const result = await adapter.publish({ network, text, mediaUrls, config });

  await prisma.post.update({
    where: { id: postId },
    data: result.ok
      ? {
          status: "published",
          publishedAt: new Date(),
          externalId: result.externalId,
          externalUrl: result.externalUrl,
          error: null,
        }
      : { status: "failed", error: result.error },
  });

  return result;
}
