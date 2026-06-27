/**
 * Adaptador TikTok — Content Posting API.
 * TikTok publica VIDEO (no imágenes sueltas). Si el media es un video con URL
 * pública, usa el flujo PULL_FROM_URL. Si solo hay imágenes, devuelve un error
 * informativo (en Fase 1 el contenido de TikTok se prepara/publica manualmente
 * con el video correspondiente).
 *
 * Doc: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */
import type { SocialAdapter, PublishPayload, PublishResult } from "./types";

function getToken(config: Record<string, string>): string {
  return config.TIKTOK_ACCESS_TOKEN || process.env.TIKTOK_ACCESS_TOKEN || "";
}

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;

export const tiktokAdapter: SocialAdapter = {
  network: "tiktok",
  isConfigured(config) {
    return getToken(config).length > 0;
  },
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const token = getToken(payload.config);
    if (!token) {
      return { ok: false, error: "Falta TIKTOK_ACCESS_TOKEN." };
    }
    const videoUrl = payload.mediaUrls.find((u) => VIDEO_EXT.test(u));
    if (!videoUrl) {
      return {
        ok: false,
        error:
          "TikTok requiere un video (mp4/mov). Sube un video al stock del proyecto o publica manualmente este borrador.",
      };
    }
    try {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            post_info: {
              title: payload.text.slice(0, 150),
              privacy_level: "PUBLIC_TO_EVERYONE",
              disable_comment: false,
            },
            source_info: {
              source: "PULL_FROM_URL",
              video_url: videoUrl,
            },
          }),
        },
      );
      const data = (await res.json()) as {
        data?: { publish_id?: string };
        error?: { code?: string; message?: string };
      };
      if (!res.ok || data.error?.code !== "ok") {
        return {
          ok: false,
          error: data.error?.message || `HTTP ${res.status}`,
        };
      }
      return { ok: true, externalId: data.data?.publish_id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};
