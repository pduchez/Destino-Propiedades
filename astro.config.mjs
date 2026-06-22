// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // URL final del sitio. Se usa para canónicas, sitemap y las imágenes
  // Open Graph (que deben ser URLs absolutas para verse bien al compartir).
  site: 'https://destinopropiedades.com',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});