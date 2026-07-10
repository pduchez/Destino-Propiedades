"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Label, TextField, TextArea, Card, Banner } from "./ui";
import type { FaqRow } from "@/asistente/lib/api";

type EditFaq = FaqRow & { _nuevo?: boolean };

export default function FaqAdmin() {
  const [faqs, setFaqs] = useState<EditFaq[]>([]);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function cargar() {
    setCargando(true);
    try {
      const r = await fetch("/api/asistente/faqs", { cache: "no-store" });
      const d = await r.json();
      setFaqs((d.faqs as FaqRow[]) || []);
    } catch {
      setMsg({ tone: "danger", text: "No se pudieron cargar las preguntas." });
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  function flash(tone: "ok" | "danger", text: string) {
    setMsg({ tone, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function editar(i: number, patch: Partial<EditFaq>) {
    setFaqs((arr) => arr.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function agregar() {
    setFaqs((arr) => [
      ...arr,
      {
        id: `new-${Date.now()}`,
        pregunta: "",
        respuesta: "",
        orden: arr.length,
        activo: true,
        _nuevo: true,
      },
    ]);
  }

  async function guardar(i: number) {
    const f = faqs[i];
    if (!f.pregunta.trim()) return flash("danger", "La pregunta no puede estar vacía.");
    try {
      if (f._nuevo) {
        const r = await fetch("/api/asistente/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pregunta: f.pregunta,
            respuesta: f.respuesta,
            activo: f.activo,
          }),
        });
        if (!r.ok) throw new Error();
      } else {
        const r = await fetch("/api/asistente/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: f.id,
            pregunta: f.pregunta,
            respuesta: f.respuesta,
            orden: f.orden,
            activo: f.activo,
          }),
        });
        if (!r.ok) throw new Error();
      }
      flash("ok", "Guardado.");
      cargar();
    } catch {
      flash("danger", "No se pudo guardar.");
    }
  }

  async function eliminar(i: number) {
    const f = faqs[i];
    if (f._nuevo) {
      setFaqs((arr) => arr.filter((_, idx) => idx !== i));
      return;
    }
    if (!confirm("¿Eliminar esta pregunta?")) return;
    try {
      const r = await fetch(`/api/asistente/faqs?id=${encodeURIComponent(f.id)}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error();
      flash("ok", "Eliminada.");
      cargar();
    } catch {
      flash("danger", "No se pudo eliminar.");
    }
  }

  function exportar() {
    const data = faqs
      .filter((f) => !f._nuevo)
      .map(({ pregunta, respuesta, orden, activo }) => ({
        pregunta,
        respuesta,
        orden,
        activo,
      }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faqs-asistente-cierre.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importar(file: File) {
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error();
      const r = await fetch("/api/asistente/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!r.ok) throw new Error();
      flash("ok", "Preguntas importadas.");
      cargar();
    } catch {
      flash("danger", "Archivo inválido. Debe ser un JSON con la lista de preguntas.");
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md">
      <header className="sticky top-0 z-10 bg-marino-700 px-4 py-3 text-white shadow-card">
        <div className="flex items-center justify-between">
          <a
            href="/asistente"
            className="rounded-lg px-2 py-1 text-xs text-marino-100/80 hover:bg-white/10 hover:text-white"
          >
            ← Asistente
          </a>
          <span className="text-sm font-bold">Preguntas frecuentes</span>
          <span className="w-16 text-right text-[11px] text-marino-100/70">
            Director
          </span>
        </div>
      </header>

      <div className="space-y-4 px-4 py-5">
        <p className="text-sm text-marino-600">
          Editá las preguntas y respuestas del módulo de Financiamiento. Los
          cambios se sincronizan con el Asistente de todos los vendedores.
        </p>

        {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={exportar}>
            Descargar (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Importar (JSON)
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importar(f);
              e.target.value = "";
            }}
          />
        </div>

        {cargando ? (
          <p className="text-sm text-marino-500">Cargando…</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Card key={f.id}>
                <div className="space-y-3">
                  <div>
                    <Label>Pregunta</Label>
                    <TextField
                      value={f.pregunta}
                      onChange={(v) => editar(i, { pregunta: v })}
                      placeholder="Escribí la pregunta"
                    />
                  </div>
                  <div>
                    <Label>Respuesta</Label>
                    <TextArea
                      value={f.respuesta}
                      onChange={(v) => editar(i, { respuesta: v })}
                      placeholder="Escribí la respuesta oficial"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-marino-700">
                      <input
                        type="checkbox"
                        checked={f.activo}
                        onChange={(e) => editar(i, { activo: e.target.checked })}
                        className="h-4 w-4"
                      />
                      Visible en el Asistente
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-marino-500">Orden</label>
                      <input
                        type="number"
                        value={f.orden}
                        onChange={(e) =>
                          editar(i, { orden: Number(e.target.value) || 0 })
                        }
                        className="w-16 rounded-lg border border-marino-100 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="gold" onClick={() => guardar(i)} className="!py-3">
                      Guardar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => eliminar(i)}
                      className="!py-3 text-red-600"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="secondary" onClick={agregar}>
              + Agregar pregunta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
