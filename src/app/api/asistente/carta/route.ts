// ============================================================================
//  Asistente de Cierre — Guardar la Carta firmada + finalizar en el CRM
// ============================================================================
//
//  POST /api/asistente/carta
//    Body: { loteId, prospecto, comentarios, montoReserva, pdfBase64 }
//    - Guarda el PDF firmado (CartaDoc) y devuelve un enlace estable para
//      enviarlo al cliente por WhatsApp.
//    - Actualiza la reserva del lote (comentarios + monto) y deja una
//      Actividad "Carta generada" en la línea de tiempo del lead del CRM.
//    Requiere sesión.
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";
import { money } from "@/asistente/lib/format";

export const dynamic = "force-dynamic";

export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const loteId = String(b.loteId || "").trim();
  const pdfBase64 = String(b.pdfBase64 || "");
  if (!pdfBase64) throw new HttpError("Falta el PDF", 400);

  const prospecto = String(b.prospecto || "");
  const comentarios = String(b.comentarios || "").trim();
  const montoReserva = Number(b.montoReserva) || 0;

  // base64 → bytes (soporta "data:application/pdf;base64,....").
  const raw = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
  const bytes = Buffer.from(raw, "base64");

  const doc = await prisma.cartaDoc.create({
    data: { loteId, prospecto, pdf: bytes, mimeType: "application/pdf" },
  });

  // Finaliza en el CRM: reserva + actividad en el lead.
  try {
    const reserva = loteId
      ? await prisma.loteReserva.findUnique({ where: { loteId } })
      : null;
    if (reserva) {
      await prisma.loteReserva.update({
        where: { loteId },
        data: { comentarios, montoReserva },
      });
      if (reserva.leadId) {
        await prisma.cartaDoc.update({
          where: { id: doc.id },
          data: { leadId: reserva.leadId },
        });
        await prisma.activity.create({
          data: {
            leadId: reserva.leadId,
            userId: user.id,
            type: "nota",
            body:
              `Carta de reservación generada y firmada. ` +
              `Reservación: ${money(montoReserva)}.` +
              (comentarios ? ` Comentarios: ${comentarios}` : ""),
          },
        });
      }
    }
  } catch {
    /* si el CRM falla, igual devolvemos el documento */
  }

  const base =
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;
  return Response.json({ id: doc.id, url: `${base}/api/asistente/carta/${doc.id}` });
});
