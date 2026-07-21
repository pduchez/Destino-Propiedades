/**
 * Motor de PLANTILLAS de reel (giro de 180°): el DISEÑO vive en plantillas
 * profesionales de JSON2Video (hechas por Claude Design). ARS ya no arma el
 * video a mano: solo RELLENA las variables con datos reales y ajusta el tipo de
 * cada medio (foto vs video) para que calce con la plantilla.
 */
import type { MovieSpec } from "@/lib/video/json2video";
import t01 from "./templates/01-recorrido-aereo.json";
import t02 from "./templates/02-volver-a-casa.json";
import t03 from "./templates/03-ficha-rapida.json";
import t04 from "./templates/04-tour-amenidades.json";
import t05 from "./templates/05-avance-de-obra.json";

export interface ReelTemplateMeta {
  id: string;
  name: string;
  tagline: string;
  /** "video-first" | "mixto" | "foto-ok": pista de qué material luce mejor. */
  best: string;
  spec: unknown;
}

export const REEL_TEMPLATES: ReelTemplateMeta[] = [
  { id: "01-recorrido-aereo", name: "Recorrido aéreo", tagline: "Dron + datos cinéticos.", best: "video-first", spec: t01 },
  { id: "02-volver-a-casa", name: "Volver a casa", tagline: "Emocional, cálida, familiar.", best: "mixto", spec: t02 },
  { id: "03-ficha-rapida", name: "Ficha rápida", tagline: "Datos y precio, enérgica.", best: "foto-ok", spec: t03 },
  { id: "04-tour-amenidades", name: "Tour de amenidades", tagline: "Casa club, ciclovía, áreas verdes.", best: "mixto", spec: t04 },
  { id: "05-avance-de-obra", name: "Avance de obra", tagline: "Realidad y confianza.", best: "mixto", spec: t05 },
];

export type MediaKind = "image" | "video";

export interface ReelVariables {
  logo_url: string;
  brand_name: string;
  project_name: string;
  location: string;
  hook: string;
  benefit_1: string;
  benefit_2: string;
  benefit_3: string;
  price_label: string;
  cta: string;
  accent_color: string;
  music_url: string;
  media_1: string;
  media_2: string;
  media_3: string;
  media_4: string;
  media_5: string;
  media_6: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

/** Sustituye {{clave}} en cualquier string del árbol. */
function substitute(node: any, vars: Record<string, string>): any {
  if (typeof node === "string") {
    return node.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_m, k) => vars[k] ?? "");
  }
  if (Array.isArray(node)) return node.map((n) => substitute(n, vars));
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(node)) out[k] = substitute(node[k], vars);
    return out;
  }
  return node;
}

/**
 * Procesa una lista de elements ANTES de sustituir: fija el `type` de cada medio
 * (foto→image, clip→video) y descarta el logo/música si no hay recurso.
 */
function processElements(
  elements: any[],
  vars: Record<string, string>,
  kinds: Record<string, MediaKind>,
): any[] {
  const out: any[] = [];
  for (const el of elements) {
    const rawSrc = typeof el?.src === "string" ? el.src : "";
    if (rawSrc === "{{logo_url}}" && !vars.logo_url) continue; // sin logo: se omite
    if (rawSrc === "{{music_url}}" && !vars.music_url) continue; // sin música: se omite
    const e = { ...el };
    const m = /^\{\{(media_\d)\}\}$/.exec(rawSrc);
    if (m && kinds[m[1]]) e.type = kinds[m[1]]; // calza el tipo con el medio real
    out.push(e);
  }
  return out;
}

/**
 * Resuelve una plantilla a un `movie` de JSON2Video listo para enviar.
 * @param templateId id de la plantilla (uno de REEL_TEMPLATES)
 * @param vars valores reales (incluye media_1..6 ya asignados)
 * @param kinds tipo real de cada media_x ("image" | "video")
 */
export function resolveMovie(
  templateId: string,
  vars: ReelVariables,
  kinds: Record<string, MediaKind>,
): MovieSpec {
  const meta = REEL_TEMPLATES.find((t) => t.id === templateId) ?? REEL_TEMPLATES[0];
  const spec: any = deepClone(meta.spec);
  delete spec.variables; // ARS sustituye por su cuenta

  const varMap = vars as unknown as Record<string, string>;
  if (Array.isArray(spec.elements)) spec.elements = processElements(spec.elements, varMap, kinds);
  if (Array.isArray(spec.scenes)) {
    for (const s of spec.scenes) {
      if (Array.isArray(s.elements)) s.elements = processElements(s.elements, varMap, kinds);
    }
  }

  return substitute(spec, varMap) as MovieSpec;
}
