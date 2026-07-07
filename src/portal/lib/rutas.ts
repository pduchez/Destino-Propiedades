// Prefija rutas internas con la "base" del despliegue.
//
// En la app unificada (Next.js) el portal se sirve en la raíz del dominio
// (destinopropiedades.com), así que la base es "/" y withBase() devuelve la
// ruta tal cual. Se conserva la función para no tocar los componentes que la
// usan (venían del sitio Astro, donde la base podía ser una subcarpeta).
export function withBase(path: string): string {
  return path;
}
