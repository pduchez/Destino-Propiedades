import type { Metadata } from "next";
import Link from "next/link";
import { proyectos } from "@/portal/data/proyectos";
import { sitio } from "@/portal/data/sitio";
import { TarjetaProyecto } from "@/portal/components/TarjetaProyecto";
import { FavoritosFiltro } from "@/portal/components/FavoritosFiltro";

export const metadata: Metadata = {
  title: `Mis favoritos — ${sitio.marcaPlataforma}`,
  description: "Los proyectos que guardaste para revisar después. Tus favoritos se guardan en tu propio dispositivo.",
};

export default function Favoritos() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-1">Mis favoritos</h1>
      <p id="fav-intro" className="text-navy/70 mb-6" />

      <div id="fav-grilla" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((p) => <TarjetaProyecto key={p.slug} proyecto={p} />)}
      </div>

      <div id="fav-vacio" className="hidden text-center py-16">
        <svg className="mx-auto h-12 w-12 text-navy/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        <p className="mt-4 text-navy/70">Todavía no guardaste ningún proyecto.</p>
        <p className="text-navy/50 text-sm mt-1">Tocá el corazón ❤️ en cualquier proyecto para guardarlo aquí.</p>
        <Link href="/proyectos" className="mt-6 inline-block rounded-full bg-navy text-cream px-6 py-3 font-semibold hover:bg-navy-light transition-colors">Ver proyectos</Link>
      </div>

      <FavoritosFiltro />
    </section>
  );
}
