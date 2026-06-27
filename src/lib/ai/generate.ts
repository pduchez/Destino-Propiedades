/**
 * Generación de copys con Claude (Anthropic).
 * Pide al modelo una respuesta JSON y la parsea de forma tolerante, de modo que
 * funciona con cualquier versión del SDK. Si no hay ANTHROPIC_API_KEY, cae a un
 * generador por plantillas para que el sistema sea usable end-to-end (modo demo).
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { NETWORK_META, type Network } from "@/lib/networks";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type GenerationInput,
} from "@/lib/ai/prompts";

export const PostCopySchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  callToAction: z.string(),
});

export type PostCopy = z.infer<typeof PostCopySchema>;

export interface GenerateResult extends PostCopy {
  model: string;
  usedAI: boolean;
}

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const JSON_INSTRUCTION = `
Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin bloques de código) con esta forma exacta:
{
  "caption": "cuerpo del post sin los hashtags",
  "hashtags": ["#uno", "#dos"],
  "callToAction": "llamado a la acción breve"
}`;

export async function generateCopy(
  input: GenerationInput,
): Promise<GenerateResult> {
  if (!isAIConfigured()) {
    return { ...templateCopy(input), model: "plantilla", usedAI: false };
  }

  // Limpia espacios/saltos de línea accidentales al pegar la clave en Vercel.
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(input.brand);
  const user = buildUserPrompt(input) + "\n" + JSON_INSTRUCTION;

  let response;
  try {
    response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err.status === 401) {
      throw new Error(
        "La API key de Claude es inválida (401). En Vercel → Settings → Environment Variables, revisa ANTHROPIC_API_KEY: que esté COMPLETA, sin espacios ni saltos de línea, y que sea una clave activa de console.anthropic.com. Luego vuelve a desplegar (Redeploy).",
      );
    }
    if (err.status === 429) {
      throw new Error(
        "Límite de uso de Claude alcanzado (429). Revisa el saldo/los límites de tu cuenta en console.anthropic.com e inténtalo de nuevo.",
      );
    }
    throw new Error(`Error al generar con Claude: ${err.message || "desconocido"}`);
  }

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const raw = textBlock?.text ?? "{}";
  const parsed = PostCopySchema.parse(extractJson(raw));

  return {
    caption: parsed.caption.trim(),
    hashtags: normalizeHashtags(parsed.hashtags, input.network),
    callToAction: parsed.callToAction.trim(),
    model: response.model || DEFAULT_MODEL,
    usedAI: true,
  };
}

/** Extrae el primer objeto JSON de un texto (tolerante a fences ```json). */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("La respuesta del modelo no contenía JSON válido.");
  }
}

function normalizeHashtags(tags: string[], network: Network): string[] {
  const max = NETWORK_META[network].hashtagRange[1];
  const clean = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`));
  return Array.from(new Set(clean)).slice(0, max);
}

/** Generador de respaldo por plantillas (sin IA). */
function templateCopy(input: GenerationInput): PostCopy {
  const { project, brand, network } = input;
  const meta = NETWORK_META[network];
  const name = project?.name ?? brand.brandName;
  const loc = project?.location ? ` en ${project.location}` : "";
  const price =
    project?.priceFrom && project.priceFrom.length
      ? ` Desde ${project.priceFrom} ${project.currency}.`
      : "";
  const highlight = project?.highlights?.[0] ? ` ${project.highlights[0]}.` : "";

  const captionBase = project
    ? `Conoce ${name}${loc}.${highlight}${price} Vive el estilo de vida que mereces con ${brand.brandName}.`
    : `${brand.brandName}: encontramos el inmueble que transforma tu vida.${price} Explora nuestro portafolio.`;

  const caption = captionBase.slice(0, meta.captionLimit);
  const hashtags = normalizeHashtags(
    [...brand.defaultHashtags, ...(project?.hashtags ?? [])],
    network,
  );

  return {
    caption,
    hashtags,
    callToAction:
      "Escríbenos por WhatsApp o agenda tu visita en " + brand.portalUrl,
  };
}
