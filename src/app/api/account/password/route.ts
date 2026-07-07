import { NextResponse } from "next/server";
import { errorJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  verifyPassword,
  hashPassword,
} from "@/lib/users";

/** POST { current, next } -> cambia la contraseña del usuario autenticado. */
export async function POST(req: Request) {
  const session = await getCurrentUser().catch(() => null);
  if (!session) return errorJson("No autorizado", 401);

  const body = (await req.json().catch(() => ({}))) as {
    current?: string;
    next?: string;
  };
  const current = body.current || "";
  const next = (body.next || "").trim();

  if (next.length < 6) {
    return errorJson("La nueva contraseña debe tener al menos 6 caracteres", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return errorJson("La contraseña actual no es correcta", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
