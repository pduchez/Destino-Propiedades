/**
 * Prueba de conexión con JSON2Video (verifica la API key sin gastar créditos).
 * POST -> { ok, message }
 */
import { json, withAuth } from "@/lib/api";
import { testConnection } from "@/lib/video/json2video";

export const POST = withAuth(async () => {
  const result = await testConnection();
  return json(result);
});

export const dynamic = "force-dynamic";
