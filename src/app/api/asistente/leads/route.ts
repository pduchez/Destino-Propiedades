// ============================================================================
//  Asistente de Cierre — Buscador de prospectos del CRM
// ============================================================================
//
//  GET /api/asistente/leads?q=texto
//
//  En la cita, el vendedor NO teclea un nombre nuevo: jala del CRM el contacto
//  que ya creó el bot de WhatsApp (con su historial y seguimientos). Este
//  endpoint busca por nombre / teléfono / email dentro del alcance del usuario
//  (un vendedor solo ve SUS leads; el director ve todos). Sin texto, devuelve
//  los contactos más recientes para elegir de un toque.
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

export const GET = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  const where: Record<string, unknown> = { ...leadScope(user) };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.lead.findMany({
    where,
    orderBy: [{ lastContactAt: "desc" }, { updatedAt: "desc" }],
    take: 8,
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, type: true, createdAt: true },
      },
      _count: { select: { activities: true } },
    },
  });

  const leads = rows.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    projectSlug: l.projectSlug,
    projectName: l.projectName,
    stage: l.stage,
    temperature: l.temperature,
    source: l.source,
    notes: l.notes,
    lastContactAt: l.lastContactAt,
    nextActionAt: l.nextActionAt,
    nextActionNote: l.nextActionNote,
    activityCount: l._count.activities,
    lastActivity: l.activities[0] || null,
  }));

  return Response.json({ leads });
});
