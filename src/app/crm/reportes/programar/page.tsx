"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Schedule {
  id: string;
  kind: string;
  period: string;
  hour: number;
  destination: string;
  enabled: boolean;
  lastRunAt: string | null;
}
interface Seller {
  id: string;
  username: string;
  displayName: string;
  phone: string;
}

const PERIODS = [
  { k: "daily", l: "Diario" },
  { k: "weekly", l: "Semanal (lunes)" },
  { k: "monthly", l: "Mensual (día 1)" },
];

export default function ProgramarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [waReady, setWaReady] = useState(true);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState("");

  const load = useCallback(async () => {
    const d = await api<{ schedules: Schedule[]; sellers: Seller[]; whatsappReady: boolean }>(
      "/api/crm/schedules",
    );
    setSchedules(d.schedules);
    setSellers(d.sellers);
    setWaReady(d.whatsappReady);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const dirSchedules = schedules.filter((s) => s.kind === "director_summary");
  const sellerSchedule = schedules.find((s) => s.kind === "seller_portfolio");

  async function save(s: Partial<Schedule>) {
    await api("/api/crm/schedules", { method: "POST", body: JSON.stringify(s) });
    load();
  }
  async function remove(id: string) {
    await api(`/api/crm/schedules?id=${id}`, { method: "DELETE" });
    load();
  }
  async function test(kind: string, period: string, destination?: string) {
    setMsg("Generando…");
    setPreview("");
    try {
      const r = await api<{ result?: { delivered: boolean; preview: boolean; error?: string }; text?: string; results?: unknown[] }>(
        "/api/crm/schedules/test",
        { method: "POST", body: JSON.stringify({ kind, period, destination }) },
      );
      if (r.text) setPreview(r.text);
      if (r.result) {
        setMsg(r.result.delivered ? "Enviado ✓" : r.result.preview ? "Vista previa (WhatsApp no conectado)" : `Error: ${r.result.error}`);
      } else {
        setMsg("Vista previa generada para cada vendedor.");
      }
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/crm/reportes" className="text-sm text-slate-400 hover:text-brand">← Volver a reportes</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Programar envíos automáticos</h1>
      </div>

      {!waReady && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          ⚠️ WhatsApp aún no está conectado. Las programaciones se guardan y funcionan en{" "}
          <strong>modo vista previa</strong> (se genera el reporte pero no se envía). Para envío
          real, agrega <code>WHATSAPP_TOKEN</code> y <code>WHATSAPP_PHONE_ID</code> en Vercel.
        </div>
      )}

      {/* Reportes al director */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">📱 Reportes a mi móvil</h2>
        <p className="text-sm text-slate-500">
          Elige qué reporte quieres recibir, a qué número y con qué frecuencia.
        </p>
        {dirSchedules.map((s) => (
          <ScheduleRow key={s.id} s={s} onSave={save} onRemove={remove} onTest={() => test("director_summary", s.period, s.destination)} />
        ))}
        <NewDirectorSchedule onSave={save} />
      </div>

      {/* Reporte diario a vendedores */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">👥 Reporte diario a cada vendedor</h2>
        <p className="text-sm text-slate-500">
          Cada vendedor recibe por WhatsApp el estado de su cartera. Define el teléfono de cada uno.
        </p>
        <div className="space-y-2">
          {sellers.map((v) => (
            <SellerPhone key={v.id} seller={v} onSaved={load} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!sellerSchedule?.enabled}
              onChange={(e) =>
                save({
                  id: sellerSchedule?.id,
                  kind: "seller_portfolio",
                  period: "daily",
                  hour: sellerSchedule?.hour ?? 7,
                  enabled: e.target.checked,
                })
              }
            />
            Activar envío diario a vendedores
          </label>
          {sellerSchedule && (
            <label className="flex items-center gap-2 text-sm text-slate-500">
              a las
              <input
                type="number" min={0} max={23}
                className="input w-20"
                defaultValue={sellerSchedule.hour}
                onBlur={(e) =>
                  save({ id: sellerSchedule.id, kind: "seller_portfolio", period: "daily", hour: Number(e.target.value), enabled: sellerSchedule.enabled })
                }
              />
              h
            </label>
          )}
          <button className="btn-secondary" onClick={() => test("seller_portfolio", "daily")}>
            Enviar prueba a todos
          </button>
        </div>
      </div>

      {msg && <div className="card bg-slate-50 text-sm text-slate-600">{msg}</div>}
      {preview && (
        <div className="card">
          <div className="mb-2 text-sm font-semibold text-slate-600">Vista previa del mensaje</div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-slate-900 p-3 text-xs text-slate-100">{preview}</pre>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  s, onSave, onRemove, onTest,
}: {
  s: Schedule; onSave: (s: Partial<Schedule>) => void; onRemove: (id: string) => void; onTest: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
      <input type="checkbox" checked={s.enabled} onChange={(e) => onSave({ ...s, enabled: e.target.checked })} />
      <select className="input w-auto" value={s.period} onChange={(e) => onSave({ ...s, period: e.target.value })}>
        {PERIODS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
      </select>
      <span className="text-slate-400">a las</span>
      <input type="number" min={0} max={23} className="input w-20" value={s.hour} onChange={(e) => onSave({ ...s, hour: Number(e.target.value) })} />
      <span className="text-slate-400">h →</span>
      <input className="input w-40" placeholder="+503…" value={s.destination} onChange={(e) => onSave({ ...s, destination: e.target.value })} />
      <button className="text-xs text-brand hover:underline" onClick={onTest}>Probar</button>
      <button className="text-xs text-red-500 hover:underline" onClick={() => onRemove(s.id)}>Eliminar</button>
    </div>
  );
}

function NewDirectorSchedule({ onSave }: { onSave: (s: Partial<Schedule>) => void }) {
  const [period, setPeriod] = useState("daily");
  const [hour, setHour] = useState(7);
  const [destination, setDestination] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
      <div>
        <label className="label">Reporte</label>
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Hora</label>
        <input type="number" min={0} max={23} className="input w-20" value={hour} onChange={(e) => setHour(Number(e.target.value))} />
      </div>
      <div className="flex-1">
        <label className="label">Mi WhatsApp</label>
        <input className="input" placeholder="+503 7000 0000" value={destination} onChange={(e) => setDestination(e.target.value)} />
      </div>
      <button
        className="btn-primary"
        onClick={() => {
          if (!destination.trim()) return;
          onSave({ kind: "director_summary", period, hour, destination, enabled: true });
          setDestination("");
        }}
      >
        + Agregar
      </button>
    </div>
  );
}

function SellerPhone({ seller, onSaved }: { seller: Seller; onSaved: () => void }) {
  const [phone, setPhone] = useState(seller.phone);
  const [saved, setSaved] = useState(false);
  async function save() {
    await api("/api/crm/sellers", { method: "PATCH", body: JSON.stringify({ userId: seller.id, phone }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved();
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 text-slate-600">{seller.displayName || seller.username}</span>
      <input className="input" placeholder="+503…" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={save} />
      {saved && <span className="text-xs text-emerald-600">✓</span>}
    </div>
  );
}
