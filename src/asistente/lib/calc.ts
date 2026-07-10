// Cálculo comercial. Toda la matemática del financiamiento vive acá.
// La tasa y la prima vienen POR PROYECTO; los factores se derivan de la tasa.

import { getPlazo, getFactor, TASA_ANUAL } from "@/asistente/config/factores";

export interface Cotizacion {
  precioContado: number;
  porcentajePrima: number;
  tasaAnual: number;
  anos: number;
  meses: number;
  factor: number;
  primaRequerida: number;
  montoFinanciar: number;
  cuotaMensual: number;
  /** prima + (cuota × meses) */
  valorConFinanciamiento: number;
}

/**
 * Calcula una cotización completa.
 *   cuota = monto_a_financiar × factor(tasa, meses)
 */
export function cotizar(
  precioContado: number,
  porcentajePrima: number,
  anos: number,
  tasaAnual: number = TASA_ANUAL
): Cotizacion | null {
  const plazo = getPlazo(anos);
  if (!plazo || !precioContado) return null;

  const factor = getFactor(tasaAnual, plazo.meses);
  const primaRequerida = precioContado * porcentajePrima;
  const montoFinanciar = precioContado - primaRequerida;
  const cuotaMensual = montoFinanciar * factor;
  const valorConFinanciamiento = primaRequerida + cuotaMensual * plazo.meses;

  return {
    precioContado,
    porcentajePrima,
    tasaAnual,
    anos: plazo.anos,
    meses: plazo.meses,
    factor,
    primaRequerida,
    montoFinanciar,
    cuotaMensual,
    valorConFinanciamiento,
  };
}
