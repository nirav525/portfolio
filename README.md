# Proof-of-work catalog

Static site. Astro + React islands. No backend, no database, $0 to host.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Deploy to Cloudflare Pages (free)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command `npm run build`, output directory `dist`. Leave everything else default.
4. Deploy. You get `your-project.pages.dev` with automatic HTTPS.
5. Set `site` in `astro.config.mjs` to that URL and push again, so canonical
   URLs and the sitemap are correct.

Every push to `main` redeploys. GitHub Pages works too, but handles redirects
and headers less well.

## Adding a project

Copy any file in `src/content/projects/` and edit it. The filename becomes the
URL: `dispatch-optimization.mdx` → `/projects/dispatch-optimization`.

Frontmatter holds the structured data. The body holds three sections in this
order: the problem, why it mattered, what I built. Everything after that — the
architecture flow, the demo, the metrics table, what I learned, what I would do
next — is assembled by the page template from frontmatter, so the section order
is identical on every project.

The schema in `src/content.config.ts` is enforced at build time. A missing
required field fails the build rather than shipping a half-empty page.

Two fields worth knowing:

- `todo: []` — anything unresolved. Renders in `npm run dev` only, never in a
  production build. Use it instead of publishing a placeholder.
- `draft: true` — keeps a project out of the catalog and off the sitemap while
  you work on it.

## Adding a demo

1. Drop a React component in `src/components/demos/`.
2. Import it in `DemoMount.astro` and add a `case`.
3. Add its title to `demoTitles` in `registry.ts`.
4. Reference the key from a project's `demo:` field.

Demos hydrate with `client:visible`, so they cost nothing until scrolled into
view, and pages without a demo ship no JavaScript at all.

## Rules this repo follows

- No confidential information. No vendor, counterparty, customer, or colleague
  names. No contract terms, internal URLs, credentials, or non-public financials.
- Every demo runs on synthetic data and says so on the page.
- No invented metrics. If a number is not known, it goes in `todo`, not the page.

## Structure

```
src/
  content/projects/     one .mdx per project — all the content lives here
  content.config.ts     schema, validated at build
  components/
    CatalogIndex.astro  homepage list + category filter
    sections/           metric table, architecture flow, demo frame
    demos/              React islands
  layouts/Base.astro    shell, SEO meta
  pages/
    index.astro         catalog
    projects/[...id]    project detail
    resume.astro        bullets by target role
  styles/               tokens + demo styles
```
