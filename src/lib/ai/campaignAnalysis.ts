/**
 * Análisis de campañas con Claude: valida la campaña actual, la compara contra
 * campañas anteriores del proyecto, contra las tendencias del mercado y contra
 * las métricas reales, y devuelve recomendaciones PUNTUALES que el director
 * puede autorizar en combo. Si no hay IA, entrega una heurística útil.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { sanitizeKey, isAIConfigured } from "@/lib/ai/generate";

export const RecommendationSchema = z.object({
  field: z.enum(["name", "objective", "instructions", "networks", "status"]),
  label: z.string(),
  current: z.string(),
  suggested: z.string(),
  reason: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const AnalysisSchema = z.object({
  summary: z.string(),
  comparison: z.string(),
  recommendations: z.array(RecommendationSchema),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export interface CampaignFacts {
  brandName: string;
  learnings: string;
  campaign: {
    name: string;
    objective: string;
    instructions: string;
    networks: string[];
    status: string;
    projectName: string;
  };
  metricsSelf: MetricsAgg;
  previous: {
    name: string;
    objective: string;
    instructions: string;
    metrics: MetricsAgg;
  }[];
  trends: string[];
}

export interface MetricsAgg {
  posts: number;
  published: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
}

const OBJ_LABEL: Record<string, string> = {
  awareness: "Reconocimiento",
  leads: "Generación de leads",
  sales: "Ventas",
  launch: "Lanzamiento",
  event: "Evento",
};

export async function analyzeCampaign(facts: CampaignFacts): Promise<Analysis> {
  if (!isAIConfigured()) return heuristic(facts);

  const client = new Anthropic({ apiKey: sanitizeKey() });
  const system = `Eres el estratega de marketing inmobiliario de "${facts.brandName}" en El Salvador.
Analizas una CAMPAÑA y propones mejoras concretas y accionables. Eres crítico y basado en datos.
Compara la campaña actual contra: (1) las campañas anteriores del mismo proyecto y sus métricas
reales, (2) las tendencias del mercado provistas, (3) los aprendizajes acumulados de la marca.
Devuelve recomendaciones PUNTUALES, cada una sobre UN campo editable de la campaña
(name, objective, instructions, networks o status), con el valor actual, el sugerido y el porqué.
No inventes métricas. Si faltan datos, dilo en el resumen. Sé específico y conciso.`;

  const user = `DATOS (JSON):
${JSON.stringify(facts, null, 2)}

Responde ÚNICAMENTE con JSON válido (sin texto extra), con esta forma exacta:
{
  "summary": "diagnóstico breve de la campaña actual",
  "comparison": "cómo se compara vs campañas previas, métricas y tendencias",
  "recommendations": [
    { "field": "instructions", "label": "texto corto del cambio", "current": "valor actual", "suggested": "valor propuesto", "reason": "por qué" }
  ]
}
Para "networks", usa una lista separada por comas en current/suggested (ej. "facebook, instagram").`;

  try {
    const res = await client.messages.create({
      model: process.env.AI_MODEL || "claude-opus-4-8",
      max_tokens: 1600,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const parsed = AnalysisSchema.parse(extractJson(block?.text ?? "{}"));
    return parsed;
  } catch {
    return heuristic(facts);
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
    throw new Error("Sin JSON válido");
  }
}

/** Heurística de respaldo (sin IA): recomendaciones razonables por reglas. */
function heuristic(facts: CampaignFacts): Analysis {
  const recs: Recommendation[] = [];
  const c = facts.campaign;
  const m = facts.metricsSelf;

  if (!c.instructions || c.instructions.length < 40) {
    recs.push({
      field: "instructions",
      label: "Enriquecer la instrucción estratégica",
      current: c.instructions || "(vacía)",
      suggested:
        "Especifica el gancho principal (precio de entrada / cuota inicial), el diferenciador del proyecto y un llamado a la acción por WhatsApp.",
      reason: "Instrucciones detalladas producen copys más específicos y con mejor conversión.",
    });
  }
  if (!c.networks.includes("instagram")) {
    recs.push({
      field: "networks",
      label: "Agregar Instagram",
      current: c.networks.join(", "),
      suggested: [...c.networks, "instagram"].join(", "),
      reason: "Instagram es clave para bienes raíces por el peso visual (fotos embellecidas).",
    });
  }
  if (m.published > 0 && m.clicks === 0) {
    recs.push({
      field: "objective",
      label: "Reorientar a generación de leads",
      current: OBJ_LABEL[c.objective] || c.objective,
      suggested: "Generación de leads",
      reason: "Con publicaciones activas pero 0 clics, conviene priorizar CTA e interacción directa.",
    });
  }
  const summary =
    m.posts === 0
      ? "La campaña aún no tiene publicaciones para medir. Recomendaciones basadas en buenas prácticas."
      : `La campaña tiene ${m.published} posts publicados con ${m.impressions} impresiones y ${m.clicks} clics.`;
  const comparison =
    facts.previous.length === 0
      ? "No hay campañas anteriores del proyecto para comparar."
      : `Hay ${facts.previous.length} campaña(s) previa(s) del proyecto para referencia.`;
  return { summary, comparison, recommendations: recs };
}
