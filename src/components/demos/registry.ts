/**
 * Demo keys and their section titles. The components themselves are mounted in
 * DemoMount.astro, which needs static imports for island hydration.
 */
export const demoTitles = {
  dispatch: 'Route the fleet yourself',
  outreach: 'Run a list through the pipeline',
  platform: 'Explore the platform',
  sheet: 'Open the actual model',
  mealplanner: 'Plan a week, get the list',
  liftlog: 'Log a set, watch the trend',
  marketscore: 'See the holdings, then the brief',
} as const;

export const demoCues: Record<keyof typeof demoTitles, string> = {
  dispatch: 'Adjust the controls below. The map, the numbers, and the explanation all update live.',
  outreach: 'Toggle the checks below and watch which rows survive to a send.',
  platform: 'Click through the sidebar — each module is a real screen from the platform, populated with synthetic data.',
  sheet: 'Click the sheet tabs along the bottom — each one is a real tab from the actual model.',
  mealplanner: 'Pick a few dishes, then tap a combined ingredient to see which dishes it came from.',
  liftlog: 'Pick a day and an exercise, log a set, and watch the chart and suggestion update.',
  marketscore: 'Click a column to sort the holdings — then switch to Brief to see the emailed output.',
};

export type DemoKey = keyof typeof demoTitles;

// A demo value may carry a variant after a colon, e.g. "platform:menus" opens
// the platform mockup straight to the Preset Menus module. baseDemoKey()
// strips that suffix so registry lookups (title, cue) key off the base demo.
export const baseDemoKey = (k?: string): string | undefined => k?.split(':')[0];
export const isDemoKey = (k?: string): k is DemoKey => {
  const base = baseDemoKey(k);
  return !!base && base in demoTitles;
};
