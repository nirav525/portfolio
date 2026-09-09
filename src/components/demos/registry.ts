/**
 * Demo keys and their section titles. The components themselves are mounted in
 * DemoMount.astro, which needs static imports for island hydration.
 */
export const demoTitles = {
  dispatch: 'Route the fleet yourself',
  capacity: 'Size the field team',
  outreach: 'Run a list through the pipeline',
} as const;

export type DemoKey = keyof typeof demoTitles;
export const isDemoKey = (k?: string): k is DemoKey => !!k && k in demoTitles;
