"use client";

import React, { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "./ui";

/**
 * Campo de firma touch. Al terminar un trazo, entrega el dataURL (PNG) al
 * padre. Botón para limpiar y rehacer. Bloqueado cuando `disabled`.
 */
export function SignatureField({
  etiqueta,
  disabled,
  onChange,
}: {
  etiqueta: string;
  disabled?: boolean;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [firmado, setFirmado] = useState(false);

  // El efecto de montaje corre una sola vez y capturaría un `onChange` viejo
  // (con el estado inicial de la carta), lo que borraría datos ya escritos al
  // firmar. Mantenemos siempre la última versión en un ref.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Escala para pantallas retina y ancho del contenedor. Solo re-ajusta si
    // cambia el ANCHO real (una rotación), no la altura: en el celular abrir el
    // teclado dispara "resize" por altura y NO debe borrar la firma. Al cambiar
    // el ancho, preserva los trazos con toData()/fromData().
    let lastWidth = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 320;
      if (width === lastWidth) return; // cambio de solo altura → ignorar
      lastWidth = width;
      const pad = padRef.current;
      const saved = pad && !pad.isEmpty() ? pad.toData() : null;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const height = 150;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      if (!pad) return;
      pad.clear();
      if (saved && saved.length) {
        pad.fromData(saved);
        setFirmado(true);
        onChangeRef.current(pad.toDataURL("image/png"));
      } else {
        setFirmado(false);
        onChangeRef.current(null);
      }
    };

    const pad = new SignaturePadLib(canvas, {
      penColor: "#0f2743",
      minWidth: 0.8,
      maxWidth: 2.2,
    });
    padRef.current = pad;

    pad.addEventListener("endStroke", () => {
      if (!pad.isEmpty()) {
        setFirmado(true);
        onChangeRef.current(pad.toDataURL("image/png"));
      }
    });

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Habilitar / deshabilitar el pad según prop.
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    if (disabled) pad.off();
    else pad.on();
  }, [disabled]);

  function limpiar() {
    padRef.current?.clear();
    setFirmado(false);
    onChange(null);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-marino-700">
          Firma de {etiqueta}
        </span>
        {firmado && (
          <span className="text-xs font-medium text-emerald-600">✓ Firmado</span>
        )}
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border-2 ${
          disabled
            ? "border-dashed border-gray-200 bg-gray-50"
            : "border-marino-100 bg-white"
        }`}
      >
        <canvas ref={canvasRef} className="signature-canvas block w-full" />
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Esperando…
          </div>
        )}
        {!disabled && !firmado && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-300">
            Firme con el dedo aquí
          </div>
        )}
      </div>
      <div className="mt-2">
        <Button
          variant="ghost"
          onClick={limpiar}
          disabled={disabled || !firmado}
          className="!py-2 text-sm"
        >
          Limpiar firma
        </Button>
      </div>
    </div>
  );
}
