"use client";

import React from "react";
import { PROYECTOS } from "@/asistente/data/proyectos";
import { Label, Select, TextField, TextArea } from "../ui";
import type {
  Handoff,
  PerfilComprador,
  NivelCalificacion,
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

export function StepHandoff({
  value,
  onChange,
}: {
  value: Handoff;
  onChange: (h: Handoff) => void;
}) {
  const set = <K extends keyof Handoff>(k: K, v: Handoff[K]) =>
    onChange({ ...value, [k]: v });

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
          placeholder="Seleccione un proyecto"
        >
          {PROYECTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
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
