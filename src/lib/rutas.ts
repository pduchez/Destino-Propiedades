// Prefija las rutas internas con la "base" del despliegue.
//
// En producción (destinopropiedades.com) la base es "/" y esto no cambia nada.
// En un preview servido bajo una subcarpeta (p. ej. GitHub Pages en
// /destino-propiedades/), Astro expone esa subcarpeta en import.meta.env.BASE_URL
// y aquí la anteponemos a los enlaces y assets absolutos para que no se rompan.
//
// Solo afecta rutas que empiezan con "/". Enlaces externos, mailto:, tel:,
// http(s):// y anclas se devuelven sin tocar.
const base = import.meta.env.BASE_URL;

export function withBase(path: string): string {
  if (typeof path !== "string" || !path.startsWith("/")) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return b + path;
}
