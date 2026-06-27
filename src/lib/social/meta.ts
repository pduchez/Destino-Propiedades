/**
 * Adaptador Meta (Facebook Pages + Instagram) vía Graph API.
 * - Facebook: POST /{page-id}/photos (con imagen) o /{page-id}/feed (solo texto).
 * - Instagram: crea un media container y luego lo publica (2 pasos).
 *
 * Requiere un Page Access Token de larga duración y, para IG, el IG User ID
 * vinculado a la página. Las imágenes deben ser URLs públicas accesibles por Meta.
 */
import type { SocialAdapter, PublishPayload, PublishResult } from "./types";

function graphVersion(config: Record<string, string>): string {
  return config.META_GRAPH_VERSION || process.env.META_GRAPH_VERSION || "v21.0";
}

export const facebookAdapter: SocialAdapter = {
  network: "facebook",
  isConfigured(config) {
    return !!(
      (config.META_PAGE_ID || process.env.META_PAGE_ID) &&
      (config.META_PAGE_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN)
    );
  },
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const cfg = mergeEnv(payload.config, [
      "META_PAGE_ID",
      "META_PAGE_ACCESS_TOKEN",
      "META_GRAPH_VERSION",
    ]);
    const pageId = cfg.META_PAGE_ID;
    const token = cfg.META_PAGE_ACCESS_TOKEN;
    if (!pageId || !token) {
      return { ok: false, error: "Falta META_PAGE_ID o META_PAGE_ACCESS_TOKEN." };
    }
    const v = graphVersion(cfg);
    try {
      const hasImage = payload.mediaUrls.length > 0;
      const endpoint = hasImage
        ? `https://graph.facebook.com/${v}/${pageId}/photos`
        : `https://graph.facebook.com/${v}/${pageId}/feed`;
      const body = new URLSearchParams();
      body.set("access_token", token);
      if (hasImage) {
        body.set("url", payload.mediaUrls[0]);
        body.set("caption", payload.text);
      } else {
        body.set("message", payload.text);
      }
      const res = await fetch(endpoint, { method: "POST", body });
      const data = (await res.json()) as { id?: string; post_id?: string; error?: { message?: string } };
      if (!res.ok || data.error) {
        return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
      }
      const id = data.post_id || data.id;
      return {
        ok: true,
        externalId: id,
        externalUrl: id ? `https://facebook.com/${id}` : undefined,
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

export const instagramAdapter: SocialAdapter = {
  network: "instagram",
  isConfigured(config) {
    return !!(
      (config.META_IG_USER_ID || process.env.META_IG_USER_ID) &&
      (config.META_PAGE_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN)
    );
  },
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const cfg = mergeEnv(payload.config, [
      "META_IG_USER_ID",
      "META_PAGE_ACCESS_TOKEN",
      "META_GRAPH_VERSION",
    ]);
    const igUserId = cfg.META_IG_USER_ID;
    const token = cfg.META_PAGE_ACCESS_TOKEN;
    if (!igUserId || !token) {
      return {
        ok: false,
        error: "Falta META_IG_USER_ID o META_PAGE_ACCESS_TOKEN.",
      };
    }
    if (payload.mediaUrls.length === 0) {
      return { ok: false, error: "Instagram requiere al menos una imagen." };
    }
    const v = graphVersion(cfg);
    try {
      // Paso 1: crear contenedor de media
      const createBody = new URLSearchParams();
      createBody.set("access_token", token);
      createBody.set("image_url", payload.mediaUrls[0]);
      createBody.set("caption", payload.text);
      const createRes = await fetch(
        `https://graph.facebook.com/${v}/${igUserId}/media`,
        { method: "POST", body: createBody },
      );
      const createData = (await createRes.json()) as { id?: string; error?: { message?: string } };
      if (!createRes.ok || !createData.id) {
        return {
          ok: false,
          error: createData.error?.message || `HTTP ${createRes.status} al crear media`,
        };
      }
      // Paso 2: publicar el contenedor
      const pubBody = new URLSearchParams();
      pubBody.set("access_token", token);
      pubBody.set("creation_id", createData.id);
      const pubRes = await fetch(
        `https://graph.facebook.com/${v}/${igUserId}/media_publish`,
        { method: "POST", body: pubBody },
      );
      const pubData = (await pubRes.json()) as { id?: string; error?: { message?: string } };
      if (!pubRes.ok || !pubData.id) {
        return {
          ok: false,
          error: pubData.error?.message || `HTTP ${pubRes.status} al publicar`,
        };
      }
      return { ok: true, externalId: pubData.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

function mergeEnv(
  config: Record<string, string>,
  keys: string[],
): Record<string, string> {
  const out: Record<string, string> = { ...config };
  for (const k of keys) {
    if (!out[k] && process.env[k]) out[k] = process.env[k] as string;
  }
  return out;
}
