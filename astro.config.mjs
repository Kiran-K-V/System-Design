import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kiran-system-design.vercel.app',
  integrations: [react(), expressiveCode(), mdx()],
  vite: { plugins: [tailwindcss()] },
});
