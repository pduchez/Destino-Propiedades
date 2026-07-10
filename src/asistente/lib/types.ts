// Tipos compartidos del estado del flujo (wizard).

import type { Lote } from "@/asistente/data/proyectos";

export type PerfilComprador =
  | "Diáspora - decide solo"
  | "Diáspora - decide en familia"
  | "Comprador local";

export type NivelCalificacion =
  | "Frío"
  | "Tibio"
  | "Caliente - listo para cita";

export interface Handoff {
  /** Id del lead del CRM cuando el prospecto se jala del CRM (bot de WhatsApp).
   *  Vacío = cliente nuevo capturado a mano (walk-in). */
  leadId: string;
  nombreProspecto: string;
  codigoPais: string; // código de país del WhatsApp (ej. "503", "502")
  telefono: string; // WhatsApp del cliente (ficha inicial → CRM → envío de carta)
  perfil: PerfilComprador | "";
  proyectoId: string;
  calificacion: NivelCalificacion | "";
  notas: string;
}

/** Prospecto existente del CRM, servido por /api/asistente/leads para el
 *  buscador de la Ficha de Handoff (contacto creado por el bot de WhatsApp). */
export interface LeadCRM {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectSlug: string;
  projectName: string;
  stage: string;
  temperature: string; // frio | tibio | caliente
  source: string;
  notes: string;
  lastContactAt: string | null;
  nextActionAt: string | null;
  nextActionNote: string;
  activityCount: number;
  lastActivity: { body: string; type: string; createdAt: string } | null;
}

/** Proyecto del catálogo servido por /api/asistente/proyectos (BD + lotes). */
export interface CatalogoProyecto {
  id: string;
  nombre: string;
  lotificacion: string;
  ubicacion: string;
  tieneCatalogo: boolean;
  /** Tasa anual del proyecto (ej. 0.15). */
  tasaAnual: number;
  /** Prima mínima del proyecto (ej. 0.10). */
  primaMinima: number;
  lotes: Lote[];
}

export interface SeleccionLote {
  poligono: string;
  loteId: string;
  lote?: Lote;
  anos: number | null;
  porcentajePrima: number;
}

export interface Carta {
  fecha: string; // ISO YYYY-MM-DD
  dui: string;
  montoReservacion: number;
  fechaLimiteComplemento: string; // ISO
  comentarios: string; // comentarios del vendedor (carta + PDF + CRM)
  firmaClienteDataUrl: string | null;
  firmaEjecutivoDataUrl: string | null;
}

export type EstadoBloqueo = "libre" | "reservado" | "desconocido";
