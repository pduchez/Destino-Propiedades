import Link from "next/link";
import { sitio } from "../data/sitio";
import { zonas } from "../data/zonas";
import { proyectos } from "../data/proyectos";
import { labelLotesDe } from "../lib/formato";
import { linkLlamar, linkWhatsapp } from "../lib/whatsapp";
import { Logo } from "./ui";

export function Footer() {
  const mensaje = `Hola, quisiera más información sobre los proyectos de ${sitio.marcaPlataforma}.`;
  const whatsappUrl = linkWhatsapp(sitio.contacto.whatsapp, mensaje);
  const telUrl = linkLlamar(sitio.contacto.telefono);

  const tiposPresentes = Array.from(new Set(proyectos.map((p) => p.tipo)));
  const enlacesExplorar = [
    { href: "/", label: "Inicio" },
    { href: "/proyectos", label: "Todos los proyectos" },
    ...tiposPresentes.map((t) => ({ href: `/proyectos?tipo=${t}`, label: labelLotesDe[t] })),
    { href: "/quienes-somos", label: "¿Quiénes Somos?" },
    { href: "/contacto", label: "Contacto" },
  ];
  const enlacesZonas = zonas.map((z) => ({ href: `/${z.slug}`, label: z.nombre }));
  const enlacesProyectos = proyectos.map((p) => ({ href: `/proyectos/${p.slug}`, label: p.nombre }));
  const redes = [
    { nombre: "Facebook", url: sitio.redes.facebook },
    { nombre: "Instagram", url: sitio.redes.instagram },
    { nombre: "TikTok", url: sitio.redes.tiktok },
  ].filter((r) => r.url);

  const Col = ({ titulo, enlaces }: { titulo: string; enlaces: { href: string; label: string }[] }) => (
    <div>
      <p className="font-semibold mb-2 text-sm uppercase tracking-wide text-sand">{titulo}</p>
      <ul className="space-y-1 text-sm">
        {enlaces.map((e) => (
          <li key={e.href + e.label}><Link href={e.href} className="hover:text-sand transition-colors">{e.label}</Link></li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-navy text-cream mt-16">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tono="claro" size={32} className="mb-3" />
          <p className="text-sm text-cream/70 mb-4">En alianza con {sitio.desarrolladorActual.nombre}.</p>
          <ul className="space-y-1 text-sm">
            <li><a href={telUrl} className="hover:text-sand transition-colors">{sitio.contacto.telefono}</a></li>
            <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sand transition-colors">WhatsApp</a></li>
            <li><a href={`mailto:${sitio.contacto.correo}`} className="hover:text-sand transition-colors">{sitio.contacto.correo}</a></li>
          </ul>
          {redes.length > 0 && (
            <div className="flex gap-3 mt-3">
              {redes.map((r) => (
                <a key={r.nombre} href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-sand transition-colors">{r.nombre}</a>
              ))}
            </div>
          )}
        </div>
        <Col titulo="Explorar" enlaces={enlacesExplorar} />
        <Col titulo="Zonas" enlaces={enlacesZonas} />
        <Col titulo="Proyectos" enlaces={enlacesProyectos} />
      </div>
      <div className="border-t border-navy-light px-4 py-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/60">
          <p>© {new Date().getFullYear()} {sitio.marcaPlataforma}. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-sand transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-sand transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
