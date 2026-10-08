import { useState } from 'react';

/**
 * Fleet OpEx per Unit (FOU) = all-in monthly service cost / active machines.
 * The inputs are illustrative. The point of the demo is the shape of the metric:
 * why total cost cannot be compared across a growing fleet, and per-unit cost can.
 */

const LABOR_RATE = 35; // $/hr, illustrative
const MILE_COST = 0.7; // $/mile, illustrative

type Inputs = { machines: number; hours: number; miles: number; other: number };

const BEFORE: Inputs = { machines: 15, hours: 200, miles: 1900, other: 500 };
const AFTER: Inputs = { machines: 28, hours: 136, miles: 1310, other: 500 };

function breakdown(i: Inputs) {
  const labor = i.hours * LABOR_RATE;
  const vehicle = i.miles * MILE_COST;
  const other = i.other * i.machines;
  const total = labor + vehicle + other;
  return {
    labor,
    vehicle,
    other,
    total,
    fou: total / i.machines,
    perUnit: { labor: labor / i.machines, vehicle: vehicle / i.machines, other: i.other },
  };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Slider(props: {
  label: string; value: number; min: number; max: number; step: number;
  fmt?: (n: number) => string; onChange: (n: number) => void;
}) {
  const { label, value, min, max, step, fmt = String, onChange } = props;
  return (
    <label className="dd-slider">
      <span className="dd-slider-top"><span>{label}</span><output>{fmt(value)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function FouModel() {
  const [v, setV] = useState<Inputs>(AFTER);
  const set = (k: keyof Inputs) => (n: number) => setV((p) => ({ ...p, [k]: n }));

  const base = breakdown(BEFORE);
  const cur = breakdown(v);
  const change = (cur.fou / base.fou - 1) * 100;
  const totalChange = (cur.total / base.total - 1) * 100;
  const fleetChange = (v.machines / BEFORE.machines - 1) * 100;
  const scale = Math.max(base.fou, cur.fou);

  const rows = [
    { name: 'Baseline', b: base.perUnit, fou: base.fou },
    { name: 'Your scenario', b: cur.perUnit, fou: cur.fou },
  ];

  return (
    <div className="fx">
      <div className="fx-presets" role="group" aria-label="Scenario presets">
        <button type="button" className={v === BEFORE ? 'on' : ''} onClick={() => setV(BEFORE)}>Hand-planned routes, 15 machines</button>
        <button type="button" className={v === AFTER ? 'on' : ''} onClick={() => setV(AFTER)}>Optimized routes, 28 machines</button>
      </div>

      <div className="dd-grid">
        <div>
          <Slider label="Active machines" value={v.machines} min={10} max={40} step={1} onChange={set('machines')} />
          <Slider label="Technician hours per month" value={v.hours} min={80} max={280} step={2} onChange={set('hours')} />
          <Slider label="Miles driven per month" value={v.miles} min={800} max={2800} step={10} fmt={(n) => n.toLocaleString()} onChange={set('miles')} />
          <Slider label="Other service cost per machine, per month" value={v.other} min={300} max={800} step={10} fmt={usd} onChange={set('other')} />
          <p className="fx-assume">
            Fixed assumptions: labor at {usd(LABOR_RATE)}/hr, vehicle cost at ${MILE_COST.toFixed(2)}/mile. Every figure here is illustrative.
          </p>
        </div>

        <div>
          <dl className="dd-stats">
            <div className="dd-stat accent">
              <dt>Fleet OpEx per Unit, per month</dt>
              <dd>{usd(cur.fou)}</dd>
              <p>{Math.abs(change) < 0.5 ? 'Same as the baseline.' : `${change < 0 ? '' : '+'}${change.toFixed(0)}% vs the 15-machine baseline of ${usd(base.fou)}.`}</p>
            </div>
            <div className="dd-stat">
              <dt>Total monthly service cost</dt>
              <dd>{usd(cur.total)}</dd>
              <p>{totalChange >= 0 ? '+' : ''}{totalChange.toFixed(0)}% total, while the fleet is {fleetChange >= 0 ? '+' : ''}{fleetChange.toFixed(0)}%.</p>
            </div>
          </dl>
        </div>
      </div>

      <div className="fx-bars" aria-label="Cost per unit by component">
        {rows.map((r) => (
          <div key={r.name} className="fx-row">
            <span className="fx-name">{r.name}</span>
            <div className="fx-track" style={{ width: `${(r.fou / scale) * 100}%` }}>
              <span className="fx-seg labor" style={{ flexGrow: r.b.labor }} title={`Labor ${usd(r.b.labor)}`} />
              <span className="fx-seg vehicle" style={{ flexGrow: r.b.vehicle }} title={`Vehicle ${usd(r.b.vehicle)}`} />
              <span className="fx-seg other" style={{ flexGrow: r.b.other }} title={`Other ${usd(r.b.other)}`} />
            </div>
            <span className="fx-val">{usd(r.fou)}</span>
          </div>
        ))}
        <ul className="fx-legend">
          <li><i className="labor" />Technician labor</li>
          <li><i className="vehicle" />Vehicle and mileage</li>
          <li><i className="other" />Everything else it takes to keep a machine serviced and stocked</li>
        </ul>
      </div>

      <p className="dd-explain">
        <strong>Why per unit.</strong> Total cost goes up when a fleet grows even if operations get
        better, so it cannot tell you whether growth is getting cheaper to run. Dividing by active
        machines can. Slide the machine count up with the 28-machine route settings: the total
        rises, but FOU falls.
      </p>
    </div>
  );
}
