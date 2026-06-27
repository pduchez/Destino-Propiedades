/**
 * Seed de ejemplo: proyecto "Condado del Golfo" (datos de la Instrucción Madre)
 * + ficha (target María/residencial) + imágenes de stock públicas + 1 post por
 * red generado con Claude, dejado como borrador en la cola de Aprobación.
 *
 * Se ejecuta en el build de Vercel (donde están DATABASE_URL y ANTHROPIC_API_KEY).
 * Es idempotente: solo crea lo que falta y solo genera si aún no hay posts.
 * Nunca rompe el build (captura todos los errores y sale con código 0).
 *
 * Autocontenido (no usa los alias "@/..." para poder correr bajo tsx en build).
 */
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MASTER_INSTRUCTION } from "../src/lib/ai/masterInstruction";
import { NETWORK_META, NETWORKS, type Network } from "../src/lib/networks";

const prisma = new PrismaClient();
const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

const SLUG = "condado-del-golfo";

const FICHA = `Tipo: Residencial. Ubicación: Usulután, El Salvador.
Persona primaria: María (Diáspora Lifestyle, 55–72) — hogar de retiro, nostalgia, legado familiar. Objeción: "me parece muy caro". Gatillo: nostalgia, pertenencia, familia.
Tono: claridad máxima, trato de "usted", fotos cálidas (familia, naturaleza), cero jerga, CTA grande y simple.
Ángulo: "Volver a casa" — un hogar de retiro accesible, con financiamiento a largo plazo. Sube narrativa emocional + confianza; baja datos técnicos.
Acento de color: #84CC16 (residencial/comunidad).
Rango de precio: USD 120,000–250,000.
Destino: WhatsApp (el número exacto está pendiente de confirmar por el operador; usa un CTA genérico a WhatsApp o al portal mientras tanto).
No inventar: financiamiento exacto, m², fotos hero ni número de WhatsApp si no se han confirmado.`;

const IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    tags: ["fachada", "residencial"],
  },
  {
    url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
    tags: ["casa", "familia"],
  },
  {
    url: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80",
    tags: ["comunidad", "naturaleza"],
  },
];

async function main() {
  // 1) Asegura la Instrucción Madre por defecto.
  const brand = await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  if (!brand.masterInstruction || !brand.masterInstruction.trim()) {
    await prisma.brandStrategy.update({
      where: { id: "default" },
      data: { masterInstruction: DEFAULT_MASTER_INSTRUCTION },
    });
  }

  // 2) Upsert del proyecto Condado del Golfo.
  const project = await prisma.project.upsert({
    where: { slug: SLUG },
    update: { instructionDoc: FICHA },
    create: {
      name: "Condado del Golfo",
      slug: SLUG,
      location: "Usulután, El Salvador",
      propertyType: "Residencial",
      status: "active",
      priceFrom: "120,000",
      currency: "USD",
      description:
        "Proyecto residencial en Usulután, pensado como hogar de retiro accesible para la diáspora salvadoreña. Rango USD 120,000–250,000, con opción de financiamiento a largo plazo.",
      amenities: JSON.stringify(["Comunidad cerrada", "Zonas verdes", "Espacios familiares"]),
      highlights: JSON.stringify([
        "Hogar de retiro accesible",
        "Financiamiento a largo plazo",
        "Volver a casa con tranquilidad",
      ]),
      hashtags: JSON.stringify(["#CondadoDelGolfo", "#Usulután"]),
      websiteUrl: "https://destinopropiedades.com",
      contactInfo: "",
      instructionDoc: FICHA,
    },
  });

  // 3) Imágenes de stock públicas (solo si el proyecto no tiene ninguna).
  const assetCount = await prisma.asset.count({ where: { projectId: project.id } });
  if (assetCount === 0) {
    for (const img of IMAGES) {
      await prisma.asset.create({
        data: {
          projectId: project.id,
          filename: img.url,
          originalName: img.url.split("/").pop() || "imagen",
          url: img.url,
          mimeType: "image/jpeg",
          tags: JSON.stringify(img.tags),
        },
      });
    }
  }

  // 4) Genera 1 post por red (solo si aún no hay posts y hay API key).
  const postCount = await prisma.post.count({ where: { projectId: project.id } });
  if (postCount > 0) {
    console.log("[seed-condado] El proyecto ya tiene posts; no se generan ejemplos.");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[seed-condado] Sin ANTHROPIC_API_KEY: proyecto e imágenes listos; genera los posts desde el dashboard.");
    return;
  }

  const assets = await prisma.asset.findMany({ where: { projectId: project.id } });
  const client = new Anthropic();
  const masterInstruction =
    (await prisma.brandStrategy.findUnique({ where: { id: "default" } }))
      ?.masterInstruction || DEFAULT_MASTER_INSTRUCTION;

  for (const network of NETWORKS as Network[]) {
    try {
      const copy = await generateForNetwork(client, masterInstruction, network);
      const asset = assets.length
        ? assets[Math.floor(Math.random() * assets.length)]
        : null;
      await prisma.post.create({
        data: {
          projectId: project.id,
          network,
          status: "draft",
          caption: copy.caption,
          hashtags: JSON.stringify(copy.hashtags),
          callToAction: copy.callToAction,
          assetIds: JSON.stringify(asset ? [asset.id] : []),
          model: MODEL,
        },
      });
      console.log(`[seed-condado] Post generado: ${network}`);
    } catch (e) {
      console.error(`[seed-condado] Falló la generación de ${network}:`, (e as Error).message);
    }
  }
}

