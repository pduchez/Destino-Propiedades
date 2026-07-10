"use client";

import React, { useState } from "react";
import { FAQS } from "@/asistente/config/legal";
import { Banner } from "../ui";

export function StepFaq() {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-marino-600">
        Respuestas oficiales para las dudas frecuentes del cliente.
      </p>

      <div className="space-y-2">
        {FAQS.map((f, i) => {
          const open = abierto === i;
          return (
            <div
              key={i}
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
                <div className="border-t border-marino-50 px-4 py-3 text-sm text-marino-700">
                  {f.pendienteConfirmar ? (
                    <Banner tone="warn">{f.respuesta}</Banner>
                  ) : (
                    <p>{f.respuesta}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
