import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Update `site` after your first deploy (e.g. https://nirav.pages.dev)
export default defineConfig({
  site: 'https://example.pages.dev',
  integrations: [mdx(), react(), sitemap()],
  markdown: { shikiConfig: { theme: 'github-light' } },
});
