"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getProyecto } from "@/asistente/data/proyectos";
import {
  PRIMA_MINIMA,
  DIAS_LIMITE_COMPLEMENTO,
} from "@/asistente/config/factores";
import { cotizar } from "@/asistente/lib/calc";
import { toDateInput, addDays } from "@/asistente/lib/format";
import { bloquearLote } from "@/asistente/lib/crmClient";
import { Button } from "@/components/asistente/ui";
import {
  StepHandoff,
  handoffCompleto,
} from "@/components/asistente/steps/StepHandoff";
import {
  StepCalculadora,
  calculadoraCompleta,
} from "@/components/asistente/steps/StepCalculadora";
import { StepLegal } from "@/components/asistente/steps/StepLegal";
import { StepFaq } from "@/components/asistente/steps/StepFaq";
import { StepCarta } from "@/components/asistente/steps/StepCarta";
import type { Handoff, SeleccionLote, Carta } from "@/asistente/lib/types";

const STEPS = [
  { title: "Ficha de Handoff", subtitle: "Datos del lead" },
  { title: "Lote y Cuotas", subtitle: "Calculadora" },
  { title: "Estado Legal", subtitle: "Finca matriz" },
  { title: "Financiamiento", subtitle: "Preguntas frecuentes" },
  { title: "Carta de Reservación", subtitle: "Documento y firma" },
];

export default function AsistenteWizard() {
  const [step, setStep] = useState(0);
  const [ejecutivo, setEjecutivo] = useState<string>("");

  const [handoff, setHandoff] = useState<Handoff>({
    nombreProspecto: "",
    perfil: "",
    proyectoId: "",
    calificacion: "",
    notas: "",
  });

  const [seleccion, setSeleccion] = useState<SeleccionLote>({
    poligono: "",
    loteId: "",
    lote: undefined,
    anos: null,
    porcentajePrima: PRIMA_MINIMA,
  });

  const [carta, setCarta] = useState<Carta>({
    fecha: "",
    dui: "",
    montoReservacion: 0,
    fechaLimiteComplemento: "",
    firmaClienteDataUrl: null,
    firmaEjecutivoDataUrl: null,
  });

  const [modoBloqueo, setModoBloqueo] = useState<
    "crm" | "autonomo" | "desconocido"
  >("desconocido");
  const [avisoBloqueo, setAvisoBloqueo] = useState<string>("");

  // Fechas por defecto + usuario logueado (cliente, para evitar desfase de SSR).
  useEffect(() => {
    const hoy = toDateInput(new Date());
    setCarta((c) => ({
      ...c,
      fecha: c.fecha || hoy,
      fechaLimiteComplemento:
        c.fechaLimiteComplemento || addDays(hoy, DIAS_LIMITE_COMPLEMENTO),
    }));
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated) setEjecutivo(d.username || "");
      })
      .catch(() => {});
  }, []);

  const proyecto = getProyecto(handoff.proyectoId);
  const lote = seleccion.lote;
  const cotizacion = useMemo(
    () =>
      lote && seleccion.anos
        ? cotizar(lote.precioContado, seleccion.porcentajePrima, seleccion.anos)
        : null,
    [lote, seleccion.anos, seleccion.porcentajePrima]
  );

  // Bloqueo del lote + registro en el CRM al INICIAR el llenado del documento.
  useEffect(() => {
    if (step === 4 && lote) {
      bloquearLote({
        loteId: lote.id,
        proyectoId: handoff.proyectoId,
        proyectoNombre: proyecto?.nombre || "",
        poligono: lote.poligono,
        numero: lote.numero,
        precio: lote.precioContado,
        prospecto: handoff.nombreProspecto,
        calificacion: handoff.calificacion || "",
        perfil: handoff.perfil || "",
        notas: handoff.notas || "",
      }).then((r) => {
        setModoBloqueo(r.modo);
        setAvisoBloqueo(r.detalle || "");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lote?.id]);

  const canAdvance = useMemo(() => {
    if (step === 0) return handoffCompleto(handoff);
    if (step === 1) return calculadoraCompleta(seleccion);
    return true;
  }, [step, handoff, seleccion]);

  const esUltimo = step === STEPS.length - 1;

  function next() {
    if (step < STEPS.length - 1 && canAdvance) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-marino-700 px-4 pb-3 pt-3 text-white shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <a
            href="/inicio"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-marino-100/80 transition hover:bg-white/10 hover:text-white"
          >
            ← Menú
          </a>
          {ejecutivo && (
            <span className="text-[11px] text-marino-100/70">
              Ejecutivo: <span className="font-semibold text-white">{ejecutivo}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dorado-500 text-sm font-black text-marino-900">
              AC
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">
                Asistente de Cierre
              </div>
              <div className="text-[11px] text-marino-100/70">
                Paso {step + 1} de {STEPS.length}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-dorado-400">
              {STEPS[step].title}
            </div>
            <div className="text-[11px] text-marino-100/70">
              {STEPS[step].subtitle}
            </div>
          </div>
        </div>
        {/* Progreso */}
        <div className="mt-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-dorado-500" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        <h1 className="mb-4 text-lg font-bold text-marino-800">
          {STEPS[step].title}
        </h1>

        {step === 0 && <StepHandoff value={handoff} onChange={setHandoff} />}

        {step === 1 && handoff.proyectoId && (
          <StepCalculadora
            proyectoId={handoff.proyectoId}
            value={seleccion}
            onChange={setSeleccion}
          />
        )}

        {step === 2 && <StepLegal proyectoId={handoff.proyectoId} />}

        {step === 3 && <StepFaq />}

        {step === 4 && proyecto && lote && cotizacion && (
          <StepCarta
            proyecto={proyecto}
            lote={lote}
            cotizacion={cotizacion}
            nombreCliente={handoff.nombreProspecto}
            value={carta}
            onChange={setCarta}
            modoBloqueo={modoBloqueo}
            avisoBloqueo={avisoBloqueo}
          />
        )}

        {step === 4 && (!lote || !cotizacion) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Falta seleccionar lote, plazo y prima en el paso “Lote y Cuotas”.
          </div>
        )}
      </main>

      {/* Navegación */}
      <footer className="sticky bottom-0 border-t border-marino-100 bg-white px-4 py-3">
        <div className="flex gap-3">
          {step > 0 && (
            <div className="w-1/3">
              <Button variant="secondary" onClick={back}>
                Atrás
              </Button>
            </div>
          )}
          {!esUltimo && (
            <div className="flex-1">
              <Button onClick={next} disabled={!canAdvance}>
                Continuar
              </Button>
            </div>
          )}
          {esUltimo && (
            <div className="flex-1">
              <Button variant="secondary" onClick={() => setStep(0)}>
                Nuevo cliente
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
