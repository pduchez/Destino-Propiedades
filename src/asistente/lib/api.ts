"use client";

// Cliente del frontend del Asistente hacia las APIs internas del portal.

import type { CatalogoProyecto, LeadCRM } from "@/asistente/lib/types";

export interface FaqRow {
  id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
}

/** Busca prospectos del CRM del vendedor (contactos del bot de WhatsApp).
 *  Sin `q`, devuelve los más recientes para elegir de un toque. */
export async function buscarLeads(q: string): Promise<LeadCRM[]> {
  try {
    const r = await fetch(`/api/asistente/leads?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.leads as LeadCRM[]) || [];
  } catch {
    return [];
  }
}

export async function fetchProyectos(): Promise<CatalogoProyecto[]> {
  try {
    const r = await fetch("/api/asistente/proyectos", { cache: "no-store" });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.proyectos as CatalogoProyecto[]) || [];
  } catch {
    return [];
  }
}

export async function fetchFaqs(): Promise<FaqRow[]> {
  try {
    const r = await fetch("/api/asistente/faqs", { cache: "no-store" });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.faqs as FaqRow[]) || [];
  } catch {
    return [];
  }
}

/** Guarda el PDF firmado y devuelve el enlace público para WhatsApp. */
export async function guardarCarta(payload: {
  loteId: string;
  prospecto: string;
  comentarios: string;
  montoReserva: number;
  pdfBase64: string;
}): Promise<{ id: string; url: string } | null> {
  try {
    const r = await fetch("/api/asistente/carta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return null;
    return (await r.json()) as { id: string; url: string };
  } catch {
    return null;
  }
}
