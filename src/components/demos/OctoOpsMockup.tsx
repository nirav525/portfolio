import { useState } from 'react';

/**
 * A faithful recreation of the real operating platform's UI — same "Crave
 * Select" design tokens, same sidebar structure, same page set. Every value
 * shown (machine IDs, site codes, revenue, names) is synthetic; the visual
 * system (colors, type, layout) is real.
 */

type PageKey =
  | 'dashboard' | 'machines' | 'dispatch' | 'tracking'
  | 'inv-overview' | 'inv-transfer' | 'inv-expiring' | 'inv-waste' | 'inv-recalls' | 'menus'
  | 'demand-overview' | 'demand-plan' | 'demand-settings';

const NAV: { section?: string; items: { key: PageKey; label: string }[] }[] = [
  { items: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'machines', label: 'Machines' },
    { key: 'dispatch', label: 'Dispatch & Restocking' },
    { key: 'tracking', label: 'Field Tracking' },
  ] },
  { section: 'Inventory', items: [
    { key: 'inv-overview', label: 'Overview' },
    { key: 'inv-transfer', label: 'Transfer & Receive' },
    { key: 'inv-expiring', label: 'Expiring Items' },
    { key: 'inv-waste', label: 'Waste Report' },
    { key: 'inv-recalls', label: 'Food Recalls' },
    { key: 'menus', label: 'Preset Menus' },
  ] },
  { section: 'Demand Planning', items: [
    { key: 'demand-overview', label: 'Overview' },
    { key: 'demand-plan', label: '12-Month Plan' },
    { key: 'demand-settings', label: 'Settings' },
  ] },
];

const PAGE_TITLES: Record<PageKey, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'Fleet status', title: 'Dashboard' },
  machines: { eyebrow: '25 units', title: 'Machines' },
  dispatch: { eyebrow: "Today's routes", title: 'Dispatch & Restocking' },
  tracking: { eyebrow: 'Live positions', title: 'Field Tracking' },
  'inv-overview': { eyebrow: 'Inventory', title: 'Overview' },
  'inv-transfer': { eyebrow: 'Inventory', title: 'Transfer & Receive' },
  'inv-expiring': { eyebrow: 'Inventory', title: 'Expiring Items' },
  'inv-waste': { eyebrow: 'Inventory', title: 'Waste Report' },
  'inv-recalls': { eyebrow: 'Inventory', title: 'Food Recalls' },
  menus: { eyebrow: 'Inventory', title: 'Preset Menus' },
  'demand-overview': { eyebrow: 'Demand planning', title: 'Overview' },
  'demand-plan': { eyebrow: 'Demand planning', title: '12-Month Plan' },
  'demand-settings': { eyebrow: 'Demand planning', title: 'Settings' },
};

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  ok: { label: 'Online', dot: 'var(--co-success)', text: 'var(--co-success)' },
  'temp-alert': { label: 'Temp Alert', dot: 'var(--co-warning)', text: 'var(--co-warning-text)' },
  'plc-alert': { label: 'PLC Alert', dot: 'var(--co-warning)', text: 'var(--co-warning-text)' },
  locked: { label: 'Locked', dot: 'var(--co-warning)', text: 'var(--co-warning-text)' },
  offline: { label: 'Offline', dot: 'var(--co-destructive)', text: 'var(--co-destructive)' },
};

const MACHINES = [
  { muid: 'CR-041-25-06-00031', site: 'CSULA — Student Union', code: 'LANG-CA-CSLA-0905', region: 'East SG Valley', status: 'ok', fill: 88, rev: 730 },
  { muid: 'CR-014-25-03-00007', site: 'Carson — Innovation Hub', code: 'CRSN-CA-CSDH-1504', region: 'LA-West', status: 'ok', fill: 74, rev: 612 },
  { muid: 'CR-021-25-01-00012', site: 'Long Beach — Transit Center', code: 'LNGB-CA-CSLB-0301', region: 'LA-West', status: 'ok', fill: 61, rev: 480 },
  { muid: 'CR-017-25-02-00025', site: 'Norwalk — Metro Station', code: 'NRWK-CA-CNRK-0410', region: 'LA-East', status: 'plc-alert', fill: 45, rev: 210 },
  { muid: 'CR-033-25-05-00019', site: 'Santa Ana — County Annex', code: 'SNTA-CA-CSAN-0722', region: 'LA-Central', status: 'temp-alert', fill: 22, rev: 95 },
  { muid: 'CR-009-24-11-00003', site: 'Huntington Beach — Pier Plaza', code: 'HNGT-CA-CSHB-0219', region: 'LA-West', status: 'offline', fill: 8, rev: 40 },
];

