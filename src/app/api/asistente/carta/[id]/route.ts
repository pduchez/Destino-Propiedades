// ============================================================================
//  Sirve la copia electrónica de una Carta firmada (PDF).
// ============================================================================
//
//  GET /api/asistente/carta/<id>
//
//  Público a propósito: el cliente (no logueado) debe poder abrir el enlace que
//  le llega por WhatsApp. El id es un cuid no adivinable. Mismo patrón que el
//  endpoint de imágenes del portal (/api/img/<id>).
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.cartaDoc.findUnique({ where: { id: params.id } });
    if (!doc) return new Response("No encontrada", { status: 404 });
    const body = new Uint8Array(doc.pdf);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="carta-${doc.loteId || doc.id}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("No disponible", { status: 500 });
  }
}
