// Componentes de presentación del portal (server components).
import Link from "next/link";
import { sitio } from "../data/sitio";
import { linkWhatsapp } from "../lib/whatsapp";
import { withBase } from "../lib/rutas";

/* ── Logo (sol + costa) ─────────────────────────────────────────────────── */
export function Logo({
  tono = "claro",
  size = 34,
  className = "",
}: {
  tono?: "claro" | "oscuro";
  size?: number;
  className?: string;
}) {
  const marca = sitio.marcaPlataforma.replace(/\.com$/i, "");
  const tld = /\.com$/i.test(sitio.marcaPlataforma) ? ".com" : "";
  const corte = marca.toLowerCase().indexOf("propiedades");
  const parte1 = corte > 0 ? marca.slice(0, corte) : marca;
  const parte2 = corte > 0 ? marca.slice(corte) : "";
  const colorTexto = tono === "claro" ? "text-cream" : "text-navy";
  const fontPx = Math.round(size * 0.62);
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="24" cy="24" r="23" className={tono === "claro" ? "fill-cream/[.08]" : "fill-navy/5"} />
        <circle cx="24" cy="20" r="6.5" fill="none" stroke="#c9a463" strokeWidth="2.6" />
        <line x1="24" y1="6.5" x2="24" y2="10" stroke="#c9a463" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M9 31 Q 16.5 26, 24 31 T 39 31" fill="none" stroke={tono === "claro" ? "#faf7f2" : "#0f2438"} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M11 37 Q 17.5 33, 24 37 T 37 37" fill="none" stroke="#c9a463" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className={`font-display font-bold tracking-tight leading-none ${colorTexto}`} style={{ fontSize: `${fontPx}px` }}>
        {parte1}
        <span className="text-sand">{parte2}</span>
        <span className="text-sand/70 font-semibold">{tld}</span>
      </span>
    </span>
  );
}

/* ── Migas de pan ───────────────────────────────────────────────────────── */
export type Miga = { label: string; href?: string };
export function MigasDePan({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Migas de pan" className="text-sm text-navy/60">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.href ? (
              <Link href={withBase(item.href)} className="hover:text-sand transition-colors">{item.label}</Link>
            ) : (
              <span className="text-navy/90" aria-current="page">{item.label}</span>
            )}
            {i < items.length - 1 && <span className="text-navy/30">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── JSON-LD (datos estructurados) ──────────────────────────────────────── */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ── Marcador "Fotos en camino" ─────────────────────────────────────────── */
export function PlaceholderFoto({ nombre, detalle = false }: { nombre: string; detalle?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy to-navy-light px-4 text-center" role="img" aria-label={`${nombre}: fotografías próximamente`}>
      <svg className="h-8 w-8 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l4.5-4.5 3 3 4.5-4.5L21 15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25h18v13.5H3z" />
        <circle cx="8" cy="9" r="1.25" fill="currentColor" stroke="none" />
      </svg>
      <span className="font-display text-sm text-cream sm:text-base">Fotos en camino</span>
      {detalle && (
        <span className="max-w-xs text-xs text-cream/60">
          Estamos preparando las fotografías de este proyecto. Mientras tanto, escribinos por WhatsApp y te las compartimos.
        </span>
      )}
    </div>
  );
}

/* ── Botón flotante de WhatsApp ─────────────────────────────────────────── */
export function BotonWhatsappFlotante() {
  const mensaje = `Hola, quisiera más información sobre los proyectos de ${sitio.marcaPlataforma}.`;
  const url = linkWhatsapp(sitio.contacto.whatsapp, mensaje);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" data-evento="click_whatsapp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105">
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white">
        <path d="M16.04 4C9.4 4 4 9.36 4 15.96c0 2.5.74 4.83 2.02 6.79L4 28l5.43-1.97a12.1 12.1 0 0 0 6.61 1.93h.01c6.64 0 12.04-5.36 12.04-11.96C28.09 9.36 22.69 4 16.04 4Zm0 21.78h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.76 1.37 1.4-3.65-.24-.38a9.78 9.78 0 0 1-1.52-5.26C6.5 10.62 10.78 6.4 16.04 6.4c2.62 0 5.08 1.02 6.93 2.86a9.69 9.69 0 0 1 2.88 6.9c0 5.36-4.39 9.62-9.81 9.62Z" />
      </svg>
    </a>
  );
}
