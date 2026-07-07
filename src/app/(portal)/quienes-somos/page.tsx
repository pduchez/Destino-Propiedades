import type { Metadata } from "next";
import { sitio } from "@/portal/data/sitio";

export const metadata: Metadata = {
  title: `¿Quiénes Somos? — ${sitio.marcaPlataforma}`,
  description:
    "DestinoPropiedades.com es la plataforma que conecta a la diáspora salvadoreña con proyectos confiables, en alianza con Grupo Inmobiliario Chacón.",
};

export default function QuienesSomos() {
  const d = sitio.desarrolladorActual.nombre;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-6">¿Quiénes Somos?</h1>

      <h2 className="font-display text-xl mb-2">{sitio.marcaPlataforma}</h2>
      <p className="text-navy/80 mb-6">
        DestinoPropiedades.com es la plataforma tecnológica y comercial pensada para salvadoreños en Estados Unidos que quieren invertir en un lote en su país de origen. Nuestro objetivo es simple: que comprar a distancia sea tan confiable como hacerlo en persona. Por eso mostramos información clara y verificada de cada proyecto, y te conectamos directo por WhatsApp con un asesor real, sin formularios que no llevan a ninguna parte.
      </p>

      <h2 className="font-display text-xl mb-2">{d}</h2>
      <p className="text-navy/80 mb-6">
        {d} es nuestro desarrollador aliado actual: la empresa responsable de construir y entregar los proyectos que encontrás en este sitio. DestinoPropiedades.com es la plataforma; {d} es quien desarrolla los lotes. Esta alianza está pensada para crecer — en el futuro, otros desarrolladores podrán sumar sus proyectos a la plataforma bajo el mismo estándar de confianza y transparencia.
      </p>

      <h2 className="font-display text-xl mb-2">Cómo trabajamos</h2>
      <ul className="list-disc pl-5 space-y-2 text-navy/80">
        <li>Información de cada proyecto verificada antes de publicarse.</li>
        <li>Precios y disponibilidad actualizados, sin datos inventados.</li>
        <li>Contacto directo por WhatsApp con un asesor, no con un bot.</li>
        <li>Sin pagos ni reservas en línea: toda compra se formaliza con el desarrollador, con respaldo legal salvadoreño.</li>
      </ul>
    </section>
  );
}
