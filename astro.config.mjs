// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Dirección pública del sitio. Cambiar por el dominio propio cuando esté conectado.
  site: 'https://estudiomarianasoregaroli.estudiosoregaroli.workers.dev',
  devToolbar: { enabled: false },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/marca') && !page.includes('/404') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
