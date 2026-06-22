// Relaciones entre datos (proyectos <-> zonas <-> desarrolladores).
// Mantener esta lógica acá evita repetir búsquedas en las páginas.
import { zonas, type Zona } from "../data/zonas";
import type { Proyecto } from "../data/proyectos";

/** Devuelve la zona SEO que corresponde al departamento de un proyecto. */
export function zonaDeProyecto(proyecto: Proyecto): Zona | undefined {
  return zonas.find((z) => z.departamento === proyecto.departamento);
}

/** Rango de área (min-max) de los tipos de lote de un proyecto. */
export function rangoArea(proyecto: Proyecto): { min: number; max: number; unidad: string } | null {
  if (proyecto.tiposDeLote.length === 0) return null;
  const areas = proyecto.tiposDeLote.map((t) => t.area);
  return {
    min: Math.min(...areas),
    max: Math.max(...areas),
    unidad: proyecto.tiposDeLote[0].unidad,
  };
}

/** Total de lotes disponibles sumando todos los tipos. */
export function lotesDisponibles(proyecto: Proyecto): number {
  return proyecto.tiposDeLote.reduce((sum, t) => sum + t.disponibilidad, 0);
}
