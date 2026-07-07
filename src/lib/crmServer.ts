/** Helpers de servidor para las APIs del CRM: sesión y alcance por rol. */
import { getCurrentUser, type SessionUser } from "@/lib/users";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Devuelve el usuario autenticado o lanza 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) throw new HttpError("No autorizado", 401);
  return user;
}

/**
 * Filtro Prisma de leads según el rol:
 *  - admin  → ve todo.
 *  - sales  → solo los leads asignados a él.
 */
export function leadScope(user: SessionUser): { assignedToId?: string } {
  return user.role === "admin" ? {} : { assignedToId: user.id };
}

/** Envuelve un handler de API del CRM con manejo uniforme de errores. */
export function crmRoute<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (e) {
      const err = e as HttpError;
      const status = err.status || 500;
      if (status >= 500) console.error("[CRM API]", err);
      return new Response(JSON.stringify({ error: err.message || "Error" }), {
        status,
        headers: { "content-type": "application/json" },
      });
    }
  };
}
