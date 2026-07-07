import type { Metadata } from "next";
import { sitio } from "@/portal/data/sitio";
import { FormContacto } from "@/portal/components/FormContacto";

export const metadata: Metadata = {
  title: `Contacto — ${sitio.marcaPlataforma}`,
  description: "Escribinos y un asesor real te responde por WhatsApp con disponibilidad, fotos y formas de pago de los proyectos.",
};

export default function Contacto() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Contacto</h1>
      <p className="text-navy/70 mb-8">Completá el formulario y te abriremos WhatsApp con tu mensaje listo para enviar. Te responde un asesor real, no un bot.</p>
      <FormContacto />
    </section>
  );
}
