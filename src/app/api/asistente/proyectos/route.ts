// ============================================================================
//  Asistente de Cierre — Catálogo de proyectos (conectado a la BD del portal)
// ============================================================================
//
//  GET /api/asistente/proyectos
//
//  Devuelve la LISTA GENERAL de proyectos desde la base de datos del portal
//  (modelo Project), enriquecida con el catálogo de lotes/precios que ya tiene
//  cargado el Asistente. Algunos proyectos de la BD todavía no tienen lotes ni
//  precios documentados: se listan igual, marcados con `tieneCatalogo: false`.
//
//  Fuente de la lista  = base de datos (Project).
//  Fuente de los lotes = catálogo local del Asistente (src/asistente/data).
//  Si la BD no está disponible, se degrada al catálogo local para no romper.
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { requireUser, crmRoute } from "@/lib/crmServer";
import { PROYECTOS } from "@/asistente/data/proyectos";
import type { Lote } from "@/asistente/data/proyectos";
import { TASA_ANUAL, PRIMA_MINIMA } from "@/asistente/config/factores";

export const dynamic = "force-dynamic";

export interface CatalogoProyecto {
  id: string; // slug del proyecto (clave estable)
  nombre: string;
  lotificacion: string;
  ubicacion: string;
  tieneCatalogo: boolean; // ¿tiene lotes/precios cargados?
  tasaAnual: number;
  primaMinima: number;
  lotes: Lote[];
}

// Índice del catálogo local por clave (id === slug del proyecto).
const LOCAL = new Map(PROYECTOS.map((p) => [p.id, p]));

export const GET = crmRoute(async () => {
  await requireUser();

  let dbProjects: { slug: string; name: string; location: string }[] = [];
  try {
    const rows = await prisma.project.findMany({
      where: { status: { not: "archived" } },
      select: { slug: true, name: true, location: true },
      orderBy: { name: "asc" },
    });
    dbProjects = rows;
  } catch {
    // Sin BD: se usa solo el catálogo local (abajo).
  }

  const proyectos: CatalogoProyecto[] = [];
  const vistos = new Set<string>();

  // 1) Proyectos de la BD (lista general), enriquecidos con lotes si los hay.
  for (const p of dbProjects) {
    const local = LOCAL.get(p.slug);
    vistos.add(p.slug);
    proyectos.push({
      id: p.slug,
      nombre: p.name,
      lotificacion: local?.lotificacion || p.name,
      ubicacion: p.location || local?.ubicacion || "",
      tieneCatalogo: Boolean(local && local.lotes.length),
      tasaAnual: local?.tasaAnual ?? TASA_ANUAL,
      primaMinima: local?.primaMinima ?? PRIMA_MINIMA,
      lotes: local?.lotes ?? [],
    });
  }

  // 2) Proyectos del catálogo local que aún no estén en la BD (p. ej. Villa
  //    Lourdes de arranque), para que sigan siendo cotizables.
  for (const p of PROYECTOS) {
    if (vistos.has(p.id)) continue;
    proyectos.push({
      id: p.id,
      nombre: p.nombre,
      lotificacion: p.lotificacion,
      ubicacion: p.ubicacion,
      tieneCatalogo: p.lotes.length > 0,
      tasaAnual: p.tasaAnual,
      primaMinima: p.primaMinima,
      lotes: p.lotes,
    });
  }

  // Primero los cotizables (con catálogo), luego el resto, alfabético.
  proyectos.sort((a, b) => {
    if (a.tieneCatalogo !== b.tieneCatalogo) return a.tieneCatalogo ? -1 : 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return Response.json({ proyectos });
});
