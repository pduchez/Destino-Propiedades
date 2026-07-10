// ============================================================================
//  CATÁLOGO DE PROYECTOS Y LOTES
// ============================================================================
//
//  Estructura compartida por TODOS los módulos. Un lote se selecciona una vez
//  y sus datos viajan por todo el flujo (calculadora, carta, bloqueo CRM).
//
//  Para agregar un proyecto nuevo: añadí un objeto a `PROYECTOS`. No hay que
//  tocar ninguna lógica de la app.
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
  id: string;
  nombre: string;
  /** Nombre que aparece en la Carta Compromiso ("Lotificación ..."). */
  lotificacion: string;
  ubicacion: string;
  lotes: Lote[];
}

// ----------------------------------------------------------------------------
//  Proyecto de arranque: VILLA LOURDES
//  Muestra representativa de lotes reales de los polígonos F, G, I, J.
//  (Los 5 primeros son datos verídicos provistos; el resto son variaciones
//   realistas de precio/área para poblar el catálogo de demostración.)
// ----------------------------------------------------------------------------
const villaLourdes: Proyecto = {
  id: "villa-lourdes",
  nombre: "Villa Lourdes",
  lotificacion: "Urbanización Villa Lourdes",
  ubicacion:
    "Hacienda Agua Fría, Cantón El Capulín, Colón, La Libertad",
  lotes: [
    // ----- Polígono F -----
    { id: "VL-F-1", poligono: "F", numero: 1, areaV2: 198.42, precioContado: 61114.39, calle: "Calle Los Almendros", pasaje: "Pasaje 1" },
    { id: "VL-F-12", poligono: "F", numero: 12, areaV2: 142.30, precioContado: 45536.0, calle: "Calle Los Almendros", pasaje: "Pasaje 2" },
    { id: "VL-F-28", poligono: "F", numero: 28, areaV2: 100.16, precioContado: 32051.2, calle: "Calle Los Almendros", pasaje: "Pasaje 3" },
    { id: "VL-F-45", poligono: "F", numero: 45, areaV2: 85.85, precioContado: 28802.0, calle: "Calle Los Almendros", pasaje: "Pasaje 4" },
    { id: "VL-F-53", poligono: "F", numero: 53, areaV2: 71.40, precioContado: 25190.0, calle: "Calle Los Almendros", pasaje: "Pasaje 5" },

    // ----- Polígono G -----
    { id: "VL-G-1", poligono: "G", numero: 1, areaV2: 100.16, precioContado: 30848.05, calle: "Calle Los Cedros", pasaje: "Pasaje 1" },
    { id: "VL-G-7", poligono: "G", numero: 7, areaV2: 118.60, precioContado: 36527.6, calle: "Calle Los Cedros", pasaje: "Pasaje 2" },
    { id: "VL-G-14", poligono: "G", numero: 14, areaV2: 100.16, precioContado: 31049.6, calle: "Calle Los Cedros", pasaje: "Pasaje 3" },
    { id: "VL-G-22", poligono: "G", numero: 22, areaV2: 156.90, precioContado: 48639.0, calle: "Calle Los Cedros", pasaje: "Pasaje 4" },
    { id: "VL-G-30", poligono: "G", numero: 30, areaV2: 210.55, precioContado: 62060.0, calle: "Calle Los Cedros", pasaje: "Pasaje 5" },

    // ----- Polígono I -----
    { id: "VL-I-1", poligono: "I", numero: 1, areaV2: 100.16, precioContado: 28598.34, calle: "Calle Las Palmeras", pasaje: "Pasaje 1" },
    { id: "VL-I-9", poligono: "I", numero: 9, areaV2: 92.40, precioContado: 27350.0, calle: "Calle Las Palmeras", pasaje: "Pasaje 2" },
    { id: "VL-I-16", poligono: "I", numero: 16, areaV2: 100.16, precioContado: 29047.6, calle: "Calle Las Palmeras", pasaje: "Pasaje 3" },
    { id: "VL-I-24", poligono: "I", numero: 24, areaV2: 134.80, precioContado: 40126.0, calle: "Calle Las Palmeras", pasaje: "Pasaje 4" },
    { id: "VL-I-31", poligono: "I", numero: 31, areaV2: 178.20, precioContado: 53225.0, calle: "Calle Las Palmeras", pasaje: "Pasaje 5" },

    // ----- Polígono J -----
    { id: "VL-J-5", poligono: "J", numero: 5, areaV2: 100.16, precioContado: 31949.76, calle: "Calle Los Robles", pasaje: "Pasaje 1" },
    { id: "VL-J-11", poligono: "J", numero: 11, areaV2: 100.16, precioContado: 32150.0, calle: "Calle Los Robles", pasaje: "Pasaje 2" },
    { id: "VL-J-18", poligono: "J", numero: 18, areaV2: 125.40, precioContado: 39880.0, calle: "Calle Los Robles", pasaje: "Pasaje 3" },
    { id: "VL-J-26", poligono: "J", numero: 26, areaV2: 165.70, precioContado: 51420.0, calle: "Calle Los Robles", pasaje: "Pasaje 4" },
    { id: "VL-J-33", poligono: "J", numero: 33, areaV2: 219.80, precioContado: 62970.0, calle: "Calle Los Robles", pasaje: "Pasaje 5" },
  ],
};

// ----------------------------------------------------------------------------
//  Registro de proyectos. Para sumar proyectos: agregá objetos a este array.
// ----------------------------------------------------------------------------
export const PROYECTOS: Proyecto[] = [villaLourdes];

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