function revClass(rev: number) {
  if (rev === 0) return 'co-rev-zero';
  if (rev < 100) return 'co-rev-low';
  if (rev < 500) return 'co-rev-mid';
  return 'co-rev-high';
}

const DISPATCH_ROWS = [
  { tech: 'Technician 1', stops: 7, miles: 51.8, status: 'On schedule' },
  { tech: 'Technician 2', stops: 6, miles: 44.2, status: 'On schedule' },
  { tech: 'Technician 3', stops: 5, miles: 38.6, status: '12 min behind' },
];

const RESTOCK_QUEUE = [
  { muid: 'CR-009-24-11-00003', item: 'Garlic Chicken Pasta', qty: 8 },
  { muid: 'CR-033-25-05-00019', item: 'Veggie Bowl', qty: 6 },
  { muid: 'CR-017-25-02-00025', item: 'Beef Burrito', qty: 10 },
];

const TRACKING_ROWS = [
  { tech: 'Technician 1', seen: '2 min ago', loc: 'Carson — Innovation Hub', moving: true },
  { tech: 'Technician 2', seen: '6 min ago', loc: 'Long Beach — Transit Center', moving: false },
  { tech: 'Technician 3', seen: '1 min ago', loc: 'En route, I-5 N', moving: true },
];

const LOTS = [
  { lot: 'L-22841', product: 'Garlic Chicken Pasta', qty: 240, exp: '2026-10-02', loc: 'HQ Freezer', warn: false },
  { lot: 'L-22855', product: 'Beef Burrito', qty: 96, exp: '2026-09-14', loc: 'HQ Freezer', warn: true },
  { lot: 'L-22809', product: 'Veggie Bowl', qty: 150, exp: '2026-11-20', loc: 'HQ Freezer', warn: false },
  { lot: 'L-22861', product: 'Garlic Noodles', qty: 64, exp: '2026-09-16', loc: 'Cold-chain 3PL', warn: true },
];

const TRANSFERS = [
  { from: 'HQ Freezer', to: 'CR-014-25-03-00007', product: 'Garlic Chicken Pasta', qty: 24, date: '2026-09-08' },
  { from: 'HQ Freezer', to: 'CR-041-25-06-00031', product: 'Veggie Bowl', qty: 18, date: '2026-09-08' },
  { from: 'Cold-chain 3PL', to: 'HQ Freezer', product: 'Garlic Noodles', qty: 120, date: '2026-09-07' },
];

const WASTE_ROWS = [
  { date: '2026-09-06', product: 'Beef Burrito', qty: 4, reason: 'Expired', cost: 22 },
  { date: '2026-09-04', product: 'Garlic Chicken Pasta', qty: 2, reason: 'Freezer issue', cost: 14 },
  { date: '2026-09-01', product: 'Veggie Bowl', qty: 3, reason: 'Damaged in transit', cost: 16 },
];

const RECALLS = [
  { lot: 'L-21990', product: 'Beef Burrito', status: 'Resolved', machines: 4 },
  { lot: 'L-22112', product: 'Garlic Noodles', status: 'Resolved', machines: 2 },
];

const MENUS = [
  { loc: 'Corporate office', top: ['Garlic Chicken Pasta', 'Protein Bowl', 'Cold Brew'] },
  { loc: 'University campus', top: ['Beef Burrito', 'Garlic Noodles', 'Energy Drink'] },
  { loc: 'Transit hub', top: ['Grab-and-go Wrap', 'Garlic Chicken Pasta', 'Bottled Water'] },
];

const FORECAST = [
  { sku: 'Garlic Chicken Pasta', current: 62, forecast: 88 },
  { sku: 'Beef Burrito', current: 40, forecast: 35 },
  { sku: 'Veggie Bowl', current: 51, forecast: 70 },
  { sku: 'Garlic Noodles', current: 28, forecast: 24 },
];

const SETTINGS_ROWS = [
  { label: 'Default lead time', value: '5 business days' },
  { label: 'Safety stock target', value: '15% of forecast' },
  { label: 'Reorder trigger', value: 'Stockout-date projection' },
  { label: 'Seasonality window', value: 'Trailing 12 months' },
];

