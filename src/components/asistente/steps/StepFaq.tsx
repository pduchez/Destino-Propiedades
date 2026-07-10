"use client";

import React, { useState } from "react";
import { FAQS } from "@/asistente/config/legal";
import type { FaqRow } from "@/asistente/lib/api";

export function StepFaq({
  faqs,
  isAdmin,
}: {
  faqs: FaqRow[];
  isAdmin?: boolean;
}) {
  const [abierto, setAbierto] = useState<number | null>(0);

  // Si aún no cargaron desde la BD, se muestra el set base.
  const items =
    faqs && faqs.length
      ? faqs.filter((f) => f.activo)
      : FAQS.map((f, i) => ({
          id: `seed-${i}`,
          pregunta: f.pregunta,
          respuesta: f.respuesta,
          orden: i,
          activo: true,
        }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-marino-600">
          Respuestas oficiales para las dudas frecuentes del cliente.
        </p>
        {isAdmin && (
          <a
            href="/asistente/faqs"
            className="shrink-0 rounded-lg bg-marino-50 px-3 py-1.5 text-xs font-semibold text-marino-700 transition hover:bg-marino-100"
          >
            ✎ Administrar
          </a>
        )}
      </div>

      <div className="space-y-2">
        {items.map((f, i) => {
          const open = abierto === i;
          return (
            <div
              key={f.id}
              className="overflow-hidden rounded-xl border border-marino-100 bg-white"
            >
              <button
                onClick={() => setAbierto(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-marino-800">
                  {f.pregunta}
                </span>
                <span className="shrink-0 text-marino-500">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && (
                <div className="whitespace-pre-wrap border-t border-marino-50 px-4 py-3 text-sm text-marino-700">
                  {f.respuesta || "—"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
