/**
 * Genera el GUION (storyboard) de un reel a partir de los datos REALES del
 * proyecto. Claude decide el gancho, el texto en pantalla de cada escena (una
 * por foto real), la tarjeta final con CTA a WhatsApp y el caption adaptado por
 * red. Sin voz (texto en pantalla + música). Cae a plantilla si no hay IA.
 */
import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured, sanitizeKey } from "@/lib/ai/generate";
import { NETWORK_META, type Network } from "@/lib/networks";
import type { ProjectContext } from "@/lib/ai/prompts";

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export interface StoryboardScene {
  photoIndex: number; // índice de la foto real que acompaña
  onScreenText: string; // texto corto en pantalla (mobile)
}
export interface NetworkCaption {
  caption: string;
  hashtags: string[];
  callToAction: string;
}
export interface Storyboard {
  scenes: StoryboardScene[];
  endCardText: string; // tarjeta final (cierre + CTA)
  musicMood: string;
  captions: Partial<Record<Network, NetworkCaption>>;
  usedAI: boolean;
}

export interface StoryboardInput {
  brand: { brandName: string };
  project: ProjectContext;
  photos: { url: string; alt: string }[];
  networks: Network[];
}

export async function generateStoryboard(input: StoryboardInput): Promise<Storyboard> {
  if (!isAIConfigured()) return template(input);

  const client = new Anthropic({ apiKey: sanitizeKey() });
  const p = input.project;
  const photoList = input.photos
    .map((ph, i) => `  ${i}: ${ph.alt || ph.url.split("/").pop()}`)
    .join("\n");
  const nets = input.networks.join(", ");

  const system = `Eres director creativo de reels inmobiliarios para "${input.brand.brandName}". Creas guiones de video vertical (9:16) SIN voz: solo fotos reales + texto en pantalla + música. Piensa creativo, analítico y crítico. Reglas NO negociables: usa SOLO datos reales del proyecto; si mencionas precio, usa el "desde" (el más accesible), nunca el más caro; el destino es WhatsApp; primera escena = gancho que detiene el scroll (≤ ~45 caracteres).`;

  const user = `Proyecto (datos reales, no inventar nada fuera de esto):
- Nombre: ${p.name}
- Ubicación: ${p.location}
- Tipo: ${p.propertyType}
- Precio desde (ENTRADA, úsalo tal cual si mencionas precio): ${p.priceFrom} ${p.currency}
- Descripción: ${p.description}
- Amenidades: ${p.amenities.join(", ")}
- Puntos destacados: ${p.highlights.join(", ")}
${p.instructionDoc ? `- Ficha/instrucción del proyecto (AUTORIDAD): ${p.instructionDoc}` : ""}

Fotos reales disponibles (por índice):
${photoList}

Redes destino: ${nets}. Se hará UN reel maestro y se adapta el caption por red.

Responde ÚNICAMENTE con JSON válido:
{
  "scenes": [ { "photoIndex": 0, "onScreenText": "texto corto en pantalla" } ],
  "endCardText": "cierre breve + invitación a WhatsApp",
  "musicMood": "aspiracional | cálida | moderna | épica",
  "captions": {
    ${input.networks.map((n) => `"${n}": { "caption": "cuerpo (≤${NETWORK_META[n].captionLimit} chars)", "hashtags": ["#.."], "callToAction": "CTA a WhatsApp" }`).join(",\n    ")}
  }
}
Usa entre 3 y ${Math.min(6, input.photos.length)} escenas, cada una con una foto distinta (photoIndex válido). La primera escena es el gancho.`;

  try {
    const resp = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1600,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const parsed = extractJson(block?.text ?? "{}") as Partial<Storyboard>;
    const scenes = normalizeScenes(parsed.scenes, input.photos.length);
    if (scenes.length === 0) return template(input);
    return {
      scenes,
      endCardText: (parsed.endCardText || "").trim() || `Escríbenos por WhatsApp — ${p.name}`,
      musicMood: (parsed.musicMood || "aspiracional").trim(),
      captions: sanitizeCaptions(parsed.captions, input.networks),
      usedAI: true,
    };
  } catch {
    return template(input);
  }
}

function normalizeScenes(scenes: unknown, photoCount: number): StoryboardScene[] {
  if (!Array.isArray(scenes)) return [];
  const out: StoryboardScene[] = [];
  for (const s of scenes) {
    const idx = Number((s as StoryboardScene)?.photoIndex);
    const text = String((s as StoryboardScene)?.onScreenText ?? "").trim();
    if (Number.isInteger(idx) && idx >= 0 && idx < photoCount) {
      out.push({ photoIndex: idx, onScreenText: text.slice(0, 90) });
    }
  }
  return out.slice(0, 6);
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

/** Guion de respaldo (sin IA): usa solo datos reales del proyecto. */
function template(input: StoryboardInput): Storyboard {
  const p = input.project;
  const bits = [
    `${p.name}`,
    p.location ? `📍 ${p.location}` : "",
    p.priceFrom ? `Desde ${p.priceFrom} ${p.currency}` : "",
    ...p.highlights.slice(0, 3),
  ].filter(Boolean);

  const n = Math.min(input.photos.length, Math.max(3, bits.length));
  const scenes: StoryboardScene[] = [];
  for (let i = 0; i < n; i++) {
    scenes.push({ photoIndex: i % input.photos.length, onScreenText: bits[i % bits.length] });
  }

  const captions: Partial<Record<Network, NetworkCaption>> = {};
  for (const net of input.networks) {
    const base = `${p.name}${p.location ? ` en ${p.location}` : ""}.${
      p.priceFrom ? ` Desde ${p.priceFrom} ${p.currency}.` : ""
    }`.slice(0, NETWORK_META[net].captionLimit);
    captions[net] = {
      caption: base,
      hashtags: p.hashtags.slice(0, NETWORK_META[net].hashtagRange[1]),
      callToAction: "Escríbenos por WhatsApp y te contamos todo.",
    };
  }

  return {
    scenes,
    endCardText: `${p.name} — Escríbenos por WhatsApp`,
    musicMood: "aspiracional",
    captions,
    usedAI: false,
  };
}
