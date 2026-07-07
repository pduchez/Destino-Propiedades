// Relaciones entre datos (proyectos <-> zonas <-> desarrolladores).
// Mantener esta lógica acá evita repetir búsquedas en las páginas.
import { zonas, type Zona } from "../data/zonas";
import { proyectos, type Proyecto, type UnidadArea } from "../data/proyectos";

/** ¿Este proyecto pertenece a esta zona? (departamento + municipio + tipo). */
function proyectoEnZona(proyecto: Proyecto, zona: Zona): boolean {
  return (
    proyecto.departamento === zona.departamento &&
    (!zona.municipio || proyecto.municipio === zona.municipio) &&
    (!zona.tipo || proyecto.tipo === zona.tipo)
  );
}

/** Proyectos que pertenecen a una zona SEO. */
export function proyectosDeZona(zona: Zona): Proyecto[] {
  return proyectos.filter((p) => proyectoEnZona(p, zona));
}

/** Devuelve la zona SEO que corresponde a un proyecto (si existe alguna). */
export function zonaDeProyecto(proyecto: Proyecto): Zona | undefined {
  return zonas.find((z) => proyectoEnZona(proyecto, z));
}

/** Rango de área (min-max) de los tipos de lote de un proyecto. */
export function rangoArea(proyecto: Proyecto): { min: number; max: number; unidad: UnidadArea } | null {
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
