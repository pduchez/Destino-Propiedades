// ============================================================================
//  CONFIGURACIÓN COMERCIAL — TASA Y PRIMA POR PROYECTO
// ============================================================================
//
//  Cada proyecto define su propia TASA anual y su PRIMA mínima (según su PPDS /
//  lista de precios del desarrollador). La tabla de factores de amortización se
//  GENERA automáticamente para esa tasa, así que no hay que escribir factores a
//  mano por proyecto.
//
//  La cuota mensual se calcula como:
//        cuota = monto_a_financiar × factor(tasa, meses)
//
//  El factor es el factor de amortización de pago nivelado:
//        factor = i / (1 − (1 + i)^(−n)),  con i = tasa_anual / 12,  n = meses.
//
//  Esta fórmula reproduce EXACTO la tabla del 16% provista originalmente (1–5
//  años idénticos; 10–20 difieren <0.0001 por redondeo de la tabla base). Para
//  esos plazos del 16% se respeta la tabla exacta del cliente vía override.
// ----------------------------------------------------------------------------

/** Valores por defecto (si un proyecto no especifica los suyos). */
export const TASA_ANUAL = 0.16; // 16%
export const TASA_ANUAL_LABEL = "16% anual";
export const PRIMA_MINIMA = 0.2; // 20%

/** Plazo máximo autorizado en años (informativo). */
export const PLAZO_MAXIMO_ANOS = 20;

/** Días máximos para completar la prima después de la reserva. */
export const DIAS_LIMITE_COMPLEMENTO = 8;

/** Años autorizados (plazos que puede elegir el vendedor). */
export const PLAZOS_ANOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20];

export interface PlazoFactor {
  anos: number;
  meses: number;
  factor: number;
}

// ----------------------------------------------------------------------------
//  Tabla EXACTA del 16% provista por el cliente (override para esa tasa).
// ----------------------------------------------------------------------------
const FACTORES_16_EXACTOS: Record<number, number> = {
  12: 0.09073,
  24: 0.04896,
  36: 0.03516,
  48: 0.02835,
  60: 0.02432,
  72: 0.02169,
  84: 0.01986,
  96: 0.01852,
  108: 0.01751,
  120: 0.01673,
  132: 0.01611,
  144: 0.01561,
  156: 0.01521,
  168: 0.01488,
  180: 0.01461,
  240: 0.0138,
};

/** Factor de amortización (pago nivelado) para una tasa anual y n meses. */
export function factorAmortizacion(tasaAnual: number, meses: number): number {
  const i = tasaAnual / 12;
  if (i === 0) return 1 / meses;
  return i / (1 - Math.pow(1 + i, -meses));
}

/** Factor a usar: tabla exacta del 16% si aplica, si no la fórmula (5 dec.). */
export function getFactor(tasaAnual: number, meses: number): number {
  if (Math.abs(tasaAnual - 0.16) < 1e-9 && FACTORES_16_EXACTOS[meses] != null) {
    return FACTORES_16_EXACTOS[meses];
  }
  return Math.round(factorAmortizacion(tasaAnual, meses) * 1e5) / 1e5;
}

/** Tabla de factores completa para una tasa dada. */
export function tablaFactores(tasaAnual: number = TASA_ANUAL): PlazoFactor[] {
  return PLAZOS_ANOS.map((anos) => {
    const meses = anos * 12;
    return { anos, meses, factor: getFactor(tasaAnual, meses) };
  });
}

/** Devuelve el plazo (años/meses) para un número de años. */
export function getPlazo(
  anos: number
): { anos: number; meses: number } | undefined {
  if (!PLAZOS_ANOS.includes(anos)) return undefined;
  return { anos, meses: anos * 12 };
}

// ----------------------------------------------------------------------------
//  Opciones de prima (dropdown cerrado) desde la prima mínima hacia arriba.
// ----------------------------------------------------------------------------
const ESCALERA_PRIMA = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

/** Opciones de prima ofrecidas: la mínima del proyecto y los escalones ≥ ella. */
export function opcionesPrima(primaMinima: number = PRIMA_MINIMA): number[] {
  const set = new Set<number>([primaMinima]);
  for (const p of ESCALERA_PRIMA) if (p >= primaMinima) set.add(p);
  return Array.from(set).sort((a, b) => a - b);
}

// --- Compatibilidad hacia atrás (default 16% / prima 20%) -------------------
export const TABLA_FACTORES: PlazoFactor[] = tablaFactores(TASA_ANUAL);
export const OPCIONES_PRIMA: number[] = opcionesPrima(PRIMA_MINIMA);
