"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PRIMA_MINIMA,
  DIAS_LIMITE_COMPLEMENTO,
} from "@/asistente/config/factores";
import { cotizar } from "@/asistente/lib/calc";
import { toDateInput, addDays } from "@/asistente/lib/format";
import { bloquearLote } from "@/asistente/lib/crmClient";
import { fetchProyectos, fetchFaqs, type FaqRow } from "@/asistente/lib/api";
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
import type {
  Handoff,
  SeleccionLote,
  Carta,
  CatalogoProyecto,
} from "@/asistente/lib/types";

type StepKey = "handoff" | "calc" | "legal" | "faq" | "carta";

const STEP_META: Record<StepKey, { title: string; subtitle: string }> = {
  handoff: { title: "Ficha de Handoff", subtitle: "Datos del lead" },
  calc: { title: "Lote y Cuotas", subtitle: "Calculadora" },
  legal: { title: "Estado Legal", subtitle: "Finca matriz (Director)" },
  faq: { title: "Financiamiento", subtitle: "Preguntas frecuentes" },
  carta: { title: "Carta de Reservación", subtitle: "Documento y firma" },
};

export default function AsistenteWizard() {
  const [ejecutivo, setEjecutivo] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [roleReady, setRoleReady] = useState(false);

  const [proyectos, setProyectos] = useState<CatalogoProyecto[]>([]);
  const [cargandoProy, setCargandoProy] = useState(true);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  const [step, setStep] = useState(0);

  const [handoff, setHandoff] = useState<Handoff>({
    nombreProspecto: "",
    telefono: "",
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
    comentarios: "",
    firmaClienteDataUrl: null,
    firmaEjecutivoDataUrl: null,
  });

  const [modoBloqueo, setModoBloqueo] = useState<
    "crm" | "autonomo" | "desconocido"
  >("desconocido");
  const [avisoBloqueo, setAvisoBloqueo] = useState<string>("");

  // Carga inicial: usuario/rol, fechas por defecto, catálogo y FAQ.
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
        if (d?.authenticated) {
          setEjecutivo(d.username || "");
          setIsAdmin(d.role === "admin");
        }
      })
      .catch(() => {})
      .finally(() => setRoleReady(true));
    fetchProyectos()
      .then(setProyectos)
      .finally(() => setCargandoProy(false));
    fetchFaqs().then(setFaqs);
  }, []);

  // Pasos según rol: el Estado Legal es exclusivo del Director (admin).
  const stepKeys: StepKey[] = useMemo(
    () =>
      isAdmin
        ? ["handoff", "calc", "legal", "faq", "carta"]
        : ["handoff", "calc", "faq", "carta"],
    [isAdmin]
  );
  // Si cambia la lista de pasos, mantené el índice dentro de rango.
  useEffect(() => {
    setStep((s) => Math.min(s, stepKeys.length - 1));
  }, [stepKeys.length]);

  const currentKey = stepKeys[step];

  const proyecto = proyectos.find((p) => p.id === handoff.proyectoId);
  const lote = seleccion.lote;
  const cotizacion = useMemo(
    () =>
      lote && seleccion.anos
        ? cotizar(
            lote.precioContado,
            seleccion.porcentajePrima,
            seleccion.anos,
            proyecto?.tasaAnual
          )
        : null,
    [lote, seleccion.anos, seleccion.porcentajePrima, proyecto?.tasaAnual]
  );

  // Al cambiar de proyecto, reinicia la selección y la prima al mínimo del
  // proyecto (cada proyecto tiene su propia tasa y prima mínima).
  useEffect(() => {
    setSeleccion({
      poligono: "",
      loteId: "",
      lote: undefined,
      anos: null,
      porcentajePrima: proyecto?.primaMinima ?? PRIMA_MINIMA,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff.proyectoId]);

  // Bloqueo del lote + registro en el CRM al INICIAR el llenado del documento.
  useEffect(() => {
    if (currentKey === "carta" && lote) {
      bloquearLote({
        loteId: lote.id,
        proyectoId: handoff.proyectoId,
        proyectoNombre: proyecto?.nombre || "",
        poligono: lote.poligono,
        numero: Number(lote.numero) || 0,
        precio: lote.precioContado,
        prospecto: handoff.nombreProspecto,
        telefono: handoff.telefono,
        calificacion: handoff.calificacion || "",
        perfil: handoff.perfil || "",
        notas: handoff.notas || "",
      }).then((r) => {
        setModoBloqueo(r.modo);
        setAvisoBloqueo(r.detalle || "");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, lote?.id]);

  const canAdvance = useMemo(() => {
    if (currentKey === "handoff") return handoffCompleto(handoff);
    if (currentKey === "calc") return calculadoraCompleta(seleccion);
    return true;
  }, [currentKey, handoff, seleccion]);

  const esUltimo = step === stepKeys.length - 1;

  function next() {
    if (step < stepKeys.length - 1 && canAdvance) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function irAlCrm() {
    window.location.href = "/crm";
  }

  const meta = STEP_META[currentKey];

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
          <div className="flex items-center gap-2">
            <button
              onClick={irAlCrm}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Ir al CRM
            </button>
            {ejecutivo && (
              <span className="text-[11px] text-marino-100/70">
                {ejecutivo}
              </span>
            )}
          </div>
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
                Paso {step + 1} de {stepKeys.length}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-dorado-400">
              {meta.title}
            </div>
            <div className="text-[11px] text-marino-100/70">{meta.subtitle}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {stepKeys.map((_, i) => (
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
        <h1 className="mb-4 text-lg font-bold text-marino-800">{meta.title}</h1>

        {currentKey === "handoff" && (
          <StepHandoff
            value={handoff}
            onChange={setHandoff}
            proyectos={proyectos}
            cargando={cargandoProy}
          />
        )}

        {currentKey === "calc" && (
          <StepCalculadora
            proyecto={proyecto}
            value={seleccion}
            onChange={setSeleccion}
          />
        )}

        {currentKey === "legal" && (
          <StepLegal proyectoId={handoff.proyectoId} />
        )}

        {currentKey === "faq" && <StepFaq faqs={faqs} isAdmin={isAdmin} />}

        {currentKey === "carta" && proyecto && lote && cotizacion && (
          <StepCarta
            proyecto={proyecto}
            lote={lote}
            cotizacion={cotizacion}
            nombreCliente={handoff.nombreProspecto}
            telefonoCliente={handoff.telefono}
            value={carta}
            onChange={setCarta}
            modoBloqueo={modoBloqueo}
            avisoBloqueo={avisoBloqueo}
          />
        )}

        {currentKey === "carta" && (!lote || !cotizacion) && (
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
            <>
              <div className="flex-1">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Nuevo cliente
                </Button>
              </div>
              <div className="flex-1">
                <Button onClick={irAlCrm}>Ir al CRM</Button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
