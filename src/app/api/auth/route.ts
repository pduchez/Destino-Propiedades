import { NextResponse } from "next/server";
import { AUTH_COOKIE, dashboardPassword, isAuthConfigured } from "@/lib/auth";
import { errorJson, json } from "@/lib/api";

/** POST { password } -> setea cookie de sesión. */
export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return json({ ok: true, open: true });
  }
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (body.password !== dashboardPassword()) {
    return errorJson("Contraseña incorrecta", 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, dashboardPassword(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

/** DELETE -> cierra sesión. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}

export const dynamic = "force-dynamic";
