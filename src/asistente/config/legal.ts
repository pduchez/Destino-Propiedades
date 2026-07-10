// ============================================================================
//  MÓDULO 2 y 3 — ESTADO LEGAL + PREGUNTAS FRECUENTES
// ============================================================================
//
//  TODO el contenido informativo editable vive acá. Cuando el desarrollador
//  confirme los datos reales, se reemplazan los textos marcados como
//  "PENDIENTE DE CONFIRMAR" y listo — no se toca la lógica de la app.
// ----------------------------------------------------------------------------

import { TASA_ANUAL_LABEL, PRIMA_MINIMA, PLAZO_MAXIMO_ANOS } from "./factores";

// ----------------------------------------------------------------------------
//  MÓDULO 2 — ESTADO LEGAL DE FINCA MATRIZ (por proyecto)
// ----------------------------------------------------------------------------
export type EstadoFinca = "Liberada" | "Hipotecada" | "Liberación parcial";

export interface EstadoLegalProyecto {
  proyectoId: string;
  estado: EstadoFinca;
  /** Solo si está hipotecada / liberación parcial. */
  acreedor?: string;
  plazoEstimadoLiberacion?: string;
  /** Cómo se libera el lote individual. */
  mecanismoLiberacion: string;
  /** Fecha de corte del dato mostrado. Formato libre. */
  actualizadoAl: string;
  /** true = el dato NO está confirmado; se muestra la advertencia + guion. */
  pendienteConfirmar: boolean;
}

/** Guion sugerido cuando el dato no está fresco/confirmado. */
export const GUION_DATO_NO_FRESCO =
  "Déjeme confirmarlo con el desarrollador y le respondo hoy mismo.";

/**
 * Datos PLACEHOLDER — PENDIENTE DE CONFIRMAR CON DESARROLLADOR.
 * Reemplazar por los datos reales cuando estén disponibles.
 */
export const ESTADO_LEGAL: Record<string, EstadoLegalProyecto> = {
  "villa-lourdes": {
    proyectoId: "villa-lourdes",
    estado: "Hipotecada",
    acreedor: "PENDIENTE DE CONFIRMAR CON DESARROLLADOR",
    plazoEstimadoLiberacion: "PENDIENTE DE CONFIRMAR CON DESARROLLADOR",
    mecanismoLiberacion:
      "PENDIENTE DE CONFIRMAR CON DESARROLLADOR: mecanismo de liberación del lote individual (ej. carta de liberación al completar prima / al alcanzar X% amortizado).",
    actualizadoAl: "PENDIENTE",
    pendienteConfirmar: true,
  },
};

export function getEstadoLegal(proyectoId: string): EstadoLegalProyecto | undefined {
  return ESTADO_LEGAL[proyectoId];
}

// ----------------------------------------------------------------------------
//  MÓDULO 3 — PREGUNTAS FRECUENTES (acordeón)
// ----------------------------------------------------------------------------
export interface FaqItem {
  pregunta: string;
  respuesta: string;
  /** true = respuesta placeholder pendiente de confirmar. */
  pendienteConfirmar?: boolean;
}

export const FAQS: FaqItem[] = [
  {
    pregunta: "¿Qué pasa si dejo de pagar?",
    respuesta:
      "PENDIENTE CONFIRMAR: política oficial de mora, período de gracia y consecuencias.",
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Después de cuánto amortizado me escrituran el lote?",
    respuesta:
      "PENDIENTE CONFIRMAR: porcentaje/monto amortizado requerido para escrituración.",
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Puedo abonar a capital y reducir plazo?",
    respuesta:
      "PENDIENTE CONFIRMAR: si se permiten abonos a capital y cómo afectan plazo/cuota.",
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Qué pasa si quiero vender/ceder el lote antes de terminar de pagar?",
    respuesta:
      "PENDIENTE CONFIRMAR: condiciones de cesión/traspaso del contrato antes de finalizar el pago.",
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿El financiamiento requiere buró de crédito?",
    respuesta:
      "PENDIENTE CONFIRMAR: si se consulta buró de crédito y qué requisitos aplican.",
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Cuáles son las condiciones del financiamiento?",
    respuesta: `Tasa ${TASA_ANUAL_LABEL}. Prima mínima ${Math.round(
      PRIMA_MINIMA * 100
    )}%. Plazo máximo ${PLAZO_MAXIMO_ANOS} años.`,
    pendienteConfirmar: false,
  },
];
