import type { Metadata } from "next";
import { sitio } from "@/portal/data/sitio";

export const metadata: Metadata = {
  title: `Términos y Condiciones — ${sitio.marcaPlataforma}`,
  description: "Condiciones de uso del sitio DestinoPropiedades.com y aclaraciones sobre la información de los proyectos publicados.",
};

const actualizado = "junio de 2026"; // PENDIENTE: actualizar al publicar

export default function Terminos() {
  const d = sitio.desarrolladorActual.nombre;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Términos y Condiciones</h1>
      <p className="text-sm text-navy/50 mb-8">Última actualización: {actualizado}</p>
      <div className="rounded-lg border border-sand/40 bg-sand/10 p-4 text-sm text-navy/70 mb-8">
        Este documento es un <strong>borrador</strong> y será revisado por un profesional legal antes de su publicación definitiva.
      </div>

      <h2 className="font-display text-xl mt-8 mb-2">1. Sobre este sitio</h2>
      <p className="text-navy/80 mb-4">{sitio.marcaPlataforma} es una plataforma informativa que presenta proyectos de lotificación en El Salvador, en alianza con {d}. El sitio sirve para conocer los proyectos y ponerte en contacto con un asesor; no es una tienda en línea.</p>

      <h2 className="font-display text-xl mt-8 mb-2">2. La información es referencial</h2>
      <p className="text-navy/80 mb-4">Los precios, áreas, disponibilidad de lotes, imágenes y características de cada proyecto se publican de buena fe y pueden cambiar sin previo aviso. Antes de cualquier compra, los datos definitivos se confirman directamente con {d}. Las imágenes y planos pueden ser ilustrativos.</p>

      <h2 className="font-display text-xl mt-8 mb-2">3. No hay pagos ni reservas en línea</h2>
      <p className="text-navy/80 mb-4">Este sitio no procesa pagos ni reservas. Toda compra o reserva se formaliza directamente con el desarrollador, mediante los documentos y el respaldo legal correspondientes en {sitio.jurisdiccionLegal}.</p>

      <h2 className="font-display text-xl mt-8 mb-2">4. Contacto por WhatsApp y teléfono</h2>
      <p className="text-navy/80 mb-4">Al contactarnos por WhatsApp, teléfono o correo, aceptás que un asesor te responda para darte información y seguimiento sobre el proyecto de tu interés. Podés dejar de recibir esa comunicación cuando lo pidás.</p>

      <h2 className="font-display text-xl mt-8 mb-2">5. Propiedad intelectual</h2>
      <p className="text-navy/80 mb-4">La marca, los textos y el diseño de {sitio.marcaPlataforma} pertenecen a sus titulares. Las imágenes de los proyectos pertenecen a {d} o a quien corresponda. No está permitido reproducirlos sin autorización.</p>

      <h2 className="font-display text-xl mt-8 mb-2">6. Legislación aplicable</h2>
      <p className="text-navy/80 mb-4">Estos términos se rigen por la legislación de {sitio.jurisdiccionLegal}.</p>
    </section>
  );
}
