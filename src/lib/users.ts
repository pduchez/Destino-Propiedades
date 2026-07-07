/**
 * Gestión de usuarios del área privada (Director1 = admin del ARS; ventas1..5 =
 * rol sales, dirigidos al CRM). Contraseñas hasheadas con scrypt; sesión por
 * cookie firmada con HMAC. Sin dependencias externas (solo `crypto`).
 */
import { cookies } from "next/headers";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "crypto";
import { prisma } from "@/lib/db";

export const AUTH_COOKIE = "dp_auth";
export type Role = "admin" | "sales";

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
}

// --- Hashing de contraseñas (scrypt) -------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}

// --- Sesión firmada (cookie) ---------------------------------------------

function sessionSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.DASHBOARD_PASSWORD ||
    "dp-dev-secret-cambia-en-produccion"
  );
}

export function signSession(userId: string): string {
  const mac = createHmac("sha256", sessionSecret()).update(userId).digest("hex");
  return `${userId}.${mac}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const id = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = createHmac("sha256", sessionSecret())
    .update(id)
    .digest("hex");
  if (mac.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return id;
}

// --- Semilla idempotente de usuarios -------------------------------------

const SEED: { username: string; role: Role }[] = [
  { username: "Director1", role: "admin" },
  { username: "ventas1", role: "sales" },
  { username: "ventas2", role: "sales" },
  { username: "ventas3", role: "sales" },
  { username: "ventas4", role: "sales" },
  { username: "ventas5", role: "sales" },
];

/** Crea los usuarios base si aún no existen. Seguro de llamar en cada request. */
export async function ensureSeedUsers(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;
  for (const u of SEED) {
    await prisma.user.create({
      data: {
        username: u.username,
        role: u.role,
        passwordHash: hashPassword("password"),
      },
    });
  }
}

// --- Consulta del usuario actual -----------------------------------------

export async function findUserByUsername(username: string) {
  return prisma.user.findFirst({
    where: { username: { equals: username.trim(), mode: "insensitive" } },
  });
}

/** Usuario autenticado en la request actual (o null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  const id = verifySession(token);
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role as Role };
}
