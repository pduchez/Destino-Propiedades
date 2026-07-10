"use client";

import React, { useEffect, useRef, useState } from "react";
import { Label, Select, TextField, TextArea, Banner } from "../ui";
import { buscarLeads } from "@/asistente/lib/api";
import type {
  Handoff,
  PerfilComprador,
  NivelCalificacion,
  CatalogoProyecto,
  LeadCRM,
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

/** Códigos ordenados por longitud desc para separar el teléfono guardado. */
const CODIGOS = ["503", "502", "504", "505", "506", "507", "52", "34", "1"];

/** Separa un número guardado en {código de país, número local}. */
function separarTelefono(raw: string): { codigoPais: string; telefono: string } {
  const d = (raw || "").replace(/\D/g, "");
  for (const c of CODIGOS) {
    if (d.startsWith(c) && d.length - c.length >= 7) {
      return { codigoPais: c, telefono: d.slice(c.length) };
    }
  }
  return { codigoPais: "503", telefono: d };
}

function temperaturaACalificacion(t: string): NivelCalificacion | "" {
  const v = (t || "").toLowerCase();
  if (v === "caliente") return "Caliente - listo para cita";
  if (v === "frio" || v === "frío") return "Frío";
  if (v === "tibio") return "Tibio";
  return "";
}

function tempChip(t: string): { label: string; cls: string } {
  const v = (t || "").toLowerCase();
  if (v === "caliente")
    return { label: "Caliente", cls: "bg-red-100 text-red-700" };
  if (v === "frio" || v === "frío")
    return { label: "Frío", cls: "bg-sky-100 text-sky-700" };
  return { label: "Tibio", cls: "bg-amber-100 text-amber-700" };
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

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

  // --- Buscador de prospectos del CRM ---------------------------------------
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<LeadCRM[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  // Contexto del lead elegido (para mostrar su historial en la tarjeta).
  const [leadSel, setLeadSel] = useState<LeadCRM | null>(null);
  const reqId = useRef(0);

  // Carga contactos del CRM (recientes sin texto; filtrados al escribir).
  useEffect(() => {
    if (value.leadId || modoManual) return;
    const id = ++reqId.current;
    setBuscando(true);
    const t = setTimeout(() => {
      buscarLeads(query.trim())
        .then((rows) => {
          if (id === reqId.current) setResultados(rows);
        })
        .finally(() => {
          if (id === reqId.current) setBuscando(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query, value.leadId, modoManual]);

  function seleccionarLead(l: LeadCRM) {
    const { codigoPais, telefono } = separarTelefono(l.phone);
    const proy = proyectos.find((p) => p.id === l.projectSlug);
    setLeadSel(l);
    onChange({
      ...value,
      leadId: l.id,
      nombreProspecto: l.name,
      codigoPais,
      telefono,
      proyectoId: proy ? proy.id : value.proyectoId,
      calificacion:
        value.calificacion || temperaturaACalificacion(l.temperature),
    });
  }

  function quitarLead() {
    setLeadSel(null);
    setQuery("");
    onChange({
      ...value,
      leadId: "",
      nombreProspecto: "",
      telefono: "",
    });
  }

  function activarManual() {
    setModoManual(true);
    setLeadSel(null);
    onChange({ ...value, leadId: "" });
  }

  const leadElegido = Boolean(value.leadId);

  return (
    <div className="space-y-5">
      <p className="text-sm text-marino-600">
        Buscá al cliente en el CRM (ya registrado por el bot de WhatsApp). Sus
        datos e historial se traen automáticamente a la ficha.
      </p>

      {/* Prospecto: buscador del CRM / tarjeta del elegido / captura manual */}
      <div>
        <Label>Cliente (prospecto del CRM)</Label>

        {/* 1) Lead elegido → tarjeta con su contexto */}
        {leadElegido && (
          <div className="rounded-xl border border-marino-100 bg-marino-50 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-bold text-marino-800">
                  {value.nombreProspecto || leadSel?.name || "Prospecto"}
                </div>
                <div className="mt-0.5 text-xs text-marino-600">
                  {leadSel?.phone
                    ? `WhatsApp: ${leadSel.phone}`
                    : "Sin WhatsApp en el CRM"}
                </div>
              </div>
              <button
                onClick={quitarLead}
                className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-marino-700 shadow-sm transition hover:bg-marino-100"
              >
                Cambiar
              </button>
            </div>

            {leadSel && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    tempChip(leadSel.temperature).cls
                  }`}
                >
                  {tempChip(leadSel.temperature).label}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-marino-600">
                  {leadSel.stage}
                </span>
                {leadSel.projectName && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-marino-600">
                    {leadSel.projectName}
                  </span>
                )}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-marino-600">
                  {leadSel.activityCount} interacc.
                </span>
              </div>
            )}

            {leadSel?.lastActivity?.body && (
              <div className="mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-xs text-marino-600">
                <span className="font-semibold text-marino-700">
                  Último seguimiento
                  {leadSel.lastActivity.createdAt
                    ? ` · ${fechaCorta(leadSel.lastActivity.createdAt)}`
                    : ""}
                  :{" "}
                </span>
                {leadSel.lastActivity.body}
              </div>
            )}
            {leadSel?.nextActionNote && (
              <div className="mt-1.5 text-xs text-marino-600">
                <span className="font-semibold text-marino-700">
                  Próxima acción
                  {leadSel.nextActionAt
                    ? ` (${fechaCorta(leadSel.nextActionAt)})`
                    : ""}
                  :{" "}
                </span>
                {leadSel.nextActionNote}
              </div>
            )}
          </div>
        )}

        {/* 2) Modo manual → captura a mano (walk-in sin registro previo) */}
        {!leadElegido && modoManual && (
          <>
            <TextField
              value={value.nombreProspecto}
              onChange={(v) => set("nombreProspecto", v)}
              placeholder="Ej. José Martínez"
            />
            <button
              onClick={() => setModoManual(false)}
              className="mt-1.5 text-xs font-semibold text-marino-600 underline"
            >
              ← Buscar en el CRM
            </button>
          </>
        )}

        {/* 3) Buscador del CRM */}
        {!leadElegido && !modoManual && (
          <>
            <TextField
              value={query}
              onChange={setQuery}
              placeholder="Escribí nombre o WhatsApp…"
            />
            <div className="mt-2 overflow-hidden rounded-xl border border-marino-100">
              {buscando && resultados.length === 0 && (
                <div className="px-3 py-3 text-sm text-marino-500">
                  Buscando en el CRM…
                </div>
              )}
              {!buscando && resultados.length === 0 && (
                <div className="px-3 py-3 text-sm text-marino-500">
                  {query.trim()
                    ? "Sin coincidencias en el CRM."
                    : "No hay contactos recientes en tu cartera."}
                </div>
              )}
              {resultados.map((l, i) => {
                const chip = tempChip(l.temperature);
                return (
                  <button
                    key={l.id}
                    onClick={() => seleccionarLead(l)}
                    className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-marino-50 ${
                      i > 0 ? "border-t border-marino-50" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-marino-800">
                        {l.name}
                      </div>
                      <div className="truncate text-xs text-marino-500">
                        {l.phone || "sin WhatsApp"}
                        {l.projectName ? ` · ${l.projectName}` : ""}
                        {l.lastContactAt
                          ? ` · ${fechaCorta(l.lastContactAt)}`
                          : ""}
                      </div>
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.cls}`}
                    >
                      {chip.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={activarManual}
              className="mt-2 text-xs font-semibold text-marino-600 underline"
            >
              El cliente no está en el CRM · registrarlo a mano
            </button>
          </>
        )}
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
          {leadElegido
            ? "Se trajo del CRM; corregilo si hace falta. Se usa para enviarle la carta."
            : "Se usa para enviarle la carta al final y queda en su ficha del CRM."}
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
