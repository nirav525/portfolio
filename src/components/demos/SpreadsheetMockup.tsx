import { useState } from 'react';

/**
 * A representative screenshot of a Google Sheets + Apps Script planning
 * model — the real substrate these two projects were actually built on.
 * Every SKU, number, and formula shown is synthetic.
 */

type Variant = 'forecast' | 'ibp';

type Row = Record<string, string | number>;
type Col = { key: string; label: string; align?: 'left' | 'right'; flag?: boolean };
type Chart = { title: string; kind: 'bar' | 'line'; labels: string[]; a: number[]; b?: number[]; aLabel?: string; bLabel?: string };
type Tab = { label: string; cols: Col[]; rows: Row[]; formula: string; chart?: Chart };

const TOTAL_COLS = 8;
const TOTAL_ROWS = 15;

const FORECAST_TABS: Tab[] = [
  {
    label: 'Forecast — Category A',
    formula: '=FORECAST.ETS(B2, $C$2:$C$61, $A$2:$A$61)',
    cols: [
      { key: 'sku', label: 'SKU' },
      { key: 'avg', label: 'Trailing 12mo Avg/mo', align: 'right' },
      { key: 'season', label: 'Seasonality Idx', align: 'right' },
      { key: 'fcst', label: 'Next-Mo Forecast', align: 'right' },
      { key: 'err', label: 'Error %', align: 'right', flag: true },
    ],
    rows: [
      { sku: 'SKU-A1042', avg: 4180, season: 1.12, fcst: 4680, err: '3.1%' },
      { sku: 'SKU-A1197', avg: 2640, season: 0.94, fcst: 2480, err: '4.8%' },
      { sku: 'SKU-A1256', avg: 3110, season: 1.05, fcst: 3260, err: '2.2%' },
      { sku: 'SKU-A1309', avg: 1890, season: 0.88, fcst: 1660, err: '11.4%' },
      { sku: 'SKU-A1388', avg: 2270, season: 1.02, fcst: 2310, err: '1.9%' },
      { sku: 'SKU-A1417', avg: 1420, season: 1.31, fcst: 1860, err: '6.7%' },
    ],
    chart: {
      title: 'Forecast vs trailing average',
      kind: 'bar',
      labels: ['A1042', 'A1197', 'A1256', 'A1309', 'A1388', 'A1417'],
      a: [4180, 2640, 3110, 1890, 2270, 1420],
      b: [4680, 2480, 3260, 1660, 2310, 1860],
      aLabel: 'Trailing avg',
      bLabel: 'Forecast',
    },
  },
  {
    label: 'Forecast — Category B',
    formula: '=FORECAST.ETS(B2, $C$2:$C$61, $A$2:$A$61)',
    cols: [
      { key: 'sku', label: 'SKU' },
      { key: 'avg', label: 'Trailing 12mo Avg/mo', align: 'right' },
      { key: 'season', label: 'Seasonality Idx', align: 'right' },
      { key: 'fcst', label: 'Next-Mo Forecast', align: 'right' },
      { key: 'err', label: 'Error %', align: 'right', flag: true },
    ],
    rows: [
      { sku: 'SKU-B2011', avg: 3320, season: 1.22, fcst: 4050, err: '2.6%' },
      { sku: 'SKU-B2098', avg: 2810, season: 1.08, fcst: 3030, err: '5.3%' },
      { sku: 'SKU-B2144', avg: 4460, season: 1.15, fcst: 5120, err: '1.4%' },
    ],
    chart: {
      title: 'Forecast vs trailing average',
      kind: 'bar',
      labels: ['B2011', 'B2098', 'B2144'],
      a: [3320, 2810, 4460],
      b: [4050, 3030, 5120],
      aLabel: 'Trailing avg',
      bLabel: 'Forecast',
    },
  },
  {
    label: 'Accuracy Tracking',
    formula: '=1-ABS(D2-C2)/C2',
    cols: [
      { key: 'month', label: 'Month' },
      { key: 'skus', label: 'SKUs modeled', align: 'right' },
      { key: 'mape', label: 'MAPE', align: 'right', flag: true },
      { key: 'savings', label: 'Attributed savings', align: 'right' },
    ],
    rows: [
      { month: '2025-06', skus: 540, mape: '9.8%', savings: '$210,000' },
      { month: '2025-09', skus: 580, mape: '7.6%', savings: '$340,000' },
      { month: '2025-12', skus: 610, mape: '6.1%', savings: '$460,000' },
      { month: '2026-02', skus: 620, mape: '5.4%', savings: '$3,000,000+' },
    ],
    chart: {
      title: 'MAPE trend, falling as coverage grew',
      kind: 'line',
      labels: ['Jun', 'Sep', 'Dec', 'Feb'],
      a: [9.8, 7.6, 6.1, 5.4],
      aLabel: 'MAPE %',
    },
  },
];

