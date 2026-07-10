"use client";

import React, { useMemo, useState } from "react";
import type { Proyecto, Lote } from "@/asistente/data/proyectos";
import type { Cotizacion } from "@/asistente/lib/calc";
import type { Carta } from "@/asistente/lib/types";
import { DIAS_LIMITE_COMPLEMENTO } from "@/asistente/config/factores";
import {
  money,
  formatDui,
  isDuiCompleto,
  fechaLarga,
  diffDays,
} from "@/asistente/lib/format";
import {
  Label,
  TextField,
  Card,
  ResultRow,
  Banner,
  Button,
} from "../ui";
import { SignatureField } from "../SignaturePad";
import { generarCartaPdf, nombreArchivoCarta, CartaPdfData } from "@/asistente/lib/pdf";

const WHATSAPP_NEGOCIO = "50364375417"; // WhatsApp central del negocio

export function StepCarta({
  proyecto,
  lote,
  cotizacion,
  nombreCliente,
  value,
  onChange,
  modoBloqueo,
  avisoBloqueo,
}: {
  proyecto: Proyecto;
  lote: Lote;
  cotizacion: Cotizacion;
  nombreCliente: string;
  value: Carta;
  onChange: (c: Carta) => void;
  modoBloqueo: "crm" | "autonomo" | "desconocido";
  avisoBloqueo?: string;
}) {
  const [generado, setGenerado] = useState(false);

  const set = <K extends keyof Carta>(k: K, v: Carta[K]) =>
    onChange({ ...value, [k]: v });

  const complemento = useMemo(
    () => Math.max(cotizacion.primaRequerida - (value.montoReservacion || 0), 0),
    [cotizacion.primaRequerida, value.montoReservacion]
  );

  // Validación dura de la fecha límite del complemento (≤ 8 días).
  const diasComplemento = diffDays(value.fecha, value.fechaLimiteComplemento);
  const fechaLimiteInvalida =
    diasComplemento < 0 || diasComplemento > DIAS_LIMITE_COMPLEMENTO;

  const ambasFirmas = Boolean(
    value.firmaClienteDataUrl && value.firmaEjecutivoDataUrl
  );

  const datosValidos =
    isDuiCompleto(value.dui) &&
    value.montoReservacion > 0 &&
    !fechaLimiteInvalida;

  const puedeGenerar = datosValidos && ambasFirmas;

  function buildPdfData(): CartaPdfData {
    return {
      proyecto,
      lote,
      cotizacion,
      nombreCliente,
      dui: value.dui,
      fecha: value.fecha,
      montoReservacion: value.montoReservacion,
      complementoPrima: complemento,
      fechaLimiteComplemento: value.fechaLimiteComplemento,
      firmaClienteDataUrl: value.firmaClienteDataUrl,
      firmaEjecutivoDataUrl: value.firmaEjecutivoDataUrl,
    };
  }

  function descargarPdf() {
    const data = buildPdfData();
    const doc = generarCartaPdf(data);
    doc.save(nombreArchivoCarta(data));
    setGenerado(true);
  }

  function mensajeCierre(): string {
    return (
      `Estimado/a ${nombreCliente}, adjunto su Carta Compromiso de Reservación ` +
      `del Lote ${lote.numero}, Polígono ${lote.poligono} — ${proyecto.lotificacion}. ` +
      `Reservación recibida: ${money(value.montoReservacion)}. ` +
      `Complemento de prima: ${money(complemento)} antes del ${fechaLarga(
        value.fechaLimiteComplemento
      )}.`
    );
  }

  function enviarWhatsApp() {
    // El PDF no se puede adjuntar client-side; generamos, descargamos y
    // abrimos WhatsApp con el mensaje pre-armado para que el vendedor adjunte.
    if (!generado) descargarPdf();
    const url = `https://wa.me/?text=${encodeURIComponent(mensajeCierre())}`;
    window.open(url, "_blank");
  }

  function enviarEmail() {
    if (!generado) descargarPdf();
    const subject = `Carta Compromiso de Reservación — Lote ${lote.numero} Pol. ${lote.poligono}`;
    const url = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(mensajeCierre())}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-5">
      {/* Indicador de bloqueo CRM */}
      <BloqueoBadge modo={modoBloqueo} aviso={avisoBloqueo} />

      {/* Resumen (reutiliza todo lo capturado) */}
      <Card className="bg-marino-50">
        <ResultRow label="Cliente" value={nombreCliente || "—"} />
        <ResultRow
          label="Lote"
          value={`N° ${lote.numero} · Pol. ${lote.poligono}`}
        />
        <ResultRow label="Precio de contado" value={money(cotizacion.precioContado)} />
        <ResultRow
          label="Financiamiento"
          value={`${cotizacion.anos} años (${cotizacion.meses} meses)`}
        />
        <ResultRow label="Cuota mensual" value={money(cotizacion.cuotaMensual)} />
        <ResultRow
          label="Valor con financiamiento"
          value={money(cotizacion.valorConFinanciamiento)}
        />
      </Card>

      {/* DUI */}
      <div>
        <Label>Número de DUI del cliente</Label>
        <TextField
          value={value.dui}
          onChange={(v) => set("dui", formatDui(v))}
          placeholder="00000000-0"
          inputMode="numeric"
        />
        {value.dui && !isDuiCompleto(value.dui) && (
          <p className="mt-1 text-xs text-red-600">
            Formato de DUI incompleto (00000000-0).
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <Label>Fecha de la reserva</Label>
        <input
          type="date"
          value={value.fecha}
          onChange={(e) => set("fecha", e.target.value)}
          className="w-full rounded-xl border border-marino-100 bg-white px-4 py-4 text-marino-800 shadow-sm outline-none focus:border-marino-600"
        />
      </div>

      {/* Monto reservación */}
      <div>
        <Label>Cantidad recibida en concepto de reservación ($)</Label>
        <TextField
          value={value.montoReservacion ? String(value.montoReservacion) : ""}
          onChange={(v) =>
            set("montoReservacion", Number(v.replace(/[^\d.]/g, "")) || 0)
          }
          placeholder="0.00"
          inputMode="decimal"
        />
      </div>

      {/* Complemento (calculado) */}
      <Card>
        <ResultRow
          label="Prima requerida"
          value={money(cotizacion.primaRequerida)}
        />
        <ResultRow
          label="Reservación recibida"
          value={money(value.montoReservacion || 0)}
        />
        <ResultRow
          label="Complemento de prima"
          value={money(complemento)}
          gold
        />
      </Card>

      {/* Fecha límite complemento con validación dura */}
      <div>
        <Label>Fecha límite del complemento (máx. {DIAS_LIMITE_COMPLEMENTO} días)</Label>
        <input
          type="date"
          value={value.fechaLimiteComplemento}
          min={value.fecha}
          onChange={(e) => set("fechaLimiteComplemento", e.target.value)}
          className={`w-full rounded-xl border px-4 py-4 shadow-sm outline-none ${
            fechaLimiteInvalida
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-marino-100 bg-white text-marino-800 focus:border-marino-600"
          }`}
        />
        {fechaLimiteInvalida && (
          <div className="mt-2">
            <Banner tone="danger">
              La fecha límite no puede exceder {DIAS_LIMITE_COMPLEMENTO} días desde la
              reserva (ni ser anterior a ella). Actualmente:{" "}
              {diasComplemento < 0
                ? "fecha anterior a la reserva"
                : `${diasComplemento} días`}
              .
            </Banner>
          </div>
        )}
      </div>

      {/* Firmas — primero cliente, luego ejecutivo */}
      <div className="space-y-4 pt-2">
        <SignatureField
          etiqueta="Cliente"
          onChange={(d) => set("firmaClienteDataUrl", d)}
        />
        <SignatureField
          etiqueta="Ejecutivo Inmobiliario"
          disabled={!value.firmaClienteDataUrl}
          onChange={(d) => set("firmaEjecutivoDataUrl", d)}
        />
        {!value.firmaClienteDataUrl && (
          <p className="text-xs text-marino-500">
            El cliente firma primero; luego se habilita la firma del ejecutivo.
          </p>
        )}
      </div>

      {/* Generar documento */}
      <div className="space-y-3 pt-2">
        <Button variant="gold" onClick={descargarPdf} disabled={!puedeGenerar}>
          Generar carta (PDF)
        </Button>
        {!puedeGenerar && (
          <p className="text-center text-xs text-marino-500">
            Completá DUI, monto, fecha válida y ambas firmas para generar el
            documento.
          </p>
        )}

        {generado && (
          <>
            <Banner tone="ok">
              Documento generado y descargado. Ya podés enviarlo al cliente.
            </Banner>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={enviarWhatsApp}>
                Enviar por WhatsApp
              </Button>
              <Button variant="secondary" onClick={enviarEmail}>
                Enviar por Email
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BloqueoBadge({
  modo,
  aviso,
}: {
  modo: "crm" | "autonomo" | "desconocido";
  aviso?: string;
}) {
  // Conflicto: el lote ya lo reservó otro vendedor.
  if (aviso && /otro vendedor/i.test(aviso)) {
    return (
      <Banner tone="danger">
        <span className="font-semibold">Atención:</span> {aviso}
      </Banner>
    );
  }
  if (modo === "crm") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Lote marcado “En trámite / Reservado” en el CRM.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-amber-700">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Modo sin conexión CRM — bloqueo local del lote.
    </div>
  );
}
