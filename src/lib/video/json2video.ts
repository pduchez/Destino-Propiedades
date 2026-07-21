/**
 * Cliente de JSON2Video (https://json2video.com). Convierte una especificación
 * "movie" (JSON) en un MP4 vertical 9:16 con fotos reales + texto en pantalla +
 * música (sin voz). El render es ASÍNCRONO: se envía y luego se consulta el
 * estado (o llega por webhook).
 *
 * Auth: header `x-api-key`. Endpoint: POST/GET https://api.json2video.com/v2/movies
 */

const API_BASE = "https://api.json2video.com/v2";

export function isVideoConfigured(): boolean {
  return !!apiKey();
}

export function apiKey(): string {
  return (process.env.JSON2VIDEO_API_KEY || "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

/** Especificación de película (estructura de JSON2Video: movie → scenes → elements). */
export type MovieSpec = Record<string, unknown>;

export interface SubmitResult {
  ok: boolean;
  externalId?: string; // id del "project" en JSON2Video
  error?: string;
}

/** Envía la película a renderizar. Devuelve el id para consultar el estado. */
export async function submitMovie(movie: MovieSpec): Promise<SubmitResult> {
  const key = apiKey();
  if (!key) return { ok: false, error: "Falta JSON2VIDEO_API_KEY." };
  try {
    const res = await fetch(`${API_BASE}/movies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify(movie),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      project?: string;
      id?: string;
      message?: string;
      error?: string;
    };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "JSON2Video rechazó la API key (401/403). Revisa JSON2VIDEO_API_KEY en Vercel." };
    }
    const id = data.project || data.id;
    if (!res.ok || !id) {
      return { ok: false, error: data.message || data.error || `HTTP ${res.status} al enviar el render.` };
    }
    return { ok: true, externalId: id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface StatusResult {
  status: "rendering" | "done" | "failed" | "unknown";
  videoUrl?: string;
  error?: string;
}

/** Consulta el estado de un render por su id. */
export async function getMovieStatus(externalId: string): Promise<StatusResult> {
  const key = apiKey();
  if (!key) return { status: "unknown", error: "Falta JSON2VIDEO_API_KEY." };
  try {
    const res = await fetch(`${API_BASE}/movies?project=${encodeURIComponent(externalId)}`, {
      headers: { "x-api-key": key },
    });
    const data = (await res.json().catch(() => ({}))) as {
      movie?: { status?: string; url?: string; message?: string };
      status?: string;
      url?: string;
    };
    const m = data.movie ?? data;
    const raw = String(m.status ?? "").toLowerCase();
    const url = m.url;
    if (url && (raw === "done" || raw === "ready" || raw === "finished" || raw === "success")) {
      return { status: "done", videoUrl: url };
    }
    if (raw === "error" || raw === "failed") {
      return { status: "failed", error: (m as { message?: string }).message || "Render falló." };
    }
    // pending | running | rendering | queued | (aún sin url)
    if (url) return { status: "done", videoUrl: url };
    return { status: "rendering" };
  } catch (e) {
    return { status: "unknown", error: (e as Error).message };
  }
}

/**
 * Chequeo ligero de conexión: hace una consulta autenticada trivial y solo
 * distingue "key válida" de "key rechazada" (sin gastar un render/crédito).
 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const key = apiKey();
  if (!key) return { ok: false, message: "No hay JSON2VIDEO_API_KEY configurada en el servidor." };
  try {
    const res = await fetch(`${API_BASE}/movies?project=__ping__`, {
      headers: { "x-api-key": key },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "La API key fue rechazada (401/403). Revísala en Vercel y vuelve a desplegar." };
    }
    // Cualquier otra respuesta (200/404/400) significa que la key fue aceptada.
    return { ok: true, message: "✓ Conexión con JSON2Video correcta (API key válida)." };
  } catch (e) {
    return { ok: false, message: `No se pudo contactar a JSON2Video: ${(e as Error).message}` };
  }
}
