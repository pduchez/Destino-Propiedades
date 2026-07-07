/**
 * Dominio del CRM: definición del embudo de ventas, catálogos y helpers.
 * Pensado para bienes raíces y en modo "enlatado" (multi-organización).
 */
import { prisma } from "@/lib/db";
import { proyectos } from "@/portal/data/proyectos";

export const DEFAULT_ORG = { name: "Grupo Chacón", slug: "grupo-chacon" };

/** Etapas del embudo, en orden. `won`/`lost` son estados terminales. */
export const STAGES = [
  { key: "nuevo", label: "Nuevo", color: "#64748b", terminal: false },
  { key: "contactado", label: "Contactado", color: "#0ea5e9", terminal: false },
  { key: "calificado", label: "Calificado", color: "#6366f1", terminal: false },
  { key: "visita", label: "Visita", color: "#a855f7", terminal: false },
  { key: "propuesta", label: "Propuesta", color: "#f59e0b", terminal: false },
  { key: "negociacion", label: "Negociación", color: "#f97316", terminal: false },
  { key: "ganado", label: "Ganado", color: "#22c55e", terminal: true },
  { key: "perdido", label: "Perdido", color: "#ef4444", terminal: true },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
export const OPEN_STAGES: string[] = STAGES.filter((s) => !s.terminal).map(
  (s) => s.key,
);
export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
);
export const STAGE_COLOR: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.color]),
);

export const SOURCES = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "referido", label: "Referido" },
  { key: "portal", label: "Portal web" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "walk_in", label: "Visita directa" },
  { key: "otro", label: "Otro" },
];
export const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  SOURCES.map((s) => [s.key, s.label]),
);

export const TEMPERATURES = [
  { key: "caliente", label: "🔥 Caliente" },
  { key: "tibio", label: "🌤️ Tibio" },
  { key: "frio", label: "❄️ Frío" },
];
export const TEMP_LABEL: Record<string, string> = Object.fromEntries(
  TEMPERATURES.map((t) => [t.key, t.label]),
);

export const ACTIVITY_TYPES = [
  { key: "whatsapp", label: "💬 WhatsApp" },
  { key: "nota", label: "📝 Nota del vendedor" },
  { key: "director", label: "🎯 Seguimiento director" },
  { key: "llamada", label: "📞 Llamada" },
  { key: "visita", label: "🏠 Visita" },
  { key: "email", label: "✉️ Email" },
  { key: "tarea", label: "⏰ Tarea / follow-up" },
];
export const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.key, a.label]),
);

/**
 * Puntaje automático de calidad del lead (0-100), al estilo del scoring por IA:
 * combina etapa del embudo, recencia del último contacto y valor. Sirve para
 * priorizar el seguimiento y no perder prospectos calientes.
 */
const STAGE_SCORE: Record<string, number> = {
  nuevo: 10,
  contactado: 25,
  calificado: 42,
  visita: 60,
  propuesta: 75,
  negociacion: 90,
  ganado: 100,
  perdido: 0,
};

export function leadScore(lead: {
  stage: string;
  value: number;
  lastContactAt?: Date | string | null;
}): number {
  if (lead.stage === "perdido") return 0;
  if (lead.stage === "ganado") return 100;
  let score = STAGE_SCORE[lead.stage] ?? 10;
  // Recencia del último contacto.
  if (lead.lastContactAt) {
    const days =
      (Date.now() - new Date(lead.lastContactAt).getTime()) / 86400000;
    if (days <= 2) score += 12;
    else if (days <= 7) score += 6;
    else if (days > 14) score -= 12;
    else if (days > 30) score -= 20;
  }
  // Valor de la oportunidad.
  if (lead.value >= 100000) score += 10;
  else if (lead.value >= 50000) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreTemperature(score: number): "caliente" | "tibio" | "frio" {
  if (score >= 70) return "caliente";
  if (score >= 40) return "tibio";
  return "frio";
}

/** Lista de proyectos del portal para el selector de "interés". */
export function projectOptions() {
  return proyectos.map((p) => ({ slug: p.slug, name: p.nombre }));
}

/** Devuelve (creando si hace falta) la organización por defecto. */
export async function ensureDefaultOrg() {
  const existing = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORG.slug },
  });
  if (existing) return existing;
  return prisma.organization.create({ data: DEFAULT_ORG });
}
