import { useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * All tickers, company names, and figures below are invented for this demo.
 * None correspond to real companies or real market data.
 */

type Factor = 'Valuation' | 'Growth' | 'Quality' | 'Momentum' | 'Sentiment';
const FACTORS: Factor[] = ['Valuation', 'Growth', 'Quality', 'Momentum', 'Sentiment'];
const FACTOR_COLOR: Record<Factor, string> = {
  Valuation: '#0891b2',
  Growth: '#16a34a',
  Quality: '#7c3aed',
  Momentum: '#f59e0b',
  Sentiment: '#dc2626',
};

type Ticker = { id: string; name: string; scores: Record<Factor, number> };

const TICKERS: Ticker[] = [
  { id: 'NWRB', name: 'Northwind Robotics', scores: { Valuation: 52, Growth: 88, Quality: 71, Momentum: 76, Sentiment: 69 } },
  { id: 'BHFD', name: 'Blue Harbor Foods', scores: { Valuation: 74, Growth: 40, Quality: 66, Momentum: 48, Sentiment: 55 } },
  { id: 'VRTM', name: 'Vertex Materials', scores: { Valuation: 61, Growth: 55, Quality: 58, Momentum: 51, Sentiment: 47 } },
  { id: 'CDSY', name: 'Cascade Data Systems', scores: { Valuation: 38, Growth: 82, Quality: 79, Momentum: 84, Sentiment: 80 } },
  { id: 'IRLF', name: 'Ironleaf Energy', scores: { Valuation: 80, Growth: 30, Quality: 52, Momentum: 35, Sentiment: 40 } },
  { id: 'SLST', name: 'Solstice Biotech', scores: { Valuation: 29, Growth: 91, Quality: 44, Momentum: 62, Sentiment: 58 } },
  { id: 'MRLN', name: 'Marlin Logistics', scores: { Valuation: 68, Growth: 48, Quality: 61, Momentum: 53, Sentiment: 50 } },
  { id: 'AMBF', name: 'Amberfield Retail', scores: { Valuation: 71, Growth: 36, Quality: 49, Momentum: 41, Sentiment: 44 } },
  { id: 'QLLF', name: 'Quill & Ledger Finance', scores: { Valuation: 77, Growth: 42, Quality: 73, Momentum: 46, Sentiment: 52 } },
  { id: 'PHSC', name: 'Pinehollow Semiconductors', scores: { Valuation: 34, Growth: 85, Quality: 68, Momentum: 89, Sentiment: 77 } },
  { id: 'DRFT', name: 'Driftwood Media', scores: { Valuation: 58, Growth: 33, Quality: 39, Momentum: 29, Sentiment: 36 } },
  { id: 'HLCY', name: 'Halcyon Aerospace', scores: { Valuation: 46, Growth: 63, Quality: 75, Momentum: 66, Sentiment: 61 } },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function MarketScore() {
  const [tab, setTab] = useState<'score' | 'brief'>('score');
  const [weights, setWeights] = useState<Record<Factor, number>>({
    Valuation: 20, Growth: 20, Quality: 20, Momentum: 20, Sentiment: 20,
  });

  const totalWeight = FACTORS.reduce((a, f) => a + weights[f], 0) || 1;

  const ranked = useMemo(() => {
    return TICKERS.map((t) => {
      const contributions = FACTORS.map((f) => ({ factor: f, value: (t.scores[f] * weights[f]) / totalWeight }));
      const composite = contributions.reduce((a, c) => a + c.value, 0);
      return { ...t, composite, contributions };
    }).sort((a, b) => b.composite - a.composite);
  }, [weights, totalWeight]);

  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const prevRects = useRef<Record<string, DOMRect>>({});

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const nextRects: Record<string, DOMRect> = {};
    for (const t of ranked) {
      const el = rowRefs.current[t.id];
      if (el) nextRects[t.id] = el.getBoundingClientRect();
    }
    for (const t of ranked) {
      const el = rowRefs.current[t.id];
      const prev = prevRects.current[t.id];
      const next = nextRects[t.id];
      if (el && prev && next) {
        const dy = prev.top - next.top;
        if (Math.abs(dy) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${dy}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.42s cubic-bezier(0.2,0.7,0.2,1)';
            el.style.transform = '';
          });
        }
      }
    }
    prevRects.current = nextRects;
  }, [ranked]);

  return (
    <div className="ms">
      <div className="ms-tabs" role="tablist">
        <button className={`ms-tab${tab === 'score' ? ' is-active' : ''}`} onClick={() => setTab('score')}>Score</button>
        <button className={`ms-tab${tab === 'brief' ? ' is-active' : ''}`} onClick={() => setTab('brief')}>Brief</button>
      </div>

      <p className="ms-disclaimer">Tickers and figures are entirely synthetic. This is not investment advice.</p>

      {tab === 'score' && (
        <div className="ms-score">
          <div className="ms-weights">
            {FACTORS.map((f) => (
              <label className="ms-weight" key={f}>
                <span className="ms-wlabel"><i style={{ background: FACTOR_COLOR[f] }} />{f}</span>
                <input
                  type="range" min={0} max={40} value={weights[f]}
                  onChange={(e) => setWeights((w) => ({ ...w, [f]: Number(e.target.value) }))}
                />
                <output>{weights[f]}</output>
              </label>
            ))}
          </div>

          <ul className="ms-list">
            {ranked.map((t, i) => (
              <li key={t.id} ref={(el) => { rowRefs.current[t.id] = el; }} className="ms-row">
                <span className="ms-rank">{i + 1}</span>
                <div className="ms-name">
                  <span className="ms-ticker">{t.id}</span>
                  <span className="ms-company">{t.name}</span>
                </div>
                <div className="ms-composebar" title={`Composite score ${t.composite.toFixed(1)}`}>
                  {t.contributions.map((c) => (
                    <span key={c.factor} style={{ width: `${c.value}%`, background: FACTOR_COLOR[c.factor] }} />
                  ))}
                </div>
                <span className="ms-score-v">{t.composite.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'brief' && (
        <div className="ms-email">
          <div className="ms-email-head">
            <div><span className="ms-emsub">Market Brief — Wednesday, September 9</span><span className="ms-emfrom">from: daily-brief@ (automated)</span></div>
          </div>
          <div className="ms-email-body">
            <svg viewBox="0 0 320 90" className="ms-emchart" role="img" aria-label="Synthetic index chart">
              <polyline
                points="0,60 30,55 60,58 90,45 120,50 150,38 180,42 210,30 240,34 270,22 300,26 320,18"
                fill="none" stroke="#16a34a" strokeWidth="2"
              />
            </svg>
            <p>
              Broad synthetic indices drifted higher this session. Growth-tilted names in the model
              portfolio outperformed value names for a third straight session. <strong>Cascade Data
              Systems</strong> and <strong>Pinehollow Semiconductors</strong> led the shortlist on
              strength in Momentum and Sentiment; <strong>Driftwood Media</strong> remained at the
              bottom of the ranking on weak Growth and Quality readings.
            </p>
            <p className="ms-emnote">Generated automatically. Figures are synthetic and do not reflect real market data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
