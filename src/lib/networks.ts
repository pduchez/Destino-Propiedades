/** Definición central de las redes soportadas y sus restricciones de copy. */

export type Network = "facebook" | "instagram" | "x" | "tiktok";

export const NETWORKS: Network[] = ["facebook", "instagram", "x", "tiktok"];

export const NETWORK_META: Record<
  Network,
  {
    label: string;
    emoji: string;
    /** Límite de caracteres del cuerpo del copy (guía para la IA). */
    captionLimit: number;
    /** Cantidad recomendada de hashtags. */
    hashtagRange: [number, number];
    /** Indicaciones de estilo específicas de la red. */
    styleGuide: string;
    /** ¿La red requiere video en lugar de imagen? (TikTok). */
    requiresVideo: boolean;
  }
> = {
  facebook: {
    label: "Facebook",
    emoji: "📘",
    captionLimit: 600,
    hashtagRange: [2, 5],
    styleGuide:
      "Texto más extenso y narrativo permitido. Puedes contar una mini-historia o describir el estilo de vida. Pocos hashtags al final.",
    requiresVideo: false,
  },
  instagram: {
    label: "Instagram",
    emoji: "📸",
    captionLimit: 400,
    hashtagRange: [8, 15],
    styleGuide:
      "Muy visual y emocional. Usa emojis con moderación. Caption atractivo en las primeras líneas. Más hashtags relevantes al final.",
    requiresVideo: false,
  },
  x: {
    label: "X (Twitter)",
    emoji: "✖️",
    captionLimit: 270,
    hashtagRange: [1, 2],
    styleGuide:
      "Conciso y directo, máximo 280 caracteres TOTAL incluyendo hashtags. Gancho fuerte. 1 o 2 hashtags como máximo.",
    requiresVideo: false,
  },
  tiktok: {
    label: "TikTok",
    emoji: "🎵",
    captionLimit: 150,
    hashtagRange: [3, 6],
    styleGuide:
      "Caption corto, fresco y con tono de tendencia. Pensado para acompañar un video vertical. Usa hashtags de descubrimiento.",
    requiresVideo: true,
  },
};

export function isNetwork(value: string): value is Network {
  return (NETWORKS as string[]).includes(value);
}

export const POST_STATUSES = [
  "draft",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "rejected",
  "failed",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Borrador",
  approved: "Aprobado",
  scheduled: "Programado",
  publishing: "Publicando…",
  published: "Publicado",
  rejected: "Rechazado",
  failed: "Falló",
};
