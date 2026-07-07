import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";
import { ensureDefaultOrg, projectOptions } from "@/lib/crm";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/seed — carga datos de demostración (sólo director) para poder
 * ver el tablero y los reportes con contenido realista. Idempotente por defecto:
 * no hace nada si ya hay leads (usar { force:true } para recargar).
 */
export const POST = crmRoute(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError("Sólo el director", 403);
  const body = (await req.json().catch(() => ({}))) as { force?: boolean };

  const existing = await prisma.lead.count();
  if (existing > 0 && !body.force) {
    return Response.json({ ok: true, skipped: true, count: existing });
  }
  if (body.force) {
    await prisma.activity.deleteMany({});
    await prisma.lead.deleteMany({});
  }

  const org = await ensureDefaultOrg();
  const sellers = await prisma.user.findMany({ where: { role: "sales" } });
  if (sellers.length === 0) throw new HttpError("No hay vendedores", 400);
  const projects = projectOptions();

  const nombres = [
    "María Alvarenga", "Carlos Rivas", "Ana Beatriz Cruz", "José Menéndez",
    "Gabriela Portillo", "Luis Hernández", "Sofía Ramírez", "Diego Martínez",
    "Fernanda López", "Roberto Guzmán", "Claudia Flores", "Andrés Castillo",
    "Patricia Melgar", "Óscar Aguilar", "Lucía Domínguez", "Mario Cornejo",
    "Verónica Interiano", "Ricardo Peña", "Karla Escobar", "Julio Bonilla",
  ];
  const sources = ["whatsapp", "whatsapp", "whatsapp", "referido", "portal", "facebook", "instagram", "walk_in"];
  const stages = ["nuevo", "contactado", "calificado", "visita", "propuesta", "negociacion", "ganado", "perdido"];
  const temps = ["caliente", "tibio", "frio"];
  const pick = <T,>(a: T[], i: number) => a[i % a.length];
  const rnd = (n: number) => Math.floor(Math.random() * n);

  const now = Date.now();
  let created = 0;
  for (let i = 0; i < nombres.length; i++) {
    const proj = pick(projects, rnd(projects.length));
    const stage = pick(stages, rnd(stages.length));
    const seller = pick(sellers, i);
    const value = 25000 + rnd(120) * 1000;
    const daysAgo = rnd(45);
    const createdAt = new Date(now - daysAgo * 86400000);
    const lead = await prisma.lead.create({
      data: {
        orgId: org.id,
        name: nombres[i],
        phone: `+503 7${rnd(900) + 100} ${rnd(9000) + 1000}`,
        email: nombres[i].toLowerCase().replace(/[^a-z]/g, ".") + "@correo.com",
        source: pick(sources, rnd(sources.length)),
        projectSlug: proj?.slug || "",
        projectName: proj?.name || "",
        value,
        budget: `$${(value / 1000).toFixed(0)}k`,
        stage,
        temperature: pick(temps, rnd(temps.length)),
        lostReason: stage === "perdido" ? "Presupuesto insuficiente" : "",
        assignedToId: seller.id,
        createdAt,
        lastContactAt: new Date(now - rnd(daysAgo + 1) * 86400000),
        nextActionAt: ["ganado", "perdido"].includes(stage)
          ? null
          : new Date(now + (rnd(6) - 2) * 86400000),
        nextActionNote: "Dar seguimiento por WhatsApp",
      },
    });
    // Actividades de muestra.
    await prisma.activity.create({
      data: {
        leadId: lead.id, userId: seller.id, type: "whatsapp", createdAt,
        body: `Cliente escribió por WhatsApp interesado en ${proj?.name || "un proyecto"}. Pregunta por precios y disponibilidad.`,
      },
    });
    if (rnd(2)) {
      await prisma.activity.create({
        data: {
          leadId: lead.id, userId: seller.id, type: "nota",
          body: "Se le envió brochure y lista de lotes disponibles.",
          createdAt: new Date(createdAt.getTime() + 86400000),
        },
      });
    }
    if (!["ganado", "perdido"].includes(stage) && rnd(2)) {
      await prisma.activity.create({
        data: {
          leadId: lead.id, userId: seller.id, type: "tarea",
          body: "Confirmar visita al proyecto este fin de semana.",
          dueAt: new Date(now + (rnd(5) - 2) * 86400000),
        },
      });
    }
    created++;
  }
  return Response.json({ ok: true, created });
});
