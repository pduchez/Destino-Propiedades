"use client";

/** Cliente fetch para el dashboard. Lanza Error con el mensaje del API. */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Timeout: la UI nunca queda colgada si el servidor no responde (p. ej. un
  // despliegue sin base de datos configurada).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      signal: ctrl.signal,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    clearTimeout(timer);
    const aborted = (e as Error)?.name === "AbortError";
    throw new Error(
      aborted ? "El servidor no respondió (tiempo agotado)." : "No se pudo conectar con el servidor.",
    );
  }
  clearTimeout(timer);
  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const msg = (data && (data.error as string)) || `Error ${res.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}
