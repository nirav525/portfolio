import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const CATEGORIES = [
  'Optimization',
  'AI / Automation',
  'Strategy & Operations',
  'Product Operations',
  'Supply Chain / Operations',
  'Data / Analytics',
  'Internal Tools',
  'GTM / Growth',
  'Side Projects',
] as const;

const ROLES = [
  'AI',
  'Strategy & Ops',
  'BizOps',
  'Product Ops',
  'GTM / Growth',
  'Supply Chain / Ops',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    // Identity
    title: z.string(),
    summary: z.string(),
    category: z.enum(CATEGORIES),
    // Optional colour override. Falls back to the category colour.
    accent: z.string().optional(),
    org: z.string(),
    period: z.string(),
    role: z.string(),

    // Ordering + surfacing
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    order: z.number(),
    draft: z.boolean().default(false),

    // Disclosure. 'B' and 'C' render the synthetic-data notice.
    disclosure: z.enum(['A', 'B', 'C']),
    disclosureNote: z.string().optional(),

    // Headline metric shown in the catalog index
    headline: z.object({
      value: z.string(),
      label: z.string(),
    }),

    // Metrics table on the detail page
    metrics: z
      .array(
        z.object({
          label: z.string(),
          before: z.string().optional(),
          after: z.string().optional(),
          value: z.string().optional(),
          delta: z.string().optional(),
          emphasis: z.boolean().default(false),
        }),
      )
      .default([]),

    stack: z.array(z.string()).default([]),

    // Three or four short lines. This is what most visitors will actually read.
    tldr: z.array(z.string()).default([]),

    // Closing reflection. Kept in frontmatter so every page ends the same way.
    learned: z.string(),
    next: z.string(),

    // Architecture flow, rendered as a stepped diagram
    architecture: z.array(z.string()).default([]),

    // Interactive demo. Must match a key in src/components/demos/registry.ts
    demo: z.string().optional(),
    demoNote: z.string().optional(),

    // Resume source material. Surfaced on /resume, not on the project page.
    bullets: z
      .object({
        headline: z.string().optional(),
        quantified: z.string().optional(),
        technical: z.string().optional(),
        strategy: z.string().optional(),
        ownership: z.string().optional(),
      })
      .default({}),

    // 3 = lead with this, 2 = strong, 1 = supporting, 0 = omit
    roleFit: z.record(z.enum(ROLES), z.number().min(0).max(3)).default({}),

    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),

    // Anything unresolved. Rendered only in dev, never in production.
    todo: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
export { CATEGORIES, ROLES };
