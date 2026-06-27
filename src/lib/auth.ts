/**
 * Protección simple del dashboard mediante un password compartido.
 * Si DASHBOARD_PASSWORD está vacío, el acceso queda abierto (solo desarrollo).
 * El cliente envía el token vía cookie `dp_auth` o cabecera `x-dashboard-token`.
 */
import { cookies, headers } from "next/headers";

export const AUTH_COOKIE = "dp_auth";

export function dashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD ?? "";
}

export function isAuthConfigured(): boolean {
  return dashboardPassword().length > 0;
}

/** Valida la petición actual (Server Component / Route Handler). */
export function isAuthorized(): boolean {
  const pwd = dashboardPassword();
  if (!pwd) return true; // abierto en dev
  const cookieToken = cookies().get(AUTH_COOKIE)?.value;
  if (cookieToken && cookieToken === pwd) return true;
  const headerToken = headers().get("x-dashboard-token");
  return headerToken === pwd;
}

/** Para route handlers de API: lanza si no está autorizado. */
export function assertApiAuthorized(): void {
  if (!isAuthorized()) {
    const err = new Error("No autorizado");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
}
