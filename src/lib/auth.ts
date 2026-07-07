/**
 * Autorización del área privada. El panel ARS es exclusivo del rol `admin`
 * (Director1). El resto de usuarios (ventas) no pueden usar sus APIs.
 *
 * Compatibilidad: si aún no hay tabla de usuarios / base de datos (p. ej. un
 * despliegue temporal), y DASHBOARD_PASSWORD está vacío, el acceso queda
 * abierto solo para no romper entornos de desarrollo.
 */
import { getCurrentUser } from "@/lib/users";

/** ¿La request actual pertenece a un admin (Director1)? */
export async function isAdminRequest(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === "admin";
  } catch {
    // Sin base de datos disponible: solo permitir en desarrollo sin password.
    return process.env.NODE_ENV !== "production" && !process.env.DASHBOARD_PASSWORD;
  }
}
