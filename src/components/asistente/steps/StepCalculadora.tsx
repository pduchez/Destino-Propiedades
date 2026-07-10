"use client";

import React, { useMemo, useState } from "react";
import { TABLA_FACTORES, OPCIONES_PRIMA } from "@/asistente/config/factores";
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
  const poligonos = useMemo(() => {
    if (!proyecto) return [];
    return Array.from(new Set(proyecto.lotes.map((l) => l.poligono))).sort();
  }, [proyecto]);
  const lotes = useMemo(() => {
    if (!proyecto || !value.poligono) return [];
    return proyecto.lotes
      .filter((l) => l.poligono === value.poligono)
      .sort((a, b) => a.numero - b.numero);
  }, [proyecto, value.poligono]);
  const lote = value.lote;

  // Cotización en tiempo real (se recalcula con cada cambio de dropdown).
  const cot = useMemo(() => {
    if (!lote || !value.anos) return null;
    return cotizar(lote.precioContado, value.porcentajePrima, value.anos);
  }, [lote, value.anos, value.porcentajePrima]);

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
              Lote {l.numero} — {v2(l.areaV2)}
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
            {TABLA_FACTORES.map((p) => (
              <option key={p.anos} value={p.anos}>
                {p.anos} {p.anos === 1 ? "año" : "años"}
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
            {OPCIONES_PRIMA.map((p) => (
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
  combos,
  setCombos,
}: {
  precio: number;
  prima: number;
  combos: number[];
  setCombos: (c: number[]) => void;
}) {
  const cots = combos.map((a) => cotizar(precio, prima, a));

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
              {TABLA_FACTORES.map((p) => (
                <option key={p.anos} value={p.anos}>
                  {p.anos}a
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
