"use client";

import React from "react";
import { Label, Select, TextField, TextArea, Banner } from "../ui";
import type {
  Handoff,
  PerfilComprador,
  NivelCalificacion,
  CatalogoProyecto,
} from "@/asistente/lib/types";

const PERFILES: PerfilComprador[] = [
  "Diáspora - decide solo",
  "Diáspora - decide en familia",
  "Comprador local",
];

const CALIFICACIONES: NivelCalificacion[] = [
  "Frío",
  "Tibio",
  "Caliente - listo para cita",
];

/** Códigos de país (WhatsApp). El Salvador primero por ser el más común. */
const PAISES: { codigo: string; label: string }[] = [
  { codigo: "503", label: "🇸🇻 +503 El Salvador" },
  { codigo: "502", label: "🇬🇹 +502 Guatemala" },
  { codigo: "504", label: "🇭🇳 +504 Honduras" },
  { codigo: "505", label: "🇳🇮 +505 Nicaragua" },
  { codigo: "506", label: "🇨🇷 +506 Costa Rica" },
  { codigo: "507", label: "🇵🇦 +507 Panamá" },
  { codigo: "1", label: "🇺🇸 +1 EE. UU. / Canadá" },
  { codigo: "52", label: "🇲🇽 +52 México" },
  { codigo: "34", label: "🇪🇸 +34 España" },
];

export function StepHandoff({
  value,
  onChange,
  proyectos,
  cargando,
}: {
  value: Handoff;
  onChange: (h: Handoff) => void;
  proyectos: CatalogoProyecto[];
  cargando?: boolean;
}) {
  const set = <K extends keyof Handoff>(k: K, v: Handoff[K]) =>
    onChange({ ...value, [k]: v });

  const proyectoSel = proyectos.find((p) => p.id === value.proyectoId);

  return (
    <div className="space-y-5">
      <p className="text-sm text-marino-600">
        Registrá el contexto del lead antes de la cita. Estos datos viajan por
        todo el flujo.
      </p>

      <div>
        <Label>Nombre del prospecto</Label>
        <TextField
          value={value.nombreProspecto}
          onChange={(v) => set("nombreProspecto", v)}
          placeholder="Ej. José Martínez"
        />
      </div>

      <div>
        <Label>WhatsApp del cliente</Label>
        <div className="grid grid-cols-[minmax(0,1.15fr)_1fr] gap-2">
          <Select
            value={value.codigoPais}
            onChange={(v) => set("codigoPais", v)}
          >
            {PAISES.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.label}
              </option>
            ))}
          </Select>
          <TextField
            value={value.telefono}
            onChange={(v) => set("telefono", v)}
            placeholder="7000-0000"
            inputMode="numeric"
          />
        </div>
        <p className="mt-1 text-xs text-marino-500">
          Se usa para enviarle la carta al final y queda en su ficha del CRM.
        </p>
      </div>

      <div>
        <Label>Perfil del comprador</Label>
        <Select
          value={value.perfil}
          onChange={(v) => set("perfil", v as PerfilComprador)}
          placeholder="Seleccione un perfil"
        >
          {PERFILES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Proyecto de interés</Label>
        <Select
          value={value.proyectoId}
          onChange={(v) => set("proyectoId", v)}
          placeholder={cargando ? "Cargando proyectos…" : "Seleccione un proyecto"}
          disabled={cargando || proyectos.length === 0}
        >
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {p.tieneCatalogo ? "" : " — (sin lotes cargados)"}
            </option>
          ))}
        </Select>
        {proyectoSel && !proyectoSel.tieneCatalogo && (
          <div className="mt-2">
            <Banner tone="warn">
              Este proyecto aún no tiene lotes ni precios cargados. Podés
              registrar la ficha del lead, pero la cotización y la carta no
              están disponibles todavía.
            </Banner>
          </div>
        )}
      </div>

      <div>
        <Label>Nivel de calificación</Label>
        <Select
          value={value.calificacion}
          onChange={(v) => set("calificacion", v as NivelCalificacion)}
          placeholder="Seleccione el nivel"
        >
          {CALIFICACIONES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Notas de lo conversado (opcional)</Label>
        <TextArea
          value={value.notas}
          onChange={(v) => set("notas", v)}
          placeholder="Lo que el cliente busca, objeciones, contexto familiar…"
          rows={3}
        />
      </div>
    </div>
  );
}

export function handoffCompleto(h: Handoff): boolean {
  return Boolean(
    h.nombreProspecto.trim() && h.perfil && h.proyectoId && h.calificacion
  );
}
