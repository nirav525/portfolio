import { useMemo, useState } from 'react';

/**
 * Interactive routing demo on synthetic data.
 *
 * Production runs Google OR-Tools. OR-Tools does not run in a browser, so this
 * uses a nearest-neighbour construction with 2-opt improvement — the same class
 * of heuristic, at a scale small enough to solve instantly client-side.
 */

type Stop = { id: number; x: number; y: number; fill: number; cluster: number };

const DEPOT = { x: 50, y: 52 };
const MILES_PER_UNIT = 0.42;
const MPH = 26;

// Deterministic PRNG so the instance is identical on every render and reload.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildStops(): Stop[] {
  const rand = rng(20260401);
  const centres = [
    { x: 22, y: 26 },
    { x: 74, y: 22 },
    { x: 82, y: 66 },
    { x: 34, y: 74 },
    { x: 54, y: 44 },
  ];
  const stops: Stop[] = [];
  for (let i = 0; i < 30; i++) {
    const c = centres[i % centres.length];
    stops.push({
      id: i,
      x: Math.max(5, Math.min(95, c.x + (rand() - 0.5) * 26)),
      y: Math.max(5, Math.min(95, c.y + (rand() - 0.5) * 26)),
      fill: Math.round(rand() * 88) + 6,
      cluster: i % centres.length,
    });
  }
  return stops;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function routeLength(seq: Stop[]) {
  if (!seq.length) return 0;
  let d = dist(DEPOT, seq[0]);
  for (let i = 0; i < seq.length - 1; i++) d += dist(seq[i], seq[i + 1]);
  return d + dist(seq[seq.length - 1], DEPOT);
}

function nearestNeighbour(stops: Stop[]) {
  const pool = [...stops];
  const seq: Stop[] = [];
  let cur: { x: number; y: number } = DEPOT;
  while (pool.length) {
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      if (dist(cur, pool[i]) < dist(cur, pool[best])) best = i;
    }
    cur = pool[best];
    seq.push(pool.splice(best, 1)[0]);
  }
  return seq;
}

