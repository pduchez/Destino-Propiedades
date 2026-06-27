import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorJson(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Envuelve un handler con autorización + manejo de errores uniforme. */
export function withAuth<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<NextResponse>,
) {
  return async (req: Request, ...args: Args): Promise<NextResponse> => {
    if (!isAuthorized()) return errorJson("No autorizado", 401);
    try {
      return await handler(req, ...args);
    } catch (e) {
      const err = e as Error & { status?: number };
      console.error("[API]", err);
      return errorJson(err.message || "Error interno", err.status || 500);
    }
  };
}
