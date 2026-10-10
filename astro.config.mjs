import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kiran-system-design.vercel.app',
  integrations: [react(), mdx()],
  vite: { plugins: [tailwindcss()] },
});
