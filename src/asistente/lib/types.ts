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
  nombreProspecto: string;
  telefono: string; // WhatsApp del cliente (ficha inicial → CRM → envío de carta)
  perfil: PerfilComprador | "";
  proyectoId: string;
  calificacion: NivelCalificacion | "";
  notas: string;
}

/** Proyecto del catálogo servido por /api/asistente/proyectos (BD + lotes). */
export interface CatalogoProyecto {
  id: string;
  nombre: string;
  lotificacion: string;
  ubicacion: string;
  tieneCatalogo: boolean;
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