const IBP_TABS: Tab[] = [
  {
    label: 'Demand',
    formula: '=SUMIFS(Demand!$C:$C, Demand!$A:$A, $A2)',
    cols: [
      { key: 'region', label: 'Region' },
      { key: 'baseline', label: 'Baseline units', align: 'right' },
      { key: 'shock', label: 'Demand-shock scenario', align: 'right' },
      { key: 'delta', label: 'Δ vs baseline', align: 'right', flag: true },
    ],
    rows: [
      { region: 'West', baseline: 128000, shock: 146000, delta: '+14.1%' },
      { region: 'Central', baseline: 94000, shock: 88000, delta: '−6.4%' },
      { region: 'East', baseline: 111000, shock: 121000, delta: '+9.0%' },
    ],
    chart: {
      title: 'Baseline vs demand-shock scenario',
      kind: 'bar',
      labels: ['West', 'Central', 'East'],
      a: [128000, 94000, 111000],
      b: [146000, 88000, 121000],
      aLabel: 'Baseline',
      bLabel: 'Scenario',
    },
  },
  {
    label: 'Finance',
    formula: '=Finance!Revenue - Finance!COGS - Finance!Opex',
    cols: [
      { key: 'line', label: 'P&L line' },
      { key: 'plan', label: 'Plan', align: 'right' },
      { key: 'scenario', label: 'Supplier-delay scenario', align: 'right' },
      { key: 'delta', label: 'Δ vs plan', align: 'right', flag: true },
    ],
    rows: [
      { line: 'Revenue', plan: '$4.10M', scenario: '$3.78M', delta: '−7.8%' },
      { line: 'Gross margin', plan: '38.2%', scenario: '34.6%', delta: '−3.6 pt' },
      { line: 'Opex', plan: '$1.05M', scenario: '$1.12M', delta: '+6.7%' },
    ],
  },
  {
    label: 'Supply Chain',
    formula: '=IF(LeadTime>Coverage, "AT RISK", "OK")',
    cols: [
      { key: 'supplier', label: 'Supplier' },
      { key: 'leadtime', label: 'Lead time (days)', align: 'right' },
      { key: 'coverage', label: 'Coverage (days)', align: 'right' },
      { key: 'status', label: 'Status', align: 'right', flag: true },
    ],
    rows: [
      { supplier: 'Logistics 3PL', leadtime: 12, coverage: 18, status: 'OK' },
      { supplier: 'Primary ingredient supplier', leadtime: 21, coverage: 14, status: 'AT RISK' },
      { supplier: 'Packaging', leadtime: 9, coverage: 30, status: 'OK' },
    ],
    chart: {
      title: 'Lead time vs coverage, by supplier',
      kind: 'bar',
      labels: ['Logistics', 'Ingredient', 'Packaging'],
      a: [12, 21, 9],
      b: [18, 14, 30],
      aLabel: 'Lead time',
      bLabel: 'Coverage',
    },
  },
  {
    label: 'Scenario Summary',
    formula: '=WEIGHTEDAVG(Demand!Delta, Finance!Delta, Supply!Risk)',
    cols: [
      { key: 'fn', label: 'Function' },
      { key: 'planning', label: 'Planning against' },
      { key: 'now', label: 'Now planning against' },
      { key: 'status', label: 'Status', align: 'right', flag: true },
    ],
    rows: [
      { fn: 'Sales', planning: 'Own spreadsheet', now: 'Shared dataset', status: 'Reconciled' },
      { fn: 'Finance', planning: 'Own spreadsheet', now: 'Shared dataset', status: 'Reconciled' },
      { fn: 'Operations', planning: 'Own spreadsheet', now: 'Shared dataset', status: 'Reconciled' },
      { fn: 'Supply Chain', planning: 'Manual email thread', now: 'Shared dataset', status: 'Reconciled' },
    ],
  },
];

