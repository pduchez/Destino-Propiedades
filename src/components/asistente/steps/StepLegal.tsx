"use client";

import React from "react";
import { getEstadoLegal, GUION_DATO_NO_FRESCO } from "@/asistente/config/legal";
import { Card, Banner, ResultRow } from "../ui";

export function StepLegal({ proyectoId }: { proyectoId: string }) {
  const info = getEstadoLegal(proyectoId);

  if (!info) {
    return (
      <Banner tone="warn">
        No hay información legal cargada para este proyecto.
      </Banner>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-marino-600">
        Consulta del estado legal de la finca matriz. Datos de solo lectura.
      </p>

      <Card>
        <ResultRow label="Estado de la finca" value={info.estado} />
        {info.acreedor && <ResultRow label="Acreedor" value={info.acreedor} />}
        {info.plazoEstimadoLiberacion && (
          <ResultRow
            label="Plazo estimado de liberación"
            value={info.plazoEstimadoLiberacion}
          />
        )}
        <ResultRow label="Actualizado al" value={info.actualizadoAl} />
      </Card>

      <div>
        <div className="mb-1.5 text-sm font-semibold text-marino-700">
          Mecanismo de liberación del lote
        </div>
        <Card>
          <p className="text-sm text-marino-700">{info.mecanismoLiberacion}</p>
        </Card>
      </div>

      {info.pendienteConfirmar && (
        <Banner tone="warn">
          <div className="font-semibold">Dato no confirmado / no fresco.</div>
          <div className="mt-1">
            Guion sugerido para el cliente:
            <span className="mt-1 block rounded-lg bg-white/70 px-3 py-2 italic">
              “{GUION_DATO_NO_FRESCO}”
            </span>
          </div>
        </Banner>
      )}
    </div>
  );
}
