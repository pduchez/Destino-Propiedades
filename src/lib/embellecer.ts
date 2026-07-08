/**
 * Embellecedor de imágenes de ARS.
 *
 * Espíritu (marketing genuino y transparente): las fotos reales de los lotes
 * están "peladas" y poco atractivas. Con IA generamos una versión aspiracional
 * —"cómo podría llegar a verse"— manteniendo la geometría real del terreno, y
 * SIEMPRE con un sello legal discreto al pie que aclara que es una imagen
 * ilustrativa embellecida. El objetivo es que el cliente imagine el potencial,
 * no engañarlo. La foto original nunca se borra.
 *
 * Pipeline:  Claude escribe el prompt  →  fal.ai FLUX Kontext transforma la
 * foto real  →  sharp estampa el sello  →  se guarda como Asset "embellecida".
 */
import Anthropic from "@anthropic-ai/sdk";
import { sanitizeKey, isAIConfigured } from "@/lib/ai/generate";

export const EMBELLECER_DISCLAIMER =
  "Imagen ilustrativa embellecida digitalmente · referencial";

/** ¿Está configurada la llave de fal.ai? */
export function falConfigured(): boolean {
  return !!(process.env.FAL_KEY || process.env.FAL_API_KEY);
}
function falKey(): string {
  return (process.env.FAL_KEY || process.env.FAL_API_KEY || "").trim();
}

export interface ProjectHint {
  name: string;
  tipo?: string; // "playa" | "residencial" | ...
  location?: string;
  description?: string;
}

/** Estilos disponibles para el embellecido. */
export const ESTILOS = [
  { key: "auto", label: "Automático (según el proyecto)" },
  { key: "lote_limpio", label: "Lote limpio y nivelado" },
  { key: "casa_modelo", label: "Con casa modelo" },
  { key: "playa", label: "Aspiracional de playa" },
  { key: "residencial", label: "Residencial con jardines" },
  { key: "aereo", label: "Vista aérea / dron" },
] as const;

/**
 * Cerebro: Claude redacta la instrucción de edición para FLUX (en inglés, que
 * es donde mejor responde), respetando el terreno real y el realismo de El
 * Salvador. Si no hay IA, usa una plantilla sólida.
 */
export async function buildEditPrompt(
  project: ProjectHint | null,
  estilo: string,
): Promise<string> {
  if (!isAIConfigured()) return templatePrompt(project, estilo);

  const client = new Anthropic({ apiKey: sanitizeKey() });
  const system = `You are the creative engine of a real-estate marketing agent in El Salvador.
Your job: write ONE concise image-editing instruction (in ENGLISH) for the FLUX Kontext model.
The model receives a REAL, unattractive photo of an empty/raw land lot or property and must
transform it into an aspirational "how it could look" version.

Hard rules for the instruction you write:
- PRESERVE the real geometry: keep the lot boundaries, terrain shape, horizon line, roads and
  existing structures in the same position. Do NOT invent a different place.
- Make it realistic and photographic, NOT a cartoon or an obvious render. Natural daylight,
  blue sky with soft clouds, lush tropical Central-American vegetation, clean well-kept ground.
- Aspirational but believable for El Salvador (coastal or residential as applies).
- No text, no logos, no watermarks, no people faces in focus.
- One paragraph, imperative, specific, max ~70 words.
Return ONLY the instruction text, nothing else.`;

  const facts = project
    ? `Project: ${project.name}. Type: ${project.tipo || "n/a"}. Location: ${
        project.location || "El Salvador"
      }. Notes: ${(project.description || "").slice(0, 300)}`
    : "Generic institutional real-estate lot in El Salvador.";
  const styleHint = ESTILO_HINT[estilo] || ESTILO_HINT.auto;

  try {
    const res = await client.messages.create({
      model: process.env.AI_MODEL || "claude-opus-4-8",
      max_tokens: 300,
      system,
      messages: [
        { role: "user", content: `${facts}\nDesired style: ${styleHint}\nWrite the FLUX editing instruction.` },
      ],
    });
    const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const txt = (block?.text || "").trim();
    return txt || templatePrompt(project, estilo);
  } catch {
    return templatePrompt(project, estilo);
  }
}

const ESTILO_HINT: Record<string, string> = {
  auto: "choose the most fitting aspirational look based on the project type",
  lote_limpio: "a clean, leveled, ready-to-build lot with tidy grass and clear access",
  casa_modelo: "add a tasteful modern model house that fits the lot footprint",
  playa: "beachfront aspirational vibe: palm trees, ocean glimpse, golden light",
  residencial: "landscaped residential feel with gardens, trees and paved street",
  aereo: "aerial/drone perspective showing the developed lot within a green setting",
};

function templatePrompt(project: ProjectHint | null, estilo: string): string {
  const beach = project?.tipo === "playa" || estilo === "playa";
  const base =
    "Enhance this real photo of a land lot into an aspirational yet realistic version. " +
    "Keep the exact terrain shape, lot boundaries, horizon and any existing roads or structures in place. " +
    "Add clean well-kept grass, lush tropical Central American vegetation, a bright blue sky with soft clouds, " +
    "natural daylight and inviting, photographic quality. ";
  const extra = beach
    ? "Include subtle beachfront cues: palm trees and a distant ocean glimpse. "
    : "Include tidy landscaped gardens and a paved access street. ";
  const model = estilo === "casa_modelo" ? "Add a tasteful modern model house fitting the lot. " : "";
  return base + extra + model + "Photorealistic, no text, no watermark, no logos.";
}

interface FalResult {
  images?: { url: string }[];
  image?: { url: string };
}

/** Llama a fal.ai FLUX Kontext (image-to-image) y devuelve la URL resultante. */
export async function runFalKontext(imageUrl: string, prompt: string): Promise<string> {
  if (!falConfigured()) throw new Error("Falta FAL_KEY en el entorno.");
  const res = await fetch("https://fal.run/fal-ai/flux-pro/kontext", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      guidance_scale: 3.5,
      num_inference_steps: 30,
      output_format: "jpeg",
      safety_tolerance: "2",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as FalResult & { detail?: unknown };
  if (!res.ok) {
    const msg =
      typeof data.detail === "string" ? data.detail : `fal.ai HTTP ${res.status}`;
    throw new Error(msg);
  }
  const url = data.images?.[0]?.url || data.image?.url;
  if (!url) throw new Error("fal.ai no devolvió imagen.");
  return url;
}

/**
 * Estampa el sello legal discreto al pie (texto diminuto, casi transparente).
 * Usa sharp; si no está disponible, devuelve el buffer sin sello (con aviso).
 */
export async function stampDisclaimer(input: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const img = sharp(input);
  const meta = await img.metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  // Tamaño de fuente proporcional (muy pequeño), y franja inferior mínima.
  const fontSize = Math.max(11, Math.round(w * 0.016));
  const pad = Math.round(fontSize * 0.7);
  const barH = fontSize + pad * 2;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.28"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="url(#fade)"/>
    <text x="${w - pad}" y="${h - pad}" text-anchor="end"
      font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
      fill="#ffffff" fill-opacity="0.42"
      style="letter-spacing:0.3px">${esc(EMBELLECER_DISCLAIMER)}</text>
  </svg>`;
  return img
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

/** Descarga una URL a Buffer. */
export async function fetchToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen (HTTP ${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}
