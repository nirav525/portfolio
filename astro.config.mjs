import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Nirav's own domain since 2026-10-14. Drives every page's canonical and
// og:url tags and the sitemap. portfolio-c7m.pages.dev still serves the site
// (old resume and email links keep working), but this is the real address.
export default defineConfig({
  site: 'https://niravsampat.com',
  integrations: [mdx(), react(), sitemap()],
  markdown: { shikiConfig: { theme: 'github-light' } },
});
