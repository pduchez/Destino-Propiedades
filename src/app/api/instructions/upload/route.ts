/**
 * Subida de instrucciones por archivo.
 *  multipart: file, target ("brand" | "project"), projectId? (si target=project)
 * Extrae el texto y lo guarda en:
 *   - brand   -> BrandStrategy.masterInstruction (Instrucción Madre)
 *   - project -> Project.instructionDoc (ficha del proyecto)
 *
 * Formatos: .txt / .md (lectura directa) y .pdf (transcripción con Claude si hay
 * ANTHROPIC_API_KEY). Para otros formatos, pega el texto en el formulario.
 */
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { isAIConfigured } from "@/lib/ai/generate";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return errorJson("No se recibió ningún archivo.");

  const target = String(form.get("target") || "brand");
  const projectId = form.get("projectId");

  let text: string;
  try {
    text = await extractText(file);
  } catch (e) {
    return errorJson((e as Error).message, 400);
  }
  if (!text.trim()) {
    return errorJson("No se pudo extraer texto del archivo. Pega el contenido manualmente.");
  }

  if (target === "project") {
    if (typeof projectId !== "string" || !projectId) {
      return errorJson("Falta el proyecto destino.");
    }
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { instructionDoc: text },
    });
    return json({ ok: true, target: "project", projectId: project.id, chars: text.length });
  }

  // target = brand (Instrucción Madre)
  await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: { masterInstruction: text },
    create: { id: "default", masterInstruction: text },
  });
  return json({ ok: true, target: "brand", chars: text.length });
});

async function extractText(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  const buffer = Buffer.from(await file.arrayBuffer());

  const isText =
    type.startsWith("text/") ||
    /\.(txt|md|markdown)$/.test(name) ||
    type === "application/json";
  if (isText) {
    return buffer.toString("utf-8");
  }

  const isPdf = type === "application/pdf" || /\.pdf$/.test(name);
  if (isPdf) {
    if (!isAIConfigured()) {
      throw new Error(
        "Para subir PDF se necesita la API key de Claude. Mientras tanto, sube un .txt/.md o pega el texto.",
      );
    }
    return transcribePdf(buffer);
  }

  // Último intento: tratar como texto plano. Si trae bytes nulos, es binario.
  const asText = buffer.toString("utf-8");
  if (asText.indexOf(String.fromCharCode(0)) !== -1) {
    throw new Error("Formato no soportado. Sube .txt, .md o .pdf, o pega el texto.");
  }
  return asText;
}

async function transcribePdf(buffer: Buffer): Promise<string> {
  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || "").trim() });
  const b64 = buffer.toString("base64");
  const content = [
    {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: b64 },
    },
    {
      type: "text",
      text: "Transcribe TODO el contenido de este documento a Markdown limpio y legible (títulos, listas y tablas como texto). Devuelve únicamente el contenido transcrito, sin comentarios ni preámbulo.",
    },
  ];
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    // El tipo "document" puede no estar en los tipos del SDK 0.40; el runtime lo acepta.
    messages: [{ role: "user", content: content as never }],
  });
  const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text?.trim() ?? "";
}

export const dynamic = "force-dynamic";
