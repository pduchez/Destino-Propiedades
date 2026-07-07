import { NextResponse } from "next/server";
import { errorJson } from "@/lib/api";
import {
  AUTH_COOKIE,
  ensureSeedUsers,
  findUserByUsername,
  verifyPassword,
  signSession,
} from "@/lib/users";

/** POST { username, password } -> valida y setea cookie de sesión firmada. */
export async function POST(req: Request) {
  await ensureSeedUsers();
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) {
    return errorJson("Usuario y contraseña son obligatorios", 400);
  }
  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return errorJson("Usuario o contraseña incorrectos", 401);
  }
  const res = NextResponse.json({ ok: true, role: user.role, username: user.username });
  res.cookies.set(AUTH_COOKIE, signSession(user.id), {
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
