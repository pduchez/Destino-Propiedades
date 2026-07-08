/**
 * Diagnóstico público (sin secretos): indica qué commit está sirviendo y si el
 * runtime detecta las credenciales/DB. Solo devuelve booleanos, nunca valores.
 */
import { whatsappConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    env: process.env.VERCEL_ENV || "local", // production | preview | development
    whatsapp: whatsappConfigured(),
    whatsappToken: !!process.env.WHATSAPP_TOKEN,
    whatsappPhoneId: !!process.env.WHATSAPP_PHONE_ID,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    at: new Date().toISOString(),
  });
}
