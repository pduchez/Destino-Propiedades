/**
 * Autoevaluación de la estrategia: analiza el rendimiento real (métricas por
 * red/proyecto) y propone ajustes concretos para mejorar eficiencia y eficacia.
 * Usa Claude si hay API key; si no, cae a un análisis heurístico para que el
 * sistema sea usable de extremo a extremo.
 */
import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured, sanitizeKey } from "@/lib/ai/generate";
import type { MetricsReport } from "@/lib/metrics";

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export interface Evaluation {
  summary: string;
  recommendations: string;
  usedAI: boolean;
}

export interface EvaluateInput {
  report: MetricsReport;
  brandName: string;
  masterInstruction: string;
  existingLearnings: string;
}

const pct = (e: number | null) => (e == null ? "s/d" : `${(e * 100).toFixed(1)}%`);

function reportToText(r: MetricsReport): string {
  const lines: string[] = [];
  const t = r.totals;
  lines.push(
    `Período: ${r.since.slice(0, 10)} a ${r.until.slice(0, 10)}. Posts con datos: ${t.posts}.`,
    `Totales — likes ${t.likes}, comentarios ${t.comments}, compartidos ${t.shares}, impresiones ${t.impressions}, alcance ${t.reach}, clics ${t.clicks}, guardados ${t.saves}, engagement ${pct(t.engagement)}.`,
    `Por red:`,
  );
  for (const n of r.byNetwork) {
    lines.push(
      `- ${n.network}: ${n.posts} posts · likes ${n.likes} · compartidos ${n.shares} · impresiones ${n.impressions} · clics ${n.clicks} · engagement ${pct(n.engagement)}`,
    );
  }
  lines.push(`Por proyecto:`);
  for (const p of r.byProject) {
    lines.push(
      `- ${p.projectName}: ${p.posts} posts · likes ${p.likes} · compartidos ${p.shares} · impresiones ${p.impressions} · clics ${p.clicks} · engagement ${pct(p.engagement)}`,
    );
  }
  if (r.topPosts.length) {
    lines.push(`Mejores posts:`);
    for (const tp of r.topPosts) {
      lines.push(
        `- [${tp.network} · ${tp.project}] "${tp.caption}" — likes ${tp.likes}, compartidos ${tp.shares}, engagement ${pct(tp.engagement)}`,
      );
    }
  }
  return lines.join("\n");
}

export async function evaluateStrategy(input: EvaluateInput): Promise<Evaluation> {
  const { report } = input;
  if (report.totals.posts === 0) {
    return {
      summary:
        "Aún no hay métricas registradas en el período. Registra likes, compartidos e impresiones de los posts publicados para activar el análisis.",
      recommendations:
        "Empieza por cargar las métricas de los primeros posts (manual o, en Fase 2, automático desde Meta/X/TikTok).",
      usedAI: false,
    };
  }

  if (!isAIConfigured()) return heuristic(report);

  const client = new Anthropic({ apiKey: sanitizeKey() });
  const system = `Eres analista de marketing de redes sociales del portal inmobiliario "${input.brandName}". Analizas el rendimiento real (métricas tipo Meta Business) y propones AJUSTES CONCRETOS y accionables a la estrategia de contenido, por red social y por proyecto, para subir el engagement y los clics a WhatsApp. Sé específico, comercial y realista. No inventes cifras: razona solo sobre los datos provistos.`;
  const user = `Datos de rendimiento del período:\n\n${reportToText(report)}\n\n${
    input.existingLearnings.trim()
      ? `Aprendizajes previos ya aplicados:\n${input.existingLearnings.trim()}\n\n`
      : ""
  }Responde ÚNICAMENTE con un JSON válido con esta forma:
{
  "summary": "2-4 frases: qué funcionó y qué no, por red y por proyecto",
  "recommendations": "lista de 3-6 ajustes concretos (cada uno empieza con '- '), priorizados, accionables para la próxima semana"
}`;

  try {
    const resp = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    const parsed = extractJson(block?.text ?? "{}") as {
      summary?: string;
      recommendations?: string;
    };
    return {
      summary: (parsed.summary || "").trim() || "Sin resumen.",
      recommendations: (parsed.recommendations || "").trim() || "Sin recomendaciones.",
      usedAI: true,
    };
  } catch {
    // Si la IA falla, no rompemos: damos el análisis heurístico.
    return heuristic(report);
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(cleaned.slice(s, e + 1));
    return {};
  }
}

/** Análisis heurístico sin IA (resiliente y usable en modo demo). */
function heuristic(r: MetricsReport): Evaluation {
  const nets = [...r.byNetwork].sort(
    (a, b) => (b.engagement ?? 0) - (a.engagement ?? 0),
  );
  const projs = [...r.byProject].sort(
    (a, b) => (b.engagement ?? 0) - (a.engagement ?? 0),
  );
  const topNet = nets[0];
  const lowNet = nets[nets.length - 1];
  const topProj = projs[0];

  const summary =
    `En el período se midieron ${r.totals.posts} posts. ` +
    (topNet
      ? `La red con mejor engagement fue ${topNet.network} (${pct(topNet.engagement)}); la más floja, ${lowNet.network} (${pct(lowNet.engagement)}). `
      : "") +
    (topProj ? `El proyecto con mejor desempeño fue ${topProj.projectName}.` : "");

  const recs: string[] = [];
  if (topNet) recs.push(`- Subir frecuencia y presupuesto en ${topNet.network}: es donde más resuena el contenido.`);
  if (lowNet && lowNet.network !== topNet?.network)
    recs.push(`- Replantear el formato en ${lowNet.network} (gancho, primera línea, tipo de imagen) antes de invertir más.`);
  if (r.topPosts[0])
    recs.push(`- Repetir el ángulo del mejor post ("${r.topPosts[0].caption}") en próximas piezas.`);
  if (r.totals.clicks === 0)
    recs.push(`- Reforzar el CTA a WhatsApp: hubo interacciones pero pocos/ningún clic; hacer el llamado más directo y temprano.`);
  recs.push(`- Mantener el precio de entrada "desde" visible: es el gancho de accesibilidad que abre conversaciones.`);

  return { summary, recommendations: recs.join("\n"), usedAI: false };
}
