// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// URL final del sitio y subcarpeta. Por defecto apuntan al dominio de
// producción servido en la raíz. Para un preview bajo subcarpeta (p. ej.
// GitHub Pages) se sobreescriben con las variables de entorno SITE y BASE,
// sin tocar el build de producción.
const site = process.env.SITE ?? 'https://destinopropiedades.com';
const base = process.env.BASE ?? '/';

// https://astro.build/config
export default defineConfig({
  // Se usa para canónicas, sitemap y las imágenes Open Graph (que deben ser
  // URLs absolutas para verse bien al compartir).
  site,
  base,

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});