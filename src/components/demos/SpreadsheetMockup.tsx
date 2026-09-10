import { useState } from 'react';

/**
 * A representative screenshot of a Google Sheets + Apps Script planning
 * model — the real substrate these two projects were actually built on.
 * Every SKU, number, and formula shown is synthetic.
 */

type Variant = 'forecast' | 'ibp';

type Row = Record<string, string | number>;
type Col = { key: string; label: string; align?: 'left' | 'right'; flag?: boolean };

const FORECAST_TABS: { label: string; cols: Col[]; rows: Row[]; formula: string }[] = [
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
  },
];

const IBP_TABS: { label: string; cols: Col[]; rows: Row[]; formula: string }[] = [
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

export default function SpreadsheetMockup({ variant }: { variant: Variant }) {
  const tabs = variant === 'ibp' ? IBP_TABS : FORECAST_TABS;
  const [i, setI] = useState(0);
  const active = tabs[i];

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
                </tr>
                <tr className="sm-labelrow">
                  <th className="sm-rownum">1</th>
                  {active.cols.map((c) => (
                    <th key={c.key} style={{ textAlign: c.align === 'right' ? 'right' : 'left' }}>{c.label}</th>
                  ))}
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
                  </tr>
                ))}
              </tbody>
            </table>
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