function flagClass(v: string | number): string {
  const s = String(v);
  if (/AT RISK/i.test(s)) return 'sm-bad';
  if (/Reconciled|^OK$/i.test(s)) return 'sm-ok';

  // Normalize a leading sign — typographic minus (−) and a bare "+" —
  // before parsing, so "+14.1%" and "−6.4%" resolve like "-6.4" would.
  const normalized = s.replace(/−/, '-').replace(/^\+/, '');
  const m = normalized.match(/-?\d+(\.\d+)?/);
  if (!m) return '';
  const n = parseFloat(m[0]);
  const isNegative = normalized.trim().startsWith('-');
  if (isNegative) return 'sm-warn';
  return Math.abs(n) > 8 ? 'sm-warn' : 'sm-ok';
}

const TOOLBAR_ICONS = ['↶', '↷', '🖨', '100%', '$', '%', '.00', '⊞', '▾', '⊟', 'Σ'];

function MiniChart({ chart }: { chart: Chart }) {
  const w = 260, h = 130, padL = 4, padR = 4, padT = 6, padB = 16;
  const max = Math.max(...chart.a, ...(chart.b ?? []));
  const n = chart.labels.length;
  if (chart.kind === 'line') {
    const stepX = (w - padL - padR) / (n - 1 || 1);
    const pts = chart.a.map((v, i) => `${padL + i * stepX},${padT + (1 - v / max) * (h - padT - padB)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="sm-chart-svg">
        <polyline points={pts} fill="none" stroke="#1a73e8" strokeWidth="2" />
        {chart.a.map((v, i) => (
          <circle key={i} cx={padL + i * stepX} cy={padT + (1 - v / max) * (h - padT - padB)} r="2.4" fill="#1a73e8" />
        ))}
        {chart.labels.map((l, i) => (
          <text key={l} x={padL + i * stepX} y={h - 4} textAnchor="middle" className="sm-chart-label">{l}</text>
        ))}
      </svg>
    );
  }
  const groupW = (w - padL - padR) / n;
  const barW = chart.b ? groupW / 2.6 : groupW / 1.8;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sm-chart-svg">
      {chart.a.map((v, i) => {
        const x = padL + i * groupW + groupW / 2 - (chart.b ? barW * 1.1 : barW / 2);
        const bh = (v / max) * (h - padT - padB);
        return <rect key={i} x={x} y={h - padB - bh} width={barW} height={bh} fill="#4285f4" />;
      })}
      {chart.b?.map((v, i) => {
        const x = padL + i * groupW + groupW / 2 + barW * 0.1;
        const bh = (v / max) * (h - padT - padB);
        return <rect key={i} x={x} y={h - padB - bh} width={barW} height={bh} fill="#ea4335" />;
      })}
      {chart.labels.map((l, i) => (
        <text key={l} x={padL + i * groupW + groupW / 2} y={h - 4} textAnchor="middle" className="sm-chart-label">{l}</text>
      ))}
    </svg>
  );
}

export default function SpreadsheetMockup({ variant }: { variant: Variant }) {
  const tabs = variant === 'ibp' ? IBP_TABS : FORECAST_TABS;
  const [i, setI] = useState(0);
  const active = tabs[i];
  const blankCols = Math.max(0, TOTAL_COLS - active.cols.length);
  const blankRows = Math.max(0, TOTAL_ROWS - active.rows.length);

  return (
    <div className="sm">
      <div className="sm-window">
        <div className="sm-titlebar">
          <span className="sm-dot sm-r" /><span className="sm-dot sm-y" /><span className="sm-dot sm-g" />
          <span className="sm-url">docs.google.com/spreadsheets/d/{variant === 'ibp' ? '1Xk9…IBP' : '1Qm4…Forecast'}</span>
        </div>
        <div className="sm-sheet">
          <div className="sm-menubar">
            <span className="sm-doctitle">{variant === 'ibp' ? 'Integrated Business Plan — v14' : 'Demand Forecast Model — v22'}</span>
            <span className="sm-menu">File&nbsp;&nbsp;Edit&nbsp;&nbsp;View&nbsp;&nbsp;Insert&nbsp;&nbsp;Format&nbsp;&nbsp;Data&nbsp;&nbsp;Extensions</span>
          </div>
          <div className="sm-toolbar">
            {TOOLBAR_ICONS.map((ic, idx) => <span key={idx} className="sm-ticon">{ic}</span>)}
          </div>
          <div className="sm-formulabar">
            <span className="sm-fx">fx</span>
            <span className="sm-formula">{active.formula}</span>
          </div>
          <div className="sm-grid-wrap">
            <table className="sm-grid">
              <thead>
                <tr>
                  <th className="sm-corner" />
                  {active.cols.map((c, ci) => (
                    <th key={c.key} className="sm-colhead">{String.fromCharCode(65 + ci)}</th>
                  ))}
                  {Array.from({ length: blankCols }).map((_, bi) => (
                    <th key={`bh-${bi}`} className="sm-colhead sm-blank">{String.fromCharCode(65 + active.cols.length + bi)}</th>
                  ))}
                </tr>
                <tr className="sm-labelrow">
                  <th className="sm-rownum">1</th>
                  {active.cols.map((c) => (
                    <th key={c.key} style={{ textAlign: c.align === 'right' ? 'right' : 'left' }}>
                      {c.label}<span className="sm-filter">▾</span>
                    </th>
                  ))}
                  {Array.from({ length: blankCols }).map((_, bi) => <th key={`bl-${bi}`} className="sm-blank" />)}
                </tr>
              </thead>
              <tbody>
                {active.rows.map((r, ri) => (
                  <tr key={ri}>
                    <td className="sm-rownum">{ri + 2}</td>
                    {active.cols.map((c) => (
                      <td
                        key={c.key}
                        className={c.flag ? flagClass(r[c.key]) : ''}
                        style={{ textAlign: c.align === 'right' ? 'right' : 'left' }}
                      >
                        {r[c.key]}
                      </td>
                    ))}
                    {Array.from({ length: blankCols }).map((_, bi) => <td key={`br-${bi}`} className="sm-blank" />)}
                  </tr>
                ))}
                {Array.from({ length: blankRows }).map((_, bri) => (
                  <tr key={`blank-row-${bri}`}>
                    <td className="sm-rownum">{active.rows.length + bri + 2}</td>
                    {Array.from({ length: TOTAL_COLS }).map((_, bi) => <td key={bi} className="sm-blank" />)}
                  </tr>
                ))}
              </tbody>
            </table>
            {active.chart && (
              <div className="sm-chartcard">
                <div className="sm-chartcard-head">{active.chart.title}<span className="sm-chartmenu">⋮</span></div>
                <MiniChart chart={active.chart} />
                {active.chart.b && (
                  <div className="sm-chartlegend">
                    <span><i style={{ background: '#4285f4' }} />{active.chart.aLabel}</span>
                    <span><i style={{ background: '#ea4335' }} />{active.chart.bLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="sm-tabbar">
            {tabs.map((t, ti) => (
              <button key={t.label} className={`sm-tab${ti === i ? ' is-active' : ''}`} onClick={() => setI(ti)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
