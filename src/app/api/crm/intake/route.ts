/**
 * INTAKE de WhatsApp → CRM.  (Punto de "pegado" para el bot externo de WhatsApp,
 * también movido por Claude.)
 *
 * Este endpoint es el ÚNICO contrato que necesita el bot para alimentar el CRM.
 * Flujo previsto:
 *   1. Un prospecto llega desde un post en redes al WhatsApp del negocio.
 *   2. El bot (Claude) conversa. En cada turno relevante hace POST aquí con los
 *      mensajes nuevos → se crea/actualiza el lead y se registra la conversación.
 *   3. Si el bot agenda una cita (sin humano), manda `appointment` → se crea la
 *      cita en la agenda del vendedor y en el log del cliente, y el lead pasa a
 *      etapa "visita".
 *   4. Si el prospecto pide un humano (`requestHuman:true`), se asigna un vendedor
 *      (el indicado o por reparto equitativo) y se marca el handoff → a partir de
 *      ahí la conversación sigue en el WhatsApp de ese vendedor (p. ej. Ventas1).
 *
 * Autenticación: cabecera  Authorization: Bearer <INTAKE_SECRET>  (o ?key=).
 * (Independiente del login del panel: lo llama un servidor, no una persona.)
 *
 * Dedupe: se identifica el lead por `waThreadId` y, si no, por `phone`.
 */
import { prisma } from "@/lib/db";
import { ensureDefaultOrg } from "@/lib/crm";
import { STAGE_LABEL } from "@/lib/crm";

export const dynamic = "force-dynamic";

interface IntakeMessage {
  from: "prospect" | "assistant" | "seller"; // quién habló
  text: string;
  at?: string; // ISO opcional
}
interface IntakeBody {
  waThreadId?: string;
  phone?: string;
  name?: string;
  source?: string; // default whatsapp
  projectSlug?: string;
  projectName?: string;
  messages?: IntakeMessage[];
  requestHuman?: boolean;
  assignTo?: string; // username del vendedor (ventas1..5); si no, reparto
  appointment?: { at: string; location?: string; notes?: string };
  temperature?: string;
  value?: number;
  budget?: string;
  notes?: string;
}

