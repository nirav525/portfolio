import { useMemo, useState } from 'react';

/**
 * Real, well-known tickers so the demo doesn't read as a toy — but every
 * share count, price, and P&L figure below is synthetic and illustrative,
 * not a live feed or a real position. Not investment advice.
 */

type Holding = {
  ticker: string; name: string; sector: string;
  shares: number; avgCost: number; price: number; dayChgPct: number;
  pe: number; earnings: string;
};

const HOLDINGS: Holding[] = [
  { ticker: 'AAPL', name: 'Apple', sector: 'Technology', shares: 25, avgCost: 165.20, price: 228.40, dayChgPct: 1.2, pe: 34.1, earnings: 'Oct 30' },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Technology', shares: 15, avgCost: 310.00, price: 412.80, dayChgPct: 0.6, pe: 35.7, earnings: 'Oct 22' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', shares: 30, avgCost: 152.10, price: 158.90, dayChgPct: -0.3, pe: 15.2, earnings: 'Oct 15' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', shares: 20, avgCost: 145.00, price: 168.30, dayChgPct: 0.2, pe: 26.4, earnings: 'Oct 18' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', shares: 18, avgCost: 138.50, price: 205.60, dayChgPct: 1.8, pe: 12.1, earnings: 'Oct 11' },
  { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy', shares: 22, avgCost: 98.20, price: 112.40, dayChgPct: -1.1, pe: 13.8, earnings: 'Nov 1' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary', shares: 10, avgCost: 310.00, price: 358.70, dayChgPct: 0.4, pe: 24.3, earnings: 'Nov 19' },
  { ticker: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples', shares: 40, avgCost: 58.30, price: 63.90, dayChgPct: 0.1, pe: 24.9, earnings: 'Oct 23' },
  { ticker: 'V', name: 'Visa', sector: 'Financials', shares: 12, avgCost: 220.00, price: 289.50, dayChgPct: 0.9, pe: 30.6, earnings: 'Oct 24' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', shares: 8, avgCost: 480.00, price: 561.20, dayChgPct: -2.4, pe: 19.7, earnings: 'Oct 16' },
];

const fmt$ = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmt2 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const sign = (n: number) => (n >= 0 ? '+' : '−');

function withMath(h: Holding) {
  const value = h.shares * h.price;
  const cost = h.shares * h.avgCost;
  const plVal = value - cost;
  const plPct = (plVal / cost) * 100;
  const prevPrice = h.price / (1 + h.dayChgPct / 100);
  const dayVal = (h.price - prevPrice) * h.shares;
  return { ...h, value, cost, plVal, plPct, dayVal };
}

type Row = ReturnType<typeof withMath>;
type SortKey = 'ticker' | 'value' | 'dayChgPct' | 'plPct' | 'pe';

export default function MarketScore() {
  const [tab, setTab] = useState<'holdings' | 'brief'>('holdings');
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => HOLDINGS.map(withMath), []);
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return cmp * sortDir;
    });
  }, [rows, sortKey, sortDir]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = (totalPL / totalCost) * 100;
  const totalDay = rows.reduce((s, r) => s + r.dayVal, 0);
  const totalDayPct = (totalDay / (totalValue - totalDay)) * 100;

  const bySector = useMemo(() => {
    const map = new Map<string, { value: number; day: number }>();
    for (const r of rows) {
      const e = map.get(r.sector) ?? { value: 0, day: 0 };
      e.value += r.value; e.day += r.dayVal;
      map.set(r.sector, e);
    }
    return [...map.entries()]
      .map(([sector, v]) => ({ sector, value: v.value, dayPct: (v.day / (v.value - v.day)) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  }
  function caret(key: SortKey) {
    if (key !== sortKey) return '';
    return sortDir === 1 ? ' ▲' : ' ▼';
  }

  return (
    <div className="ms">
      <div className="ms-tabs" role="tablist">
        <button className={`ms-tab${tab === 'holdings' ? ' is-active' : ''}`} onClick={() => setTab('holdings')}>Holdings</button>
        <button className={`ms-tab${tab === 'brief' ? ' is-active' : ''}`} onClick={() => setTab('brief')}>Brief</button>
      </div>

      <p className="ms-disclaimer">Real tickers, illustrative positions and prices. Not investment advice.</p>

      {tab === 'holdings' && (
        <div className="ms-holdings">
          <div className="ms-summary">
            <div><span>Total value</span><b>{fmt$(totalValue)}</b></div>
            <div className={totalDay >= 0 ? 'ms-pos' : 'ms-neg'}>
              <span>Today</span><b>{sign(totalDay)}{fmt$(Math.abs(totalDay))} ({sign(totalDayPct)}{Math.abs(totalDayPct).toFixed(2)}%)</b>
            </div>
            <div className={totalPL >= 0 ? 'ms-pos' : 'ms-neg'}>
              <span>Total P/L</span><b>{sign(totalPL)}{fmt$(Math.abs(totalPL))} ({sign(totalPLPct)}{Math.abs(totalPLPct).toFixed(1)}%)</b>
            </div>
          </div>

          <div className="ms-tablewrap">
            <table className="ms-htable">
              <thead>
                <tr>
                  <th className="ms-sortable" onClick={() => sortBy('ticker')}>Ticker{caret('ticker')}</th>
                  <th>Sector</th>
                  <th className="ms-num">Shares</th>
                  <th className="ms-num">Avg cost</th>
                  <th className="ms-num">Price</th>
                  <th className="ms-num ms-sortable" onClick={() => sortBy('dayChgPct')}>Day{caret('dayChgPct')}</th>
                  <th className="ms-num ms-sortable" onClick={() => sortBy('value')}>Value{caret('value')}</th>
                  <th className="ms-num ms-sortable" onClick={() => sortBy('plPct')}>P/L{caret('plPct')}</th>
                  <th className="ms-num ms-sortable" onClick={() => sortBy('pe')}>P/E{caret('pe')}</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.ticker}>
                    <td><span className="ms-t">{r.ticker}</span><span className="ms-n">{r.name}</span></td>
                    <td className="ms-sector">{r.sector}</td>
                    <td className="ms-num ms-mono">{r.shares}</td>
                    <td className="ms-num ms-mono">{fmt2(r.avgCost)}</td>
                    <td className="ms-num ms-mono">{fmt2(r.price)}</td>
                    <td className={`ms-num ms-mono ${r.dayChgPct >= 0 ? 'ms-pos' : 'ms-neg'}`}>{sign(r.dayChgPct)}{Math.abs(r.dayChgPct).toFixed(1)}%</td>
                    <td className="ms-num ms-mono">{fmt$(r.value)}</td>
                    <td className={`ms-num ms-mono ${r.plPct >= 0 ? 'ms-pos' : 'ms-neg'}`}>{sign(r.plPct)}{Math.abs(r.plPct).toFixed(1)}%</td>
                    <td className="ms-num ms-mono">{r.pe.toFixed(1)}</td>
                    <td className="ms-mono">{r.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ms-sectors">
            <h4>Sector performance today</h4>
            <ul>
              {bySector.map((s) => (
                <li key={s.sector}>
                  <span className="ms-seclabel">{s.sector}</span>
                  <div className="ms-secbar"><span style={{ width: `${Math.min(100, (s.value / totalValue) * 100)}%` }} /></div>
                  <span className={`ms-mono ${s.dayPct >= 0 ? 'ms-pos' : 'ms-neg'}`}>{sign(s.dayPct)}{Math.abs(s.dayPct).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'brief' && (
        <div className="ms-email">
          <div className="ms-email-head">
            <div><span className="ms-emsub">Portfolio Brief — Wednesday, September 9</span><span className="ms-emfrom">from: daily-brief@ (automated)</span></div>
          </div>
          <div className="ms-email-body">
            <svg viewBox="0 0 320 90" className="ms-emchart" role="img" aria-label="Synthetic portfolio value chart">
              <polyline
                points="0,60 30,55 60,58 90,45 120,50 150,38 180,42 210,30 240,34 270,22 300,26 320,18"
                fill="none" stroke="#16a34a" strokeWidth="2"
              />
            </svg>
            <p>
              Portfolio value {sign(totalDayPct)}{Math.abs(totalDayPct).toFixed(2)}% today, led by <strong>JPMorgan Chase</strong> and{' '}
              <strong>Apple</strong> on broad strength in Financials and Technology. <strong>UnitedHealth Group</strong> was the
              largest drag, down {Math.abs(HOLDINGS.find((h) => h.ticker === 'UNH')!.dayChgPct)}% after a sector-wide
              pullback in Healthcare. Full holdings and today's P/L are on the Holdings tab.
            </p>
            <p className="ms-emnote">Generated automatically and delivered every weekday morning before the open.</p>
          </div>
        </div>
      )}
    </div>
  );
}