function Kpi({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'success' | 'warning' | 'destructive' }) {
  return (
    <div className={`co-kpi co-tone-${tone}`}>
      <span className="co-kpi-v">{value}</span>
      <span className="co-kpi-l">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.ok;
  return (
    <span className="co-badge" style={{ color: s.text, background: `color-mix(in srgb, ${s.text} 14%, transparent)` }}>
      <i style={{ background: s.dot }} />{s.label}
    </span>
  );
}

export default function OctoOpsMockup({ initialPage = 'dashboard' }: { initialPage?: PageKey }) {
  const [page, setPage] = useState<PageKey>(initialPage);
  const meta = PAGE_TITLES[page];

  return (
    <div className="co">
      <div className="co-window">
        <div className="co-titlebar">
          <span className="co-dot co-r" /><span className="co-dot co-y" /><span className="co-dot co-g" />
          <span className="co-url">app.craverobotics.com/{page === 'dashboard' ? '' : page}</span>
        </div>

        <div className="co-app">
          <nav className="co-sidebar" aria-label="Platform navigation">
            <div className="co-brand">
              <span className="co-brand-name"><b>Crave</b> Robotics</span>
              <span className="co-brand-sub">Ops Dashboard</span>
            </div>
            {NAV.map((group, gi) => (
              <div className="co-navgroup" key={gi}>
                {group.section && <div className="co-navlabel">{group.section}</div>}
                {group.items.map((it) => (
                  <button
                    key={it.key}
                    className={`co-navitem${page === it.key ? ' is-active' : ''}`}
                    onClick={() => setPage(it.key)}
                    aria-current={page === it.key ? 'page' : undefined}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
            <div className="co-sidebar-foot"><i className="co-online-dot" />N</div>
          </nav>

          <div className="co-main">
            <header className="co-topbar">
              <span className="co-eyebrow">{meta.eyebrow}</span>
              <h3>{meta.title}</h3>
            </header>

            <div className="co-content">
              {page === 'dashboard' && (
                <>
                  <div className="co-kpirow">
                    <Kpi label="Total machines" value="25" tone="primary" />
                    <Kpi label="Online" value="21" tone="success" />
                    <Kpi label="Issues" value="3" tone="warning" />
                    <Kpi label="Offline" value="1" tone="destructive" />
                  </div>
                  <div className="co-split">
                    <div className="co-card">
                      <h4>Fleet by region</h4>
                      <ul className="co-barlist">
                        {[['LA-West', 8], ['LA-Central', 6], ['LA-East', 7], ['East SG Valley', 4]].map(([r, n]) => (
                          <li key={r as string}>
                            <span>{r}</span>
                            <div className="co-hbar"><span style={{ width: `${(Number(n) / 8) * 100}%` }} /></div>
                            <b>{n}</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="co-card">
                      <h4>Needs attention</h4>
                      <ul className="co-attn">
                        <li><StatusBadge status="offline" /><span>CR-009-24-11-00003</span><em>6h since last ping</em></li>
                        <li><StatusBadge status="plc-alert" /><span>CR-017-25-02-00025</span><em>PLC fault code 12</em></li>
                        <li><StatusBadge status="temp-alert" /><span>CR-033-25-05-00019</span><em>Freezer temp +4°F</em></li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {page === 'machines' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead>
                      <tr><th>Machine</th><th>Site</th><th>Region</th><th>Fill</th><th>Status</th><th>Revenue (wk)</th></tr>
                    </thead>
                    <tbody>
                      {MACHINES.map((m) => (
                        <tr key={m.muid}>
                          <td className="co-mono">{m.muid}</td>
                          <td>
                            {m.site}
                            <div className="co-code">{m.code}</div>
                          </td>
                          <td>{m.region}</td>
                          <td>
                            <div className="co-fillbar"><span style={{ width: `${m.fill}%` }} /></div>
                            {m.fill}%
                          </td>
                          <td><StatusBadge status={m.status} /></td>
                          <td className={`co-mono co-rev ${revClass(m.rev)}`}>${m.rev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="co-foot">+19 more machines</p>
                </div>
              )}

              {(page === 'dispatch') && (
                <>
                  <div className="co-kpirow co-kpirow-3">
                    <Kpi label="Stops today" value="18" tone="primary" />
                    <Kpi label="Miles planned" value="134.6" tone="success" />
                    <Kpi label="On-time rate" value="92%" tone="warning" />
                  </div>
                  <div className="co-card co-tablecard">
                    <table className="co-table">
                      <thead><tr><th>Technician</th><th>Stops</th><th>Miles</th><th>Status</th></tr></thead>
                      <tbody>
                        {DISPATCH_ROWS.map((r) => (
                          <tr key={r.tech}>
                            <td>{r.tech}</td><td className="co-mono">{r.stops}</td><td className="co-mono">{r.miles}</td>
                            <td><StatusBadge status={r.status === 'On schedule' ? 'ok' : 'temp-alert'} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="co-card">
                    <h4>Restock queue</h4>
                    <ul className="co-attn">
                      {RESTOCK_QUEUE.map((r, i) => (
                        <li key={i}><span className="co-mono">{r.muid}</span><span>{r.item}</span><em>×{r.qty}</em></li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {page === 'tracking' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>Technician</th><th>Last seen</th><th>Location</th><th>Status</th></tr></thead>
                    <tbody>
                      {TRACKING_ROWS.map((r) => (
                        <tr key={r.tech}>
                          <td>{r.tech}</td><td className="co-mono">{r.seen}</td><td>{r.loc}</td>
                          <td><StatusBadge status={r.moving ? 'ok' : 'locked'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {page === 'inv-overview' && (
                <>
                  <div className="co-kpirow">
                    <Kpi label="Lots tracked" value="86" tone="primary" />
                    <Kpi label="Expiring soon" value="2" tone="warning" />
                    <Kpi label="Waste this week" value="$52" tone="destructive" />
                    <Kpi label="Open recalls" value="0" tone="success" />
                  </div>
                  <div className="co-card co-tablecard">
                    <table className="co-table">
                      <thead><tr><th>Lot</th><th>Product</th><th>Qty</th><th>Expires</th><th>Location</th></tr></thead>
                      <tbody>
                        {LOTS.map((l) => (
                          <tr key={l.lot} className={l.warn ? 'co-rowwarn' : ''}>
                            <td className="co-mono">{l.lot}</td><td>{l.product}</td><td className="co-mono">{l.qty}</td>
                            <td>{l.exp}{l.warn && <span className="co-flag">soon</span>}</td><td>{l.loc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {page === 'inv-transfer' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>From</th><th>To</th><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
                    <tbody>
                      {TRANSFERS.map((t, i) => (
                        <tr key={i}>
                          <td>{t.from}</td><td className="co-mono">{t.to}</td><td>{t.product}</td>
                          <td className="co-mono">{t.qty}</td><td className="co-mono">{t.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {page === 'inv-expiring' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>Lot</th><th>Product</th><th>Qty</th><th>Expires</th><th>Location</th></tr></thead>
                    <tbody>
                      {LOTS.filter((l) => l.warn).map((l) => (
                        <tr key={l.lot} className="co-rowwarn">
                          <td className="co-mono">{l.lot}</td><td>{l.product}</td><td className="co-mono">{l.qty}</td>
                          <td>{l.exp}<span className="co-flag">soon</span></td><td>{l.loc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="co-hint">Lots inside the amber window get surfaced here automatically, ahead of the recall-traceability path — a query on this platform, a multi-spreadsheet reconciliation on the old stack.</p>
                </div>
              )}

              {page === 'inv-waste' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Reason</th><th>Cost</th></tr></thead>
                    <tbody>
                      {WASTE_ROWS.map((w, i) => (
                        <tr key={i}>
                          <td className="co-mono">{w.date}</td><td>{w.product}</td><td className="co-mono">{w.qty}</td>
                          <td>{w.reason}</td><td className="co-mono co-rev co-rev-mid">${w.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {page === 'inv-recalls' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>Lot</th><th>Product</th><th>Machines shipped to</th><th>Status</th></tr></thead>
                    <tbody>
                      {RECALLS.map((r) => (
                        <tr key={r.lot}>
                          <td className="co-mono">{r.lot}</td><td>{r.product}</td><td className="co-mono">{r.machines}</td>
                          <td><StatusBadge status="ok" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {page === 'menus' && (
                <div className="co-cards">
                  {MENUS.map((m) => (
                    <div className="co-card" key={m.loc}>
                      <h4>{m.loc}</h4>
                      <ol className="co-menu">{m.top.map((t) => <li key={t}>{t}</li>)}</ol>
                    </div>
                  ))}
                </div>
              )}

              {page === 'demand-overview' && (
                <div className="co-kpirow">
                  <Kpi label="SKUs forecasted" value="34" tone="primary" />
                  <Kpi label="Stockout risk" value="0" tone="success" />
                  <Kpi label="Reorder recs pending" value="6" tone="warning" />
                </div>
              )}

              {page === 'demand-plan' && (
                <div className="co-card co-tablecard">
                  <table className="co-table">
                    <thead><tr><th>SKU</th><th>Current velocity</th><th>12-mo forecast</th><th /></tr></thead>
                    <tbody>
                      {FORECAST.map((f) => (
                        <tr key={f.sku}>
                          <td>{f.sku}</td><td className="co-mono">{f.current}/wk</td><td className="co-mono">{f.forecast}/wk</td>
                          <td>
                            <div className="co-fillbar co-cmp">
                              <span className="co-cur" style={{ width: `${f.current}%` }} />
                              <span className="co-fc" style={{ width: `${f.forecast}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {page === 'demand-settings' && (
                <div className="co-card">
                  <dl className="co-settings">
                    {SETTINGS_ROWS.map((s) => (
                      <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
