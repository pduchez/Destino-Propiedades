import type { Metadata } from "next";
import { sitio } from "@/portal/data/sitio";

export const metadata: Metadata = {
  title: `Aviso de Privacidad — ${sitio.marcaPlataforma}`,
  description: "Cómo DestinoPropiedades.com trata los datos personales que compartís al contactarnos, conforme a la legislación de El Salvador.",
};

const actualizado = "junio de 2026"; // PENDIENTE: actualizar al publicar

export default function Privacidad() {
  const d = sitio.desarrolladorActual.nombre;
  const correo = <a href={`mailto:${sitio.contacto.correo}`} className="text-navy underline hover:text-sand">{sitio.contacto.correo}</a>;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Aviso de Privacidad</h1>
      <p className="text-sm text-navy/50 mb-8">Última actualización: {actualizado}</p>
      <div className="rounded-lg border border-sand/40 bg-sand/10 p-4 text-sm text-navy/70 mb-8">
        Este documento es un <strong>borrador</strong> y será revisado por un profesional legal antes de su publicación definitiva.
      </div>

      <h2 className="font-display text-xl mt-8 mb-2">1. Quiénes somos</h2>
      <p className="text-navy/80 mb-4">{sitio.marcaPlataforma} es una plataforma que presenta proyectos de lotificación en El Salvador, en alianza con {d}. Para cualquier consulta sobre tus datos podés escribirnos a {correo}.</p>

      <h2 className="font-display text-xl mt-8 mb-2">2. Qué datos recopilamos</h2>
      <p className="text-navy/80 mb-4">Solo recopilamos los datos que vos nos compartís voluntariamente cuando nos contactás (por ejemplo, tu nombre, número de teléfono o WhatsApp y el mensaje con tu consulta). El sitio no exige registro ni crea cuentas de usuario.</p>

      <h2 className="font-display text-xl mt-8 mb-2">3. Para qué los usamos</h2>
      <ul className="list-disc pl-5 space-y-1 text-navy/80 mb-4">
        <li>Responder tu consulta y darte información de los proyectos.</li>
        <li>Dar seguimiento a tu interés de compra a través de un asesor.</li>
        <li>Mejorar nuestra atención y la información que publicamos.</li>
      </ul>
      <p className="text-navy/80 mb-4">No vendemos ni alquilamos tus datos personales a terceros.</p>

      <h2 className="font-display text-xl mt-8 mb-2">4. Con quién los compartimos</h2>
      <p className="text-navy/80 mb-4">Para atender tu solicitud, tus datos de contacto pueden compartirse con {d}, el desarrollador responsable del proyecto que te interesa, con el único fin de darte seguimiento comercial.</p>

      <h2 className="font-display text-xl mt-8 mb-2">5. Favoritos y almacenamiento local</h2>
      <p className="text-navy/80 mb-4">La función de favoritos (❤️) guarda tu selección únicamente en tu propio navegador (almacenamiento local del dispositivo). Esa información no se envía a ningún servidor ni la podemos ver nosotros.</p>

      <h2 className="font-display text-xl mt-8 mb-2">6. Tus derechos</h2>
      <p className="text-navy/80 mb-4">Podés solicitarnos en cualquier momento acceder, corregir o eliminar los datos que nos hayás proporcionado, escribiéndonos a {correo}.</p>

      <h2 className="font-display text-xl mt-8 mb-2">7. Legislación aplicable</h2>
      <p className="text-navy/80 mb-4">Este aviso se rige por la legislación de {sitio.jurisdiccionLegal}.</p>
    </section>
  );
}
