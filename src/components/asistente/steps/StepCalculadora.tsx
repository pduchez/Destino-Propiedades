"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PLAZOS_ANOS,
  opcionesPrima,
} from "@/asistente/config/factores";
import { cotizar } from "@/asistente/lib/calc";
import { money, v2, pct } from "@/asistente/lib/format";
import { Label, Select, Card, ResultRow, Banner, Button } from "../ui";
import type { SeleccionLote, CatalogoProyecto } from "@/asistente/lib/types";

export function StepCalculadora({
  proyecto,
  value,
  onChange,
}: {
  proyecto?: CatalogoProyecto;
  value: SeleccionLote;
  onChange: (s: SeleccionLote) => void;
}) {
  const tasa = proyecto?.tasaAnual ?? 0.16;
  const primaMin = proyecto?.primaMinima ?? 0.2;
  const primaOpts = useMemo(() => opcionesPrima(primaMin), [primaMin]);

  const poligonos = useMemo(() => {
    if (!proyecto) return [];
    return Array.from(new Set(proyecto.lotes.map((l) => l.poligono))).sort();
  }, [proyecto]);
  const lotes = useMemo(() => {
    if (!proyecto || !value.poligono) return [];
    const numInt = (n: number | string) =>
      typeof n === "number" ? n : Number(/\d+/.exec(String(n))?.[0] || 0);
    return proyecto.lotes
      .filter((l) => l.poligono === value.poligono)
      .sort((a, b) => numInt(a.numero) - numInt(b.numero));
  }, [proyecto, value.poligono]);
  const lote = value.lote;

  // Ajusta la prima al mínimo del proyecto si la actual no es válida para él.
  useEffect(() => {
    if (!primaOpts.includes(value.porcentajePrima)) {
      onChange({ ...value, porcentajePrima: primaMin });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaMin]);

  // Cotización en tiempo real (se recalcula con cada cambio de dropdown).
  const cot = useMemo(() => {
    if (!lote || !value.anos) return null;
    return cotizar(lote.precioContado, value.porcentajePrima, value.anos, tasa);
  }, [lote, value.anos, value.porcentajePrima, tasa]);

  // ---- Comparador (hasta 3 plazos lado a lado) ----
  const [comparar, setComparar] = useState(false);
  const [combos, setCombos] = useState<number[]>([10, 15, 20]);

  function setPoligono(p: string) {
    onChange({ ...value, poligono: p, loteId: "", lote: undefined });
  }
  function setLoteId(id: string) {
    const l = proyecto?.lotes.find((x) => x.id === id);
    onChange({ ...value, loteId: id, lote: l });
  }
  function setAnos(a: string) {
    onChange({ ...value, anos: a ? Number(a) : null });
  }
  function setPrima(p: string) {
    onChange({ ...value, porcentajePrima: Number(p) });
  }

  if (!proyecto || !proyecto.tieneCatalogo) {
    return (
      <Banner tone="warn">
        <div className="font-semibold">Lotes pendientes de cargar</div>
        <div className="mt-1">
          El proyecto seleccionado aún no tiene lotes ni precios documentados en
          el sistema, así que todavía no se puede cotizar ni generar la carta.
          Elegí otro proyecto o volvé cuando el desarrollador cargue la
          información.
        </div>
      </Banner>
    );
  }

  return (
    <div className="space-y-5">
      {/* Condiciones del proyecto */}
      <div className="flex items-center justify-between rounded-xl bg-marino-50 px-3.5 py-2 text-xs text-marino-600">
        <span>
          Tasa <b className="text-marino-800">{pct(tasa)} anual</b>
        </span>
        <span>
          Prima mínima <b className="text-marino-800">{pct(primaMin)}</b>
        </span>
      </div>

      {/* --- Selección Polígono -> Lote --- */}
      <div>
        <Label>Polígono</Label>
        <Select
          value={value.poligono}
          onChange={setPoligono}
          placeholder="Seleccione polígono"
        >
          {poligonos.map((p) => (
            <option key={p} value={p}>
              Polígono {p}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Lote</Label>
        <Select
          value={value.loteId}
          onChange={setLoteId}
          placeholder={value.poligono ? "Seleccione lote" : "Elija polígono primero"}
          disabled={!value.poligono}
        >
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              Lote {l.numero}
              {l.pasaje ? ` · Pasaje ${l.pasaje}` : ""} — {v2(l.areaV2)}
            </option>
          ))}
        </Select>
      </div>

      {/* --- Datos autocompletados (solo lectura) --- */}
      {lote && (
        <Card className="bg-marino-50">
          <ResultRow label="Área" value={v2(lote.areaV2)} />
          <ResultRow
            label="Precio de contado"
            value={money(lote.precioContado)}
          />
        </Card>
      )}

      {/* --- Plazo y prima --- */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Plazo</Label>
          <Select
            value={value.anos ? String(value.anos) : ""}
            onChange={setAnos}
            placeholder="Años"
            disabled={!lote}
          >
            {PLAZOS_ANOS.map((a) => (
              <option key={a} value={a}>
                {a} {a === 1 ? "año" : "años"}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Prima</Label>
          <Select
            value={String(value.porcentajePrima)}
            onChange={setPrima}
            disabled={!lote}
          >
            {primaOpts.map((p) => (
              <option key={p} value={p}>
                {pct(p)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* --- Resultado en tiempo real --- */}
      {cot ? (
        <Card>
          <ResultRow label="Precio de contado" value={money(cot.precioContado)} />
          <ResultRow
            label={`Prima requerida (${pct(cot.porcentajePrima)})`}
            value={money(cot.primaRequerida)}
          />
          <ResultRow label="Monto a financiar" value={money(cot.montoFinanciar)} />
          <ResultRow
            label={`Cuota mensual · ${cot.meses} meses`}
            value={money(cot.cuotaMensual)}
            big
            gold
          />
          <ResultRow
            label="Valor total con financiamiento"
            value={money(cot.valorConFinanciamiento)}
          />
        </Card>
      ) : (
        <Banner tone="info">
          Seleccioná lote, plazo y prima para ver la cuota mensual.
        </Banner>
      )}

      {/* --- Comparador --- */}
      {lote && (
        <div>
          <Button
            variant="secondary"
            onClick={() => setComparar((c) => !c)}
          >
            {comparar ? "Ocultar comparador" : "Comparar plazos lado a lado"}
          </Button>

          {comparar && (
            <div className="mt-3">
              <Comparador
                precio={lote.precioContado}
                prima={value.porcentajePrima}
                tasa={tasa}
                combos={combos}
                setCombos={setCombos}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Comparador({
  precio,
  prima,
  tasa,
  combos,
  setCombos,
}: {
  precio: number;
  prima: number;
  tasa: number;
  combos: number[];
  setCombos: (c: number[]) => void;
}) {
  const cots = combos.map((a) => cotizar(precio, prima, a, tasa));

  function setCombo(i: number, a: string) {
    const next = [...combos];
    next[i] = Number(a);
    setCombos(next);
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-marino-600">
        Compará hasta 3 plazos con prima {pct(prima)}. Cambiá cada columna:
      </p>
      <div className="grid grid-cols-3 gap-2">
        {combos.map((a, i) => (
          <div key={i}>
            <Select value={String(a)} onChange={(v) => setCombo(i, v)}>
              {PLAZOS_ANOS.map((p) => (
                <option key={p} value={p}>
                  {p}a
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {cots.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-marino-100 bg-marino-50 p-2"
          >
            <div className="text-xs text-marino-500">{combos[i]} años</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-marino-400">
              Cuota/mes
            </div>
            <div className="text-sm font-bold text-dorado-600">
              {c ? money(c.cuotaMensual) : "—"}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-marino-400">
              Costo total
            </div>
            <div className="text-xs font-semibold text-marino-700">
              {c ? money(c.valorConFinanciamiento) : "—"}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function calculadoraCompleta(s: SeleccionLote): boolean {
  return Boolean(s.loteId && s.anos && s.porcentajePrima);
}
