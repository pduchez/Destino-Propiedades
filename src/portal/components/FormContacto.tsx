"use client";

import { useState } from "react";
import Link from "next/link";
import { sitio } from "../data/sitio";
import { proyectos } from "../data/proyectos";
import { normalizarNumero, linkLlamar } from "../lib/whatsapp";

export function FormContacto() {
  const numero = normalizarNumero(sitio.contacto.whatsapp);
  const telUrl = linkLlamar(sitio.contacto.telefono);
  const [error, setError] = useState("");
  const inputCls = "w-full rounded-lg border border-navy/20 px-3 py-2.5 focus:outline-none focus:border-sand";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem("nombre") as HTMLInputElement).value.trim();
    const telefono = (form.elements.namedItem("telefono") as HTMLInputElement).value.trim();
    const proyecto = (form.elements.namedItem("proyecto") as HTMLSelectElement).value;
    const mensaje = (form.elements.namedItem("mensaje") as HTMLTextAreaElement).value.trim();
    const consent = (form.elements.namedItem("consentimiento") as HTMLInputElement).checked;
    if (!nombre || !mensaje || !consent) {
      setError("Completá tu nombre, tu mensaje y aceptá el aviso de privacidad.");
      return;
    }
    setError("");
    let texto = `Hola, soy ${nombre}.`;
    if (proyecto) texto += ` Me interesa el proyecto ${proyecto}.`;
    texto += ` ${mensaje}`;
    if (telefono) texto += ` Mi contacto: ${telefono}.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label htmlFor="c-nombre" className="block text-sm font-semibold mb-1">Nombre <span className="text-sand">*</span></label>
        <input id="c-nombre" name="nombre" type="text" required className={inputCls} />
      </div>
      <div>
        <label htmlFor="c-telefono" className="block text-sm font-semibold mb-1">Teléfono o WhatsApp <span className="text-navy/40 font-normal">(opcional)</span></label>
        <input id="c-telefono" name="telefono" type="tel" inputMode="tel" placeholder="Ej. +1 305 555 1234" className={inputCls} />
      </div>
      <div>
        <label htmlFor="c-proyecto" className="block text-sm font-semibold mb-1">Proyecto de interés</label>
        <select id="c-proyecto" name="proyecto" className={inputCls}>
          <option value="">Consulta general</option>
          {proyectos.map((p) => <option key={p.slug} value={p.nombre}>{p.nombre}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="c-mensaje" className="block text-sm font-semibold mb-1">Mensaje <span className="text-sand">*</span></label>
        <textarea id="c-mensaje" name="mensaje" rows={4} required placeholder="Contanos qué te gustaría saber…" className={inputCls} />
      </div>
      <label className="flex items-start gap-2 text-sm text-navy/80">
        <input name="consentimiento" type="checkbox" required className="mt-1" />
        <span>Acepto que un asesor me contacte y que mis datos se traten según el <Link href="/privacidad" className="underline text-navy hover:text-sand">Aviso de Privacidad</Link>.</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
        <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white"><path d="M16.04 4C9.4 4 4 9.36 4 15.96c0 2.5.74 4.83 2.02 6.79L4 28l5.43-1.97a12.1 12.1 0 0 0 6.61 1.93h.01c6.64 0 12.04-5.36 12.04-11.96C28.09 9.36 22.69 4 16.04 4Z" /></svg>
        Enviar por WhatsApp
      </button>
      <p className="text-xs text-navy/50 text-center">¿Preferís llamar? <a href={telUrl} className="underline hover:text-sand">{sitio.contacto.telefono}</a></p>
    </form>
  );
}
