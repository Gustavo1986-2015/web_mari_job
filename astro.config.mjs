// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Dirección pública del sitio. Cambiar por el dominio propio cuando esté conectado.
  site: 'https://estudiomarianasoregaroli.pages.dev',
  devToolbar: { enabled: false },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/marca') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
