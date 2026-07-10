// ============================================================================
//  Asistente de Cierre — Preguntas frecuentes ("Financiamiento")
// ============================================================================
//
//  GET    /api/asistente/faqs          -> lista (todos los usuarios)
//  POST   /api/asistente/faqs          -> crear una  (Director1) o, si el body
//                                          trae {items:[...]}, reemplazar todas
//                                          (importar). (Director1)
//  PATCH  /api/asistente/faqs          -> editar una (Director1)
//  DELETE /api/asistente/faqs?id=XXX   -> eliminar una (Director1)
//
//  Editable por el Director sin tocar código; se sincroniza a todo el Asistente.
//  La primera vez se siembra con el set base de config/legal.ts.
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { requireUser, crmRoute, HttpError } from "@/lib/crmServer";
import { FAQS } from "@/asistente/config/legal";

export const dynamic = "force-dynamic";

/** Siembra idempotente del set base la primera vez. */
async function ensureSeedFaqs() {
  const count = await prisma.faqCierre.count();
  if (count > 0) return;
  await prisma.faqCierre.createMany({
    data: FAQS.map((f, i) => ({
      pregunta: f.pregunta,
      respuesta: f.respuesta,
      orden: i,
      activo: true,
    })),
  });
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin")
    throw new HttpError("Solo el Director puede editar las preguntas", 403);
  return user;
}

export const GET = crmRoute(async () => {
  await requireUser();
  try {
    await ensureSeedFaqs();
    const faqs = await prisma.faqCierre.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    });
    return Response.json({ faqs });
  } catch {
    // Sin BD: se devuelve el set base para no romper el módulo.
    return Response.json({
      faqs: FAQS.map((f, i) => ({
        id: `seed-${i}`,
        pregunta: f.pregunta,
        respuesta: f.respuesta,
        orden: i,
        activo: true,
      })),
    });
  }
});

export const POST = crmRoute(async (req: Request) => {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Importar / reemplazar todas.
  if (Array.isArray(body.items)) {
    const items = body.items as {
      pregunta?: string;
      respuesta?: string;
      orden?: number;
      activo?: boolean;
    }[];
    await prisma.$transaction([
      prisma.faqCierre.deleteMany({}),
      prisma.faqCierre.createMany({
        data: items
          .filter((it) => String(it.pregunta || "").trim())
          .map((it, i) => ({
            pregunta: String(it.pregunta).trim(),
            respuesta: String(it.respuesta || "").trim(),
            orden: Number.isFinite(it.orden) ? Number(it.orden) : i,
            activo: it.activo !== false,
          })),
      }),
    ]);
    const faqs = await prisma.faqCierre.findMany({ orderBy: { orden: "asc" } });
    return Response.json({ faqs });
  }

  // Crear una.
  const pregunta = String(body.pregunta || "").trim();
  if (!pregunta) throw new HttpError("La pregunta es obligatoria", 400);
  const max = await prisma.faqCierre.aggregate({ _max: { orden: true } });
  const faq = await prisma.faqCierre.create({
    data: {
      pregunta,
      respuesta: String(body.respuesta || "").trim(),
      orden: (max._max.orden ?? -1) + 1,
      activo: body.activo !== false,
    },
  });
  return Response.json({ faq }, { status: 201 });
});

export const PATCH = crmRoute(async (req: Request) => {
  await requireAdmin();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(b.id || "");
  if (!id) throw new HttpError("Falta id", 400);
  const data: Record<string, unknown> = {};
  if (b.pregunta !== undefined) data.pregunta = String(b.pregunta).trim();
  if (b.respuesta !== undefined) data.respuesta = String(b.respuesta).trim();
  if (b.orden !== undefined) data.orden = Number(b.orden) || 0;
  if (b.activo !== undefined) data.activo = Boolean(b.activo);
  const faq = await prisma.faqCierre.update({ where: { id }, data });
  return Response.json({ faq });
});

export const DELETE = crmRoute(async (req: Request) => {
  await requireAdmin();
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) throw new HttpError("Falta id", 400);
  await prisma.faqCierre.delete({ where: { id } });
  return Response.json({ ok: true });
});
