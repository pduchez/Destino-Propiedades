// ============================================================================
//  CONFIGURACIÓN COMERCIAL — ÚNICO LUGAR PARA EDITAR CONDICIONES
// ============================================================================
//
//  Este archivo concentra TODOS los parámetros que definen las condiciones
//  comerciales (tasa, tabla de factores, prima mínima, plazos autorizados).
//
//  >>> SI LA TASA SE CORRIGE A 17% (u otra), SE CAMBIA SOLO ACÁ. <<<
//
//  La cuota mensual se calcula como:
//        cuota = monto_a_financiar × FACTOR[plazo]
//
//  El "factor" es el factor de amortización (pago nivelado) para la tasa y el
//  plazo dados. Cambiar la tabla acá recalcula toda la app automáticamente.
// ----------------------------------------------------------------------------

/** Tasa de interés anual vigente (solo informativa/para textos). */
export const TASA_ANUAL = 0.16; // 16%
export const TASA_ANUAL_LABEL = "16% anual";

/** Prima mínima autorizada. El vendedor NUNCA puede bajar de este valor. */
export const PRIMA_MINIMA = 0.2; // 20%

/** Opciones de prima ofrecidas al cliente (dropdown cerrado, desde 20%). */
export const OPCIONES_PRIMA: number[] = [0.2, 0.25, 0.3, 0.4, 0.5];

/** Plazo máximo autorizado en años (solo informativo/para textos). */
export const PLAZO_MAXIMO_ANOS = 20;

/** Días máximos para completar la prima después de la reserva. */
export const DIAS_LIMITE_COMPLEMENTO = 8;

// ----------------------------------------------------------------------------
//  TABLA DE FACTORES — tasa 16% anual
//
//  NOTA: la tabla base disponible es de 17%; esta es la tabla de factores
//  derivada con el mismo método para 16%. Son los factores EXACTOS a usar.
//  Para volver a 17%, reemplazá los valores de "factor" por los de esa tabla.
// ----------------------------------------------------------------------------
export interface PlazoFactor {
  anos: number;
  meses: number;
  factor: number;
}

export const TABLA_FACTORES: PlazoFactor[] = [
  { anos: 1, meses: 12, factor: 0.09073 },
  { anos: 2, meses: 24, factor: 0.04896 },
  { anos: 3, meses: 36, factor: 0.03516 },
  { anos: 4, meses: 48, factor: 0.02835 },
  { anos: 5, meses: 60, factor: 0.02432 },
  { anos: 6, meses: 72, factor: 0.02169 },
  { anos: 7, meses: 84, factor: 0.01986 },
  { anos: 8, meses: 96, factor: 0.01852 },
  { anos: 9, meses: 108, factor: 0.01751 },
  { anos: 10, meses: 120, factor: 0.01673 },
  { anos: 11, meses: 132, factor: 0.01611 },
  { anos: 12, meses: 144, factor: 0.01561 },
  { anos: 13, meses: 156, factor: 0.01521 },
  { anos: 14, meses: 168, factor: 0.01488 },
  { anos: 15, meses: 180, factor: 0.01461 },
  { anos: 20, meses: 240, factor: 0.01380 },
];

/** Devuelve la fila de la tabla para un plazo (años) dado. */
export function getPlazo(anos: number): PlazoFactor | undefined {
  return TABLA_FACTORES.find((p) => p.anos === anos);
}
