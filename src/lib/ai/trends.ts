/**
 * Investigación quincenal de tendencias de posteo. ARS actúa creativo,
 * analítico y crítico: sintetiza las mejores prácticas y tendencias vigentes
 * por red social y propone ajustes concretos a la estrategia para ser más
 * efectivo y eficiente. Usa Claude; si no hay API key, cae a una base curada.
 */
import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured, sanitizeKey } from "@/lib/ai/generate";

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export interface TrendsBrief {
  brief: string; // panorama de tendencias por red
  instructionDelta: string; // ajustes accionables para la estrategia
  usedAI: boolean;
}

export async function researchTrends(brandName: string, context: string): Promise<TrendsBrief> {
  if (!isAIConfigured()) return curated();

  const client = new Anthropic({ apiKey: sanitizeKey() });
  const system = `Eres el estratega de contenido de "${brandName}", experto en redes sociales inmobiliarias (Facebook, Instagram, X, TikTok). Piensa de forma creativa, analítica y CRÍTICA. Con tu conocimiento de las mejores prácticas vigentes, produce un informe accionable de tendencias de posteo para las próximas 2 semanas y ajustes concretos a la estrategia.`;
  const user = `Contexto del negocio:\n${context}\n\nResponde ÚNICAMENTE con JSON válido:
{
  "brief": "panorama breve de tendencias vigentes por red (Facebook, Instagram, X, TikTok): formatos, ganchos, duración, hashtags, horarios, tipos de creativo que están funcionando",
  "instructionDelta": "lista de 4-7 ajustes concretos (cada uno empieza con '- ') para aplicar YA a la estrategia de ${brandName}, priorizados por impacto"
}`;

  try {
    const resp = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const parsed = extractJson(block?.text ?? "{}") as { brief?: string; instructionDelta?: string };
    return {
      brief: (parsed.brief || "").trim() || curated().brief,
      instructionDelta: (parsed.instructionDelta || "").trim() || curated().instructionDelta,
      usedAI: true,
    };
  } catch {
    return curated();
  }
}

function extractJson(text: string): unknown {
  const c = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(c);
  } catch {
    const s = c.indexOf("{");
    const e = c.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(c.slice(s, e + 1));
    return {};
  }
}

/** Base curada de respaldo (sin IA). */
function curated(): TrendsBrief {
  return {
    brief:
      "Facebook: video corto vertical y carruseles con historia; el texto largo funciona si la 1ª línea engancha. " +
      "Instagram: Reels 9:16 con gancho en 1-2 s, audio en tendencia, texto en pantalla; carrusel para 'antes/después' y datos. " +
      "X: hilos cortos, 1 idea fuerte por post, imagen o dato; poco hashtag. " +
      "TikTok: video nativo 9:16, tono humano y auténtico, 'point of view', tours rápidos, captions con pregunta.",
    instructionDelta:
      "- Priorizar video vertical 9:16 con gancho en los primeros 2 segundos.\n" +
      "- Añadir texto en pantalla en Reels/TikTok (accesibilidad + retención).\n" +
      "- Empezar cada pieza con una pregunta o un dato sorprendente (no con el nombre del proyecto).\n" +
      "- Reducir hashtags en X a 1–2; en IG usar 5–10 muy relevantes.\n" +
      "- Publicar tours rápidos y 'antes/después' de obra para mostrar avance real.\n" +
      "- Reforzar el CTA a WhatsApp en los primeros segundos/renglones, no solo al final.",
    usedAI: false,
  };
}