interface Copy {
  caption: string;
  hashtags: string[];
  callToAction: string;
}

async function generateForNetwork(
  client: Anthropic,
  masterInstruction: string,
  network: Network,
): Promise<Copy> {
  const meta = NETWORK_META[network];
  const system = [
    `Eres el estratega de redes sociales de "Destino Propiedades" (https://destinopropiedades.com). Escribe SIEMPRE en español.`,
    ``,
    `### INSTRUCCIÓN MADRE (autoridad estratégica):`,
    masterInstruction,
    ``,
    `Tu tarea ahora es redactar el copy de UNA publicación para ${meta.label}. Ignora cualquier parte del documento sobre formatos JSON o calendarios.`,
    `No inventes datos que no estén indicados. Si falta un dato, omítelo con naturalidad (sin marcadores tipo [REQUIERE_DATO]).`,
  ].join("\n");

  const user = [
    `Genera UNA publicación para ${meta.label}.`,
    `Guía de estilo: ${meta.styleGuide}`,
    `Longitud máxima del cuerpo: ${meta.captionLimit} caracteres. Hashtags: entre ${meta.hashtagRange[0]} y ${meta.hashtagRange[1]}.`,
    meta.requiresVideo ? `Nota: TikTok usa video vertical; el caption acompaña un reel.` : ``,
    ``,
    `### Proyecto: Condado del Golfo`,
    `- Ubicación: Usulután, El Salvador. Tipo: Residencial. Precio desde: USD 120,000 (rango 120,000–250,000).`,
    `- Ficha (autoridad, respeta el target): ${FICHA}`,
    ``,
    `Responde ÚNICAMENTE con un objeto JSON: {"caption": "...", "hashtags": ["#..."], "callToAction": "..."}`,
  ]
    .filter(Boolean)
    .join("\n");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  const raw = block?.text ?? "{}";
  const parsed = extractJson(raw) as Copy;
  const max = meta.hashtagRange[1];
  const hashtags = (parsed.hashtags || [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`))
    .slice(0, max);
  return {
    caption: String(parsed.caption || "").trim(),
    hashtags,
    callToAction: String(parsed.callToAction || "").trim(),
  };
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const a = cleaned.indexOf("{");
    const b = cleaned.lastIndexOf("}");
    if (a !== -1 && b !== -1 && b > a) return JSON.parse(cleaned.slice(a, b + 1));
    throw new Error("Respuesta sin JSON válido");
  }
}

main()
  .catch((e) => console.error("[seed-condado] Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
