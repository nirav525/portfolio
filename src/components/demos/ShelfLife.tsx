import { useMemo, useState } from 'react';

/**
 * Excess-and-obsolete exposure: which inventory will expire before it sells, and
 * how much of it can still be recovered if it is flagged early enough.
 * Lots, costs, and recovery rates are synthetic.
 */

type Lot = { sku: string; qty: number; cost: number; days: number; velocity: number };

const LOTS: Lot[] = [
  { sku: 'SKU-A1042', qty: 1800, cost: 3.1, days: 12, velocity: 40 },
  { sku: 'SKU-B2210', qty: 2400, cost: 2.4, days: 21, velocity: 70 },
  { sku: 'SKU-C0457', qty: 900, cost: 6.8, days: 26, velocity: 12 },
  { sku: 'SKU-D3319', qty: 3200, cost: 1.9, days: 34, velocity: 90 },
  { sku: 'SKU-E1180', qty: 700, cost: 8.2, days: 41, velocity: 8 },
  { sku: 'SKU-F0921', qty: 1500, cost: 4.4, days: 47, velocity: 55 },
  { sku: 'SKU-G2754', qty: 2100, cost: 2.9, days: 58, velocity: 30 },
  { sku: 'SKU-H0033', qty: 600, cost: 11.5, days: 75, velocity: 20 },
  { sku: 'SKU-J1608', qty: 2800, cost: 1.6, days: 90, velocity: 120 },
  { sku: 'SKU-K4412', qty: 1100, cost: 5.2, days: 110, velocity: 25 },
];

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function ShelfLife() {
  const [trigger, setTrigger] = useState(45); // days before expiry to act
  const [recovery, setRecovery] = useState(55); // % of cost recovered when offloaded early

  const rows = useMemo(
    () =>
      LOTS.map((l) => {
        const value = l.qty * l.cost;
        const sellable = l.velocity * l.days; // units expected to sell before expiry
        const excess = Math.max(0, l.qty - sellable);
        const atRisk = excess * l.cost;
        const flagged = l.days <= trigger && excess > 0;
        return { ...l, value, excess, atRisk, flagged };
      }),
    [trigger],
  );

  const totalRisk = rows.reduce((s, r) => s + r.atRisk, 0);
  const flaggedRisk = rows.filter((r) => r.flagged).reduce((s, r) => s + r.atRisk, 0);
  const recovered = flaggedRisk * (recovery / 100);
  const written = totalRisk - recovered;
  const maxDays = 120;

  return (
    <div className="sl">
      <div className="dd-grid">
        <div>
          <label className="dd-slider">
            <span className="dd-slider-top"><span>Act when a lot is within</span><output>{trigger} days of expiry</output></span>
            <input type="range" min={7} max={90} step={1} value={trigger} onChange={(e) => setTrigger(Number(e.target.value))} />
          </label>
          <label className="dd-slider">
            <span className="dd-slider-top"><span>Share of cost recovered when offloaded early</span><output>{recovery}%</output></span>
            <input type="range" min={20} max={80} step={5} value={recovery} onChange={(e) => setRecovery(Number(e.target.value))} />
          </label>
          <p className="fx-assume">
            Excess = units on hand beyond what current velocity will sell before expiry. Recovery rate is illustrative.
          </p>
        </div>
        <dl className="dd-stats" style={{ marginTop: 0 }}>
          <div className="dd-stat">
            <dt>Inventory that will expire unsold</dt>
            <dd>{usd(totalRisk)}</dd>
          </div>
          <div className="dd-stat accent">
            <dt>Recovered by acting at the trigger</dt>
            <dd>{usd(recovered)}</dd>
            <p>{usd(written)} still written off.</p>
          </div>
        </dl>
      </div>

      <table className="op-table sl-table">
        <thead>
          <tr>
            <th scope="col">Lot</th>
            <th scope="col">On hand</th>
            <th scope="col">Days to expiry</th>
            <th scope="col">Excess units</th>
            <th scope="col">At risk</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku} className={r.flagged ? 'sl-flag' : ''}>
              <td className="mono">{r.sku}</td>
              <td>{r.qty.toLocaleString()}</td>
              <td>
                <span className="sl-days"><i style={{ width: `${(r.days / maxDays) * 100}%` }} className={r.days <= trigger ? 'hot' : ''} /></span>
                {r.days}
              </td>
              <td>{r.excess ? r.excess.toLocaleString() : '—'}</td>
              <td>{r.atRisk ? usd(r.atRisk) : '—'}</td>
              <td>{r.flagged ? 'Offload now' : r.excess ? 'Watch' : 'Sells through'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="dd-explain">
        <strong>The lever is timing.</strong> The same excess is recoverable at 45 days and worthless
        at zero. Raise the trigger and more lots get flagged while there is still time to renegotiate,
        redirect, or move them; lower it and the table shows what quietly becomes a write-off.
      </p>
    </div>
  );
}