function authorized(req: Request): boolean {
  const secret = (process.env.INTAKE_SECRET || process.env.CRON_SECRET || "").trim();
  // Sin secreto configurado: sólo permitido fuera de producción (para pruebas).
  if (!secret) return process.env.NODE_ENV !== "production";
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization") || "";
  return bearer === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

/** Elige el vendedor con menos leads abiertos (reparto equitativo). */
async function pickSeller(preferUsername?: string): Promise<string | null> {
  if (preferUsername) {
    const u = await prisma.user.findFirst({
      where: { username: { equals: preferUsername, mode: "insensitive" }, role: "sales" },
    });
    if (u) return u.id;
  }
  const sellers = await prisma.user.findMany({ where: { role: "sales" } });
  if (sellers.length === 0) return null;
  let best = sellers[0].id;
  let bestCount = Infinity;
  for (const s of sellers) {
    const count = await prisma.lead.count({
      where: { assignedToId: s.id, stage: { notIn: ["ganado", "perdido"] } },
    });
    if (count < bestCount) {
      bestCount = count;
      best = s.id;
    }
  }
  return best;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "No autorizado (falta INTAKE_SECRET)" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as IntakeBody;
  const phone = (body.phone || "").trim();
  const waThreadId = (body.waThreadId || "").trim();
  if (!phone && !waThreadId) {
    return Response.json({ error: "Se requiere phone o waThreadId" }, { status: 400 });
  }

  const org = await ensureDefaultOrg();

  // 1) Localizar o crear el lead (dedupe por hilo, luego por teléfono).
  let lead =
    (waThreadId && (await prisma.lead.findFirst({ where: { waThreadId } }))) ||
    (phone && (await prisma.lead.findFirst({ where: { phone } }))) ||
    null;

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        orgId: org.id,
        name: body.name?.trim() || "Prospecto WhatsApp",
        phone,
        source: body.source || "whatsapp",
        projectSlug: body.projectSlug || "",
        projectName: body.projectName || "",
        waThreadId,
        stage: "nuevo",
        temperature: body.temperature || "tibio",
        value: Number(body.value) || 0,
        budget: body.budget || "",
        notes: body.notes || "",
        lastContactAt: new Date(),
      },
    });
    await prisma.activity.create({
      data: { leadId: lead.id, type: "whatsapp", body: "🟢 Nuevo prospecto entró por WhatsApp (bot)." },
    });
  } else {
    // Actualizar datos que hayan llegado nuevos.
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        name: body.name?.trim() || lead.name,
        waThreadId: waThreadId || lead.waThreadId,
        projectSlug: body.projectSlug || lead.projectSlug,
        projectName: body.projectName || lead.projectName,
        temperature: body.temperature || lead.temperature,
        value: body.value != null ? Number(body.value) : lead.value,
        budget: body.budget || lead.budget,
        lastContactAt: new Date(),
      },
    });
  }

  // 2) Registrar los mensajes de la conversación en la línea de tiempo.
  for (const m of body.messages || []) {
    if (!m?.text) continue;
    const who = m.from === "prospect" ? "🧑 Prospecto" : m.from === "seller" ? "💼 Vendedor" : "🤖 Asistente";
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "whatsapp",
        body: `${who}: ${m.text}`,
        createdAt: m.at ? new Date(m.at) : undefined,
      },
    });
  }

  // 3) Handoff a humano si se solicita (o si viene assignTo explícito).
  let assignedSellerId = lead.assignedToId;
  if (body.requestHuman || body.assignTo) {
    if (!assignedSellerId || body.assignTo) {
      assignedSellerId = await pickSeller(body.assignTo);
    }
    if (assignedSellerId) {
      const seller = await prisma.user.findUnique({ where: { id: assignedSellerId } });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          assignedToId: assignedSellerId,
          handledBy: "seller",
          handoffAt: new Date(),
          stage: lead.stage === "nuevo" ? "contactado" : lead.stage,
        },
      });
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "director",
          body: `🤝 Handoff a ${seller?.displayName || seller?.username}. El prospecto pidió atención humana; continúa en su WhatsApp.`,
        },
      });
    }
  }

  // 4) Cita agendada por el bot (sin intervención humana).
  let appointmentId: string | null = null;
  if (body.appointment?.at) {
    const when = new Date(body.appointment.at);
    const appt = await prisma.appointment.create({
      data: {
        leadId: lead.id,
        sellerId: assignedSellerId,
        scheduledAt: when,
        location: body.appointment.location || "",
        notes: body.appointment.notes || "",
        createdBy: "bot",
      },
    });
    appointmentId = appt.id;
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: ["ganado", "perdido"].includes(lead.stage) ? lead.stage : "visita",
        nextActionAt: when,
        nextActionNote: "Cita agendada por el bot",
      },
    });
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "visita",
        body: `📅 Cita agendada por el bot para ${when.toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" })}${
          body.appointment.location ? ` · ${body.appointment.location}` : ""
        }.`,
      },
    });
  }

  const fresh = await prisma.lead.findUnique({
    where: { id: lead.id },
    include: { assignedTo: { select: { username: true, displayName: true } } },
  });
  return Response.json({
    ok: true,
    leadId: lead.id,
    stage: fresh?.stage,
    stageLabel: STAGE_LABEL[fresh?.stage || ""] || fresh?.stage,
    assignedTo: fresh?.assignedTo?.username || null,
    handedOff: !!fresh?.handoffAt,
    appointmentId,
  });
}

/** GET → documentación viva del contrato (para el equipo de WhatsApp). */
export async function GET() {
  return Response.json({
    endpoint: "POST /api/crm/intake",
    auth: "Authorization: Bearer <INTAKE_SECRET>  (o ?key=<INTAKE_SECRET>)",
    dedupe: "waThreadId, luego phone",
    body: {
      waThreadId: "string (id del hilo de WhatsApp, recomendado)",
      phone: "string (+503...)",
      name: "string?",
      source: "whatsapp | facebook | instagram | ... (default whatsapp)",
      projectSlug: "string? (slug del proyecto de interés)",
      projectName: "string?",
      messages: "[{ from: 'prospect'|'assistant'|'seller', text, at? }]",
      requestHuman: "bool (true → handoff a un vendedor)",
      assignTo: "string? (username ventas1..5; si no, reparto equitativo)",
      appointment: "{ at: ISO, location?, notes? }  (cita agendada por el bot)",
      temperature: "caliente|tibio|frio?",
      value: "number?",
      budget: "string?",
      notes: "string?",
    },
    returns: "{ ok, leadId, stage, assignedTo, handedOff, appointmentId }",
  });
}
