"use client";

import { useState } from "react";
import Link from "next/link";
import { sitio } from "../data/sitio";
import { linkLlamar, linkWhatsapp } from "../lib/whatsapp";
import { Logo } from "./ui";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/quienes-somos", label: "¿Quiénes Somos?" },
];

const IconoCorazon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const IconoCandado = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
  </svg>
);

export function Header() {
  const [abierto, setAbierto] = useState(false);
  const mensaje = `Hola, quisiera más información sobre los proyectos de ${sitio.marcaPlataforma}.`;
  const whatsappUrl = linkWhatsapp(sitio.contacto.whatsapp, mensaje);
  const telUrl = linkLlamar(sitio.contacto.telefono);

  return (
    <header className="bg-navy text-cream sticky top-0 z-40 shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label={sitio.marcaPlataforma}>
          <Logo tono="claro" size={34} />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-sand transition-colors">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
          <Link href="/favoritos" className="flex items-center gap-1.5 hover:text-sand transition-colors" aria-label="Favoritos">
            <IconoCorazon />
            <span>Favoritos</span>
            <span data-fav-count className="hidden min-w-5 px-1.5 text-center rounded-full bg-sand text-navy text-xs font-bold leading-5">0</span>
          </Link>
          <a href={telUrl} className="hover:text-sand transition-colors">{sitio.contacto.telefono}</a>
          <Link href="/acceso-ventas" className="flex items-center gap-1.5 text-cream/80 hover:text-sand transition-colors" title="Acceso para la fuerza de ventas">
            <IconoCandado /> Acceso ventas
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-sand text-navy font-semibold px-4 py-2 rounded-full hover:bg-sand-light transition-colors">WhatsApp</a>
        </div>

        <button type="button" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)} className="md:hidden p-2 -mr-2">
          <svg className={`h-6 w-6 ${abierto ? "hidden" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          <svg className={`h-6 w-6 ${abierto ? "" : "hidden"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <nav className={`md:hidden border-t border-navy-light px-4 py-3 space-y-3 ${abierto ? "" : "hidden"}`}>
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href} className="block text-sm hover:text-sand transition-colors" onClick={() => setAbierto(false)}>{l.label}</Link>
        ))}
        <Link href="/favoritos" className="flex items-center gap-1.5 text-sm hover:text-sand transition-colors">
          <IconoCorazon /><span>Favoritos</span>
          <span data-fav-count className="hidden min-w-5 px-1.5 text-center rounded-full bg-sand text-navy text-xs font-bold leading-5">0</span>
        </Link>
        <Link href="/acceso-ventas" className="flex items-center gap-1.5 text-sm text-cream/80 hover:text-sand transition-colors"><IconoCandado /> Acceso ventas</Link>
        <div className="flex items-center gap-3 pt-2">
          <a href={telUrl} className="text-sm hover:text-sand transition-colors">{sitio.contacto.telefono}</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-sand text-navy font-semibold px-4 py-2 rounded-full text-sm hover:bg-sand-light transition-colors">WhatsApp</a>
        </div>
      </nav>
    </header>
  );
}
