// Helpers de formato consistentes en todo el sitio (precios y áreas).
import type { UnidadArea } from "../data/proyectos";

export function formatoPrecio(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function etiquetaUnidad(unidad: UnidadArea): string {
  return unidad === "v2" ? "v²" : "m²";
}

export function formatoArea(area: number, unidad: UnidadArea): string {
  return `${new Intl.NumberFormat("en-US").format(area)} ${etiquetaUnidad(unidad)}`;
}

export const labelTipo: Record<string, string> = {
  playa: "Playa",
  urbano: "Urbano",
  residencial: "Residencial",
};

/** Frase "tipo de lote" con gramática correcta (migas de pan, footer, filtros). */
export const labelLotesDe: Record<string, string> = {
  playa: "Lotes de playa",
  urbano: "Lotes urbanos",
  residencial: "Lotes residenciales",
};

export const labelEstado: Record<string, string> = {
  disponible: "Disponible",
  preventa: "Preventa",
  agotado: "Agotado",
};
