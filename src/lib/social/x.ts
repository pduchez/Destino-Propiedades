/**
 * Adaptador X (Twitter) — API v2, POST /2/tweets con OAuth 1.0a user context.
 * Publica el texto del post. La subida de imágenes en X requiere el endpoint
 * v1.1 media/upload (chunked); queda como mejora futura, por ahora publica
 * el caption con el enlace al proyecto.
 */
import crypto from "node:crypto";
import type { SocialAdapter, PublishPayload, PublishResult } from "./types";

interface OAuthCreds {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

function getCreds(config: Record<string, string>): OAuthCreds | null {
  const apiKey = config.X_API_KEY || process.env.X_API_KEY || "";
  const apiSecret = config.X_API_SECRET || process.env.X_API_SECRET || "";
  const accessToken = config.X_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN || "";
  const accessSecret = config.X_ACCESS_SECRET || process.env.X_ACCESS_SECRET || "";
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return null;
  return { apiKey, apiSecret, accessToken, accessSecret };
}

function rfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Firma OAuth 1.0a para una petición (sin parámetros de body JSON). */
function oauthHeader(
  method: string,
  url: string,
  creds: OAuthCreds,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(oauthParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    rfc3986(url),
    rfc3986(paramString),
  ].join("&");

  const signingKey = `${rfc3986(creds.apiSecret)}&${rfc3986(creds.accessSecret)}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${rfc3986(k)}="${rfc3986(headerParams[k])}"`)
      .join(", ")
  );
}

export const xAdapter: SocialAdapter = {
  network: "x",
  isConfigured(config) {
    return getCreds(config) !== null;
  },
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const creds = getCreds(payload.config);
    if (!creds) {
      return {
        ok: false,
        error: "Faltan credenciales de X (API key/secret y access token/secret).",
      };
    }
    const url = "https://api.twitter.com/2/tweets";
    // X tiene límite de 280 caracteres.
    const text = payload.text.slice(0, 280);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: oauthHeader("POST", url, creds),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as {
        data?: { id?: string };
        detail?: string;
        title?: string;
      };
      if (!res.ok || !data.data?.id) {
        return {
          ok: false,
          error: data.detail || data.title || `HTTP ${res.status}`,
        };
      }
      return {
        ok: true,
        externalId: data.data.id,
        externalUrl: `https://x.com/i/status/${data.data.id}`,
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};
