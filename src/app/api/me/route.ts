import { json } from "@/lib/api";
import { ensureSeedUsers, getCurrentUser } from "@/lib/users";

/** GET -> { authenticated, username, role } del usuario de la sesión actual. */
export async function GET() {
  // Garantiza que los usuarios base existan (primer arranque en producción).
  try {
    await ensureSeedUsers();
  } catch {
    /* sin BD: se maneja abajo */
  }
  const user = await getCurrentUser().catch(() => null);
  if (!user) return json({ authenticated: false });
  return json({ authenticated: true, username: user.username, role: user.role });
}

export const dynamic = "force-dynamic";