function twoOpt(seq: Stop[]) {
  if (seq.length < 4) return seq;
  let best = [...seq];
  let bestLen = routeLength(best);
  for (let pass = 0; pass < 24; pass++) {
    let improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const cand = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const len = routeLength(cand);
        if (len < bestLen - 1e-9) {
          best = cand;
          bestLen = len;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return best;
}

/** Angular sweep from the depot, balanced by stop count. */
function partition(stops: Stop[], k: number) {
  const sorted = [...stops].sort(
    (a, b) =>
      Math.atan2(a.y - DEPOT.y, a.x - DEPOT.x) -
      Math.atan2(b.y - DEPOT.y, b.x - DEPOT.x),
  );
  const groups: Stop[][] = Array.from({ length: k }, () => []);
  const per = Math.ceil(sorted.length / k);
  sorted.forEach((s, i) => groups[Math.min(k - 1, Math.floor(i / per))].push(s));
  return groups;
}

const PALETTE = ['#14675a', '#9a6b12', '#2f5d8c', '#8a3f5e'];

export default function DispatchDemo() {
  const [techs, setTechs] = useState(3);
  const [threshold, setThreshold] = useState(50);
  const [serviceMin, setServiceMin] = useState(18);
  const [shiftHours, setShiftHours] = useState(8);
  const [cluster, setCluster] = useState(true);

  const stops = useMemo(buildStops, []);

  const result = useMemo(() => {
    const triggered = stops.filter((s) => s.fill <= threshold);

    // Clustering: opportunistically pull in nearby stops that did not trip the
    // threshold. Servicing them now is cheaper than a dedicated return trip.
    let selected = triggered;
    if (cluster) {
      const extra = stops.filter(
        (s) =>
          s.fill > threshold &&
          s.fill <= threshold + 22 &&
          triggered.some((t) => dist(t, s) < 13),
      );
      selected = [...triggered, ...extra];
    }

    const groups = partition(selected, techs).map((g) => twoOpt(nearestNeighbour(g)));

    const routes = groups.map((seq, i) => {
      const units = routeLength(seq);
      const miles = units * MILES_PER_UNIT;
      const hours = miles / MPH + (seq.length * serviceMin) / 60;
      return { seq, miles, hours, colour: PALETTE[i % PALETTE.length] };
    });

    // Baseline: the same stops and the same technician split, but sequenced in
    // the order they appear on the machine list rather than optimised.
    const baselineMiles = partition(selected, techs)
      .map((g) => routeLength([...g].sort((a, b) => a.id - b.id)) * MILES_PER_UNIT)
      .reduce((a, b) => a + b, 0);

    const miles = routes.reduce((a, r) => a + r.miles, 0);
    const overrun = routes.filter((r) => r.hours > shiftHours).length;

    return {
      routes,
      miles,
      baselineMiles,
      served: selected.length,
      triggered: triggered.length,
      opportunistic: selected.length - triggered.length,
      overrun,
      perStop: selected.length ? miles / selected.length : 0,
      saved: baselineMiles > 0 ? (1 - miles / baselineMiles) * 100 : 0,
    };
  }, [stops, techs, threshold, serviceMin, shiftHours, cluster]);

  const selectedIds = new Set(result.routes.flatMap((r) => r.seq.map((s) => s.id)));

  return (
    <div className="dd">
      <div className="dd-grid">
        <div className="dd-map">
          <svg viewBox="0 0 100 100" role="img" aria-label="Synthetic service map with optimised technician routes">
            <defs>
              <pattern id="dd-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M10 0H0V10" fill="none" stroke="#e6e9e4" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dd-grid)" />

            {result.routes.map((r, i) =>
              r.seq.length ? (
                <polyline
                  key={i}
                  points={[DEPOT, ...r.seq, DEPOT].map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={r.colour}
                  strokeWidth="0.65"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              ) : null,
            )}

            {stops.map((s) => {
              const on = selectedIds.has(s.id);
              const opportunistic = on && s.fill > threshold;
              return (
                <circle
                  key={s.id}
                  cx={s.x}
                  cy={s.y}
                  r={on ? 1.5 : 1.05}
                  fill={on ? (opportunistic ? '#9a6b12' : '#14202a') : '#fafaf8'}
                  stroke={on ? 'none' : '#c3c9c2'}
                  strokeWidth="0.4"
                />
              );
            })}

            <rect x={DEPOT.x - 1.9} y={DEPOT.y - 1.9} width="3.8" height="3.8" fill="#14202a" />
          </svg>

          <ul className="dd-legend">
            <li><i className="k-depot" />Depot</li>
            <li><i className="k-stop" />Below threshold</li>
            <li><i className="k-opp" />Added by clustering</li>
            <li><i className="k-skip" />Not serviced</li>
          </ul>
        </div>

        <div className="dd-panel">
          <Slider label="Technicians on shift" value={techs} min={1} max={4} onChange={setTechs} />
          <Slider label="Restock threshold" value={threshold} min={25} max={75} step={5} suffix="% full" onChange={setThreshold} />
          <Slider label="Service time per stop" value={serviceMin} min={8} max={35} suffix=" min" onChange={setServiceMin} />
          <Slider label="Shift length" value={shiftHours} min={6} max={10} suffix=" hrs" onChange={setShiftHours} />

          <label className="dd-toggle">
            <input type="checkbox" checked={cluster} onChange={(e) => setCluster(e.target.checked)} />
            <span>
              Cluster opportunistically
              <em>Service nearby machines above threshold rather than returning later.</em>
            </span>
          </label>

          <dl className="dd-stats">
            <Stat label="Stops serviced" value={String(result.served)} sub={result.opportunistic > 0 ? `${result.triggered} triggered + ${result.opportunistic} clustered` : `${result.triggered} triggered`} />
            <Stat label="Total distance" value={`${result.miles.toFixed(1)} mi`} sub={`Unoptimised sequence: ${result.baselineMiles.toFixed(1)} mi`} />
            <Stat label="Miles per stop" value={result.perStop.toFixed(1)} sub="Turn clustering off and watch this rise" accent />
            <Stat label="Against unoptimised" value={`${result.saved > 0 ? '−' : '+'}${Math.abs(result.saved).toFixed(0)}%`} sub="Same stops and split, sequenced by list order" />
          </dl>

          <ul className="dd-routes">
            {result.routes.map((r, i) => (
              <li key={i} className={r.hours > shiftHours ? 'over' : ''}>
                <i style={{ background: r.colour }} />
                <span>Technician {i + 1}</span>
                <span className="rn">{r.seq.length} stops</span>
                <span className="rn">{r.miles.toFixed(1)} mi</span>
                <span className="rn">{r.hours.toFixed(1)} h</span>
              </li>
            ))}
          </ul>

          {result.overrun > 0 && (
            <p className="dd-warn">
              {result.overrun === 1 ? '1 route exceeds' : `${result.overrun} routes exceed`} the {shiftHours}-hour shift. Add a technician, raise the threshold, or shorten service time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, suffix = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="dd-slider">
      <span className="dd-slider-top">
        <span>{label}</span>
        <output>{value}{suffix}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`dd-stat${accent ? ' accent' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub && <p>{sub}</p>}
    </div>
  );
}
