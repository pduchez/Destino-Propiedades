// ============================================================================
//  Asistente de Cierre — Disponibilidad / Bloqueo de lote (integrado al CRM)
// ============================================================================
//
//  GET  /api/asistente/disponibilidad?loteId=XXX  -> consulta estado del lote
//  POST /api/asistente/disponibilidad {loteId,...} -> bloquea ("En trámite /
//       Reservado") y registra el prospecto en el embudo del CRM.
//
//  Ambos endpoints exigen sesión (los 6 usuarios de Acceso Ventas). El bloqueo:
//   1. Crea/enlaza un Lead del CRM (asignado al vendedor logueado).
//   2. Deja una Actividad en la línea de tiempo del lead.
//   3. Registra/actualiza la reserva del lote (tabla LoteReserva).
//
//  Si dos vendedores intentan el mismo lote, el segundo recibe "reservado por
//  otro vendedor" y no se sobrescribe la reserva.
//
//  Ante un fallo puntual de base de datos, NO se rompe el cierre: se responde
//  en "modo autónomo" con un registro local temporal.
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { requireUser, crmRoute } from "@/lib/crmServer";
import { ensureDefaultOrg } from "@/lib/crm";

export const dynamic = "force-dynamic";

// Respaldo en memoria del servidor si la BD falla momentáneamente.
const bloqueosLocales = new Map<string, { prospecto: string; ts: number }>();

type Estado = "libre" | "reservado" | "vendido" | "desconocido";

function calificacionATemperatura(cal?: string): "caliente" | "tibio" | "frio" {
  const c = (cal || "").toLowerCase();
  if (c.includes("caliente")) return "caliente";
  if (c.includes("frío") || c.includes("frio")) return "frio";
  return "tibio";
}

function jsonResp(body: {
  loteId: string;
  estado: Estado;
  modo: "crm" | "autonomo";
  detalle?: string;
  leadId?: string | null;
}) {
  return Response.json(body);
}

// ---------------------------------------------------------------------------
export const GET = crmRoute(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const loteId = (url.searchParams.get("loteId") || "").trim();
  if (!loteId) return jsonResp({ loteId: "", estado: "desconocido", modo: "crm" });

  try {
    const reserva = await prisma.loteReserva.findUnique({ where: { loteId } });
    return jsonResp({
      loteId,
      estado: (reserva?.estado as Estado) || "libre",
      modo: "crm",
      leadId: reserva?.leadId ?? null,
    });
  } catch {
    return jsonResp({
      loteId,
      estado: bloqueosLocales.has(loteId) ? "reservado" : "libre",
      modo: "autonomo",
    });
  }
});

// ---------------------------------------------------------------------------
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const loteId = String(b.loteId || "").trim();
  if (!loteId) return jsonResp({ loteId: "", estado: "desconocido", modo: "crm" });

  const prospecto = String(b.prospecto || "").trim();
  const proyectoId = String(b.proyectoId || "");
  const proyectoNombre = String(b.proyectoNombre || "");
  const poligono = String(b.poligono || "");
  const numero = Number(b.numero) || 0;
  const precio = Number(b.precio) || 0;

  try {
    const existing = await prisma.loteReserva.findUnique({ where: { loteId } });

    // Ya reservado por OTRO vendedor: no sobrescribir; avisar.
    if (
      existing &&
      existing.estado === "reservado" &&
      existing.reservedById &&
      existing.reservedById !== user.id
    ) {
      return jsonResp({
        loteId,
        estado: "reservado",
        modo: "crm",
        detalle: "Este lote ya está reservado por otro vendedor.",
        leadId: null,
      });
    }

    // Reutiliza el lead de una reserva previa del mismo vendedor; si no, crea.
    let leadId = existing?.leadId || null;
    if (!leadId) {
      const org = await ensureDefaultOrg();
      const lead = await prisma.lead.create({
        data: {
          orgId: org.id,
          name: prospecto || "Prospecto (Asistente de Cierre)",
          source: "walk_in",
          projectSlug: proyectoId,
          projectName: proyectoNombre,
          value: precio,
          stage: "negociacion",
          temperature: calificacionATemperatura(String(b.calificacion || "")),
          assignedToId: user.id,
          notes: [
            `Reserva iniciada desde el Asistente de Cierre.`,
            `Lote ${loteId} — Polígono ${poligono}, Lote ${numero}.`,
            b.perfil ? `Perfil: ${b.perfil}.` : "",
            b.notas ? `Notas: ${b.notas}` : "",
          ]
            .filter(Boolean)
            .join(" "),
          lastContactAt: new Date(),
        },
      });
      leadId = lead.id;
      await prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          type: "visita",
          body:
            `Reserva de lote ${loteId} (Pol. ${poligono}, Lote ${numero}) ` +
            `iniciada en el Asistente de Cierre. Precio de contado $${precio.toLocaleString(
              "en-US"
            )}.`,
        },
      });
    }

    // Registra/actualiza la reserva del lote.
    await prisma.loteReserva.upsert({
      where: { loteId },
      create: {
        loteId,
        proyectoId,
        proyectoNombre,
        poligono,
        numero,
        estado: "reservado",
        prospecto,
        reservedById: user.id,
        leadId,
      },
      update: {
        estado: "reservado",
        prospecto,
        reservedById: user.id,
        leadId,
        proyectoNombre,
        poligono,
        numero,
      },
    });

    return jsonResp({ loteId, estado: "reservado", modo: "crm", leadId });
  } catch (e) {
    // Fallo puntual de BD: no romper el cierre; registro local temporal.
    console.error("[Asistente disponibilidad] fallback autónomo:", e);
    bloqueosLocales.set(loteId, { prospecto, ts: Date.now() });
    return jsonResp({
      loteId,
      estado: "reservado",
      modo: "autonomo",
      detalle: "Registro local temporal (sin conexión al CRM).",
    });
  }
});
