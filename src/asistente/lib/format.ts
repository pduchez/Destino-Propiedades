// Formateo de moneda, números, DUI y fechas (español salvadoreño / US$).

export function money(n: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isFinite(n) ? n : 0);
}

export function v2(n: number): string {
  return `${new Intl.NumberFormat("es-SV", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} V²`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/**
 * Máscara de DUI salvadoreño: 8 dígitos + guion + 1 dígito -> 00000000-0
 * Acepta cualquier entrada y devuelve la versión formateada válida.
 */
export function formatDui(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8)}`;
}

export function isDuiCompleto(dui: string): boolean {
  return /^\d{8}-\d$/.test(dui);
}

/** Fecha a formato de input date (YYYY-MM-DD). */
export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Fecha legible: "10 de julio de 2026". */
export function fechaLarga(iso: string): string {
  const d = parseDateInput(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Convierte "YYYY-MM-DD" a Date local (sin desfase de zona horaria). */
export function parseDateInput(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Suma días a una fecha ISO (YYYY-MM-DD) y devuelve ISO. */
export function addDays(iso: string, days: number): string {
  const d = parseDateInput(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

/** Diferencia en días entre dos fechas ISO (b - a). */
export function diffDays(aIso: string, bIso: string): number {
  const a = parseDateInput(aIso);
  const b = parseDateInput(bIso);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
