import type { Network } from "@/lib/networks";

/** Payload normalizado que recibe cualquier adaptador para publicar. */
export interface PublishPayload {
  network: Network;
  /** Texto completo a publicar (caption + hashtags + CTA ya combinados). */
  text: string;
  /** URLs públicas absolutas de las imágenes/videos. */
  mediaUrls: string[];
  /** Configuración/credenciales específicas de la cuenta (de SocialAccount.config + env). */
  config: Record<string, string>;
}

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface SocialAdapter {
  network: Network;
  /** ¿Tiene las credenciales mínimas para publicar? */
  isConfigured(config: Record<string, string>): boolean;
  publish(payload: PublishPayload): Promise<PublishResult>;
}
