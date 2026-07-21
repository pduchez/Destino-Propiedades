/**
 * Genera SOLO el texto (contenido) del reel a partir de datos REALES: el
 * gancho, 3 beneficios cortos, el CTA y el caption por red. El DISEÑO ya no lo
 * hace ARS (lo pone la plantilla). Cae a plantilla si no hay IA.
 */
import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured, sanitizeKey } from "@/lib/ai/generate";
import { NETWORK_META, type Network } from "@/lib/networks";
import type { ProjectContext } from "@/lib/ai/prompts";

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export interface NetworkCaption {
  caption: string;
  hashtags: string[];
  callToAction: string;
}
export interface ReelCopy {
  hook: string;
  benefit_1: string;
  benefit_2: string;
  benefit_3: string;
  cta: string;
  captions: Partial<Record<Network, NetworkCaption>>;
  usedAI: boolean;
}
export interface ReelCopyInput {
  brandName: string;
  project: ProjectContext;
  networks: Network[];
}

export async function generateReelCopy(input: ReelCopyInput): Promise<ReelCopy> {
  if (!isAIConfigured()) return template(input);
  const p = input.project;

  const system = `Eres redactor publicitario de reels inmobiliarios para "${input.brandName}". Escribes textos CORTOS que rellenan una plantilla de video profesional. Reglas: usa SOLO datos reales del proyecto; el precio es el "desde" (el más accesible); el destino es WhatsApp; español salvadoreño cálido. El gancho debe detener el scroll.`;

  const user = `Proyecto (datos reales):
- Nombre: ${p.name}
- Ubicación: ${p.location}
- Tipo: ${p.propertyType}
- Precio desde: ${p.priceFrom} ${p.currency}
- Descripción: ${p.description}
- Amenidades: ${p.amenities.join(", ")}
- Destacados: ${p.highlights.join(", ")}
${p.instructionDoc ? `- Ficha (autoridad): ${p.instructionDoc}` : ""}

Responde ÚNICAMENTE con JSON válido:
{
  "hook": "gancho ≤40 caracteres, detiene el scroll",
  "benefit_1": "beneficio ≤26 chars (ubicación)",
  "benefit_2": "beneficio ≤26 chars (amenidad)",
  "benefit_3": "beneficio ≤26 chars (entorno)",
  "cta": "llamado corto a WhatsApp",
  "captions": {
    ${input.networks.map((n) => `"${n}": { "caption": "cuerpo ≤${NETWORK_META[n].captionLimit} chars", "hashtags": ["#.."], "callToAction": "CTA WhatsApp" }`).join(",\n    ")}
  }
}`;

  try {
    const client = new Anthropic({ apiKey: sanitizeKey() });
    const resp = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const j = extractJson(block?.text ?? "{}") as Partial<ReelCopy>;
    const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
    const hook = clip(j.hook, 42) || template(input).hook;
    return {
      hook,
      benefit_1: clip(j.benefit_1, 28) || (p.location || ""),
      benefit_2: clip(j.benefit_2, 28) || (p.highlights[0] ?? ""),
      benefit_3: clip(j.benefit_3, 28) || (p.highlights[1] ?? ""),
      cta: clip(j.cta, 40) || "Escríbenos por WhatsApp",
      captions: sanitizeCaptions(j.captions, input.networks),
      usedAI: true,
    };
  } catch {
    return template(input);
  }
}

function sanitizeCaptions(
  captions: unknown,
  networks: Network[],
): Partial<Record<Network, NetworkCaption>> {
  const out: Partial<Record<Network, NetworkCaption>> = {};
  const c = (captions ?? {}) as Record<string, Partial<NetworkCaption>>;
  for (const n of networks) {
    const v = c[n];
    if (v && typeof v.caption === "string") {
      out[n] = {
        caption: v.caption.trim().slice(0, NETWORK_META[n].captionLimit),
        hashtags: Array.isArray(v.hashtags) ? v.hashtags.map(String).filter(Boolean) : [],
        callToAction: (v.callToAction || "Escríbenos por WhatsApp").toString().trim(),
      };
    }
  }
  return out;
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

/** Copy de respaldo (sin IA): usa solo datos reales. */
function template(input: ReelCopyInput): ReelCopy {
  const p = input.project;
  const captions: Partial<Record<Network, NetworkCaption>> = {};
  for (const net of input.networks) {
    captions[net] = {
      caption: `${p.name}${p.location ? ` en ${p.location}` : ""}.${
        p.priceFrom ? ` Desde ${p.priceFrom} ${p.currency}.` : ""
      }`.slice(0, NETWORK_META[net].captionLimit),
      hashtags: p.hashtags.slice(0, NETWORK_META[net].hashtagRange[1]),
      callToAction: "Escríbenos por WhatsApp y te contamos todo.",
    };
  }
  return {
    hook: p.name,
    benefit_1: p.location || "",
    benefit_2: p.highlights[0] ?? "",
    benefit_3: p.highlights[1] ?? "",
    cta: "Escríbenos por WhatsApp",
    captions,
    usedAI: false,
  };
}
