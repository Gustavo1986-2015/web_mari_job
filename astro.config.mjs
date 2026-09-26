// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Reemplazar por el dominio definitivo cuando esté registrado.
  site: 'https://soregaroli.com.ar',
  devToolbar: { enabled: false },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/marca') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
