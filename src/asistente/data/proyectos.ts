// ============================================================================
//  CATÁLOGO DE PROYECTOS Y LOTES DEL ASISTENTE DE CIERRE
// ============================================================================
//
//  Inventario real de lotes por proyecto, con su TASA anual y PRIMA mínima
//  propias (tomadas del PPDS / lista de precios de cada desarrollador).
//
//  Fuente de la lista general de proyectos: base de datos del portal (modelo
//  Project). Este archivo aporta el detalle de LOTES + condiciones por proyecto;
//  se une con la BD en /api/asistente/proyectos. Un proyecto que esté en la BD
//  pero no aquí, se lista como "sin lotes cargados".
//
//  Para agregar un proyecto: añadí un objeto a `PROYECTOS` con sus lotes,
//  `tasaAnual` y `primaMinima`. Los factores de cuota se derivan solos de la tasa.
// ----------------------------------------------------------------------------

export interface Lote {
  /** Identificador único dentro del proyecto (para CRM y bloqueo). */
  id: string;
  poligono: string;
  numero: number;
  /** Área en varas cuadradas (V²). */
  areaV2: number;
  /** Precio de contado en US$. */
  precioContado: number;
  calle: string;
  pasaje: string;
}

export interface Proyecto {
  /** Clave estable = slug del proyecto en el portal/BD. */
  id: string;
  nombre: string;
  /** Nombre que aparece en la Carta Compromiso ("Lotificación ..."). */
  lotificacion: string;
  ubicacion: string;
  /** Tasa de interés anual del proyecto (ej. 0.15 = 15%). */
  tasaAnual: number;
  /** Prima mínima del proyecto (ej. 0.10 = 10%). */
  primaMinima: number;
  lotes: Lote[];
}

// ----------------------------------------------------------------------------
//  BYPASS LA POZA (Usulután) — Desarrollador PARSAL, S.A. de C.V.
//  Condiciones del PPDS: 15% interés anual, prima 10%.
//  14 lotes con precio confirmado en la lista de precios (polígonos A, C–I).
//  Precio por v²: $133.10 habitacional / $163.35 centros comerciales.
// ----------------------------------------------------------------------------
const bypassLaPoza: Proyecto = {
  id: "bypass-la-poza",
  nombre: "Bypass La Poza",
  lotificacion: "Lotificación La Poza de Agua",
  ubicacion:
    "Cantón La Poza, Hacienda La Poza, Jurisdicción de Usulután, Departamento de Usulután, El Salvador",
  tasaAnual: 0.15,
  primaMinima: 0.1,
  lotes: [
    { id: "BYPASSLAPOZA-A-12", poligono: "A", numero: 12, areaV2: 300.47, precioContado: 49081.77, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-C-16", poligono: "C", numero: 16, areaV2: 286.13, precioContado: 38083.9, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-D-1", poligono: "D", numero: 1, areaV2: 286.16, precioContado: 38087.9, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-D-2", poligono: "D", numero: 2, areaV2: 286.16, precioContado: 38087.9, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-E-1", poligono: "E", numero: 1, areaV2: 521.91, precioContado: 69466.22, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-E-6", poligono: "E", numero: 6, areaV2: 447.71, precioContado: 59590.2, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-F-1", poligono: "F", numero: 1, areaV2: 300.47, precioContado: 39992.56, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-F-6", poligono: "F", numero: 6, areaV2: 300.47, precioContado: 39992.56, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-G-1", poligono: "G", numero: 1, areaV2: 289.31, precioContado: 47258.79, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-G-5", poligono: "G", numero: 5, areaV2: 300.47, precioContado: 49081.77, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-G-6", poligono: "G", numero: 6, areaV2: 300.47, precioContado: 49081.77, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-H-1", poligono: "H", numero: 1, areaV2: 300.47, precioContado: 39992.56, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-H-6", poligono: "H", numero: 6, areaV2: 300.47, precioContado: 39992.56, calle: "", pasaje: "" },
    { id: "BYPASSLAPOZA-I-4", poligono: "I", numero: 4, areaV2: 300.47, precioContado: 39992.56, calle: "", pasaje: "" },
  ],
};

// ----------------------------------------------------------------------------
//  Registro de proyectos. Para sumar proyectos: agregá objetos a este array.
//  (Condado del Golfo — 261 lotes — pendiente de confirmar su tasa/prima.)
// ----------------------------------------------------------------------------
export const PROYECTOS: Proyecto[] = [bypassLaPoza];

// ----- Helpers de acceso -----
export function getProyecto(id: string): Proyecto | undefined {
  return PROYECTOS.find((p) => p.id === id);
}

export function getPoligonos(proyectoId: string): string[] {
  const p = getProyecto(proyectoId);
  if (!p) return [];
  return Array.from(new Set(p.lotes.map((l) => l.poligono))).sort();
}

export function getLotes(proyectoId: string, poligono: string): Lote[] {
  const p = getProyecto(proyectoId);
  if (!p) return [];
  return p.lotes
    .filter((l) => l.poligono === poligono)
    .sort((a, b) => a.numero - b.numero);
}

export function getLote(proyectoId: string, loteId: string): Lote | undefined {
  return getProyecto(proyectoId)?.lotes.find((l) => l.id === loteId);
}
