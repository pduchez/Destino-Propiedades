/** Helpers para campos JSON guardados como string en SQLite. */

export function parseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function parseObject<T = Record<string, unknown>>(
  value: string | null | undefined,
  fallback: T,
): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}
