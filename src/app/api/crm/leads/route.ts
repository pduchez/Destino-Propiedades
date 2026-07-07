import { prisma } from "@/lib/db";
import { requireUser, leadScope, crmRoute, HttpError } from "@/lib/crmServer";
import { ensureDefaultOrg, leadScore } from "@/lib/crm";

export const dynamic = "force-dynamic";

/** GET /api/crm/leads?stage=&source=&assignedTo=&project=&temp=&q= */
export const GET = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const p = url.searchParams;

  const where: Record<string, unknown> = { ...leadScope(user) };
  if (p.get("stage")) where.stage = p.get("stage");
  if (p.get("source")) where.source = p.get("source");
  if (p.get("temp")) where.temperature = p.get("temp");
  if (p.get("project")) where.projectSlug = p.get("project");
  // El director puede filtrar por vendedor; el vendedor ya está acotado.
  if (user.role === "admin" && p.get("assignedTo"))
    where.assignedToId = p.get("assignedTo");
  const q = p.get("q")?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.lead.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: { assignedTo: { select: { username: true, displayName: true } } },
    take: 500,
  });
  // Puntaje automático de calidad (0-100) para priorizar el seguimiento.
  const leads = rows.map((l) => ({ ...l, score: leadScore(l) }));
  if (p.get("sort") === "score") leads.sort((a, b) => b.score - a.score);
  return Response.json({ leads });
});

/** POST /api/crm/leads  — crea un lead. */
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  const org = await ensureDefaultOrg();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name || "").trim();
  if (!name) throw new HttpError("El nombre es obligatorio", 400);

  // Un vendedor sólo puede crear leads asignados a sí mismo.
  const assignedToId =
    user.role === "admin"
      ? (body.assignedToId as string) || user.id
      : user.id;

  const lead = await prisma.lead.create({
    data: {
      orgId: org.id,
      name,
      phone: String(body.phone || "").trim(),
      email: String(body.email || "").trim(),
      source: String(body.source || "whatsapp"),
      projectSlug: String(body.projectSlug || ""),
      projectName: String(body.projectName || ""),
      budget: String(body.budget || ""),
      value: Number(body.value) || 0,
      temperature: String(body.temperature || "tibio"),
      stage: String(body.stage || "nuevo"),
      notes: String(body.notes || ""),
      assignedToId,
      lastContactAt: new Date(),
    },
  });

  // Actividad inicial de creación.
  await prisma.activity.create({
    data: {
      leadId: lead.id,
      userId: user.id,
      type: "nota",
      body: `Lead creado (${SOURCE_NOTE(lead.source)}).`,
    },
  });
  return Response.json({ lead }, { status: 201 });
});

function SOURCE_NOTE(s: string) {
  return s === "whatsapp" ? "vía WhatsApp" : `fuente: ${s}`;
}
