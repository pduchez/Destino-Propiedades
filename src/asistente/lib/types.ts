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
  perfil: PerfilComprador | "";
  proyectoId: string;
  calificacion: NivelCalificacion | "";
  notas: string;
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
  firmaClienteDataUrl: string | null;
  firmaEjecutivoDataUrl: string | null;
}

export type EstadoBloqueo = "libre" | "reservado" | "desconocido";
