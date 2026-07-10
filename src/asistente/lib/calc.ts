// Cálculo comercial. Toda la matemática del financiamiento vive acá.
// Los parámetros (factores, prima) vienen SIEMPRE de /config/factores.ts.

import { getPlazo } from "@/asistente/config/factores";

export interface Cotizacion {
  precioContado: number;
  porcentajePrima: number;
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
 *   cuota = monto_a_financiar × factor[plazo]
 */
export function cotizar(
  precioContado: number,
  porcentajePrima: number,
  anos: number
): Cotizacion | null {
  const plazo = getPlazo(anos);
  if (!plazo || !precioContado) return null;

  const primaRequerida = precioContado * porcentajePrima;
  const montoFinanciar = precioContado - primaRequerida;
  const cuotaMensual = montoFinanciar * plazo.factor;
  const valorConFinanciamiento = primaRequerida + cuotaMensual * plazo.meses;

  return {
    precioContado,
    porcentajePrima,
    anos: plazo.anos,
    meses: plazo.meses,
    factor: plazo.factor,
    primaRequerida,
    montoFinanciar,
    cuotaMensual,
    valorConFinanciamiento,
  };
}
