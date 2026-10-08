import { useMemo, useState } from 'react';

/**
 * Matches recall notices against a SKU catalog the way the production monitor
 * does: normalize, tokenize, fuzzy-match tokens, score, and alert above a threshold.
 * Notices and catalog are synthetic; production pulls the live FDA and USDA feeds.
 */

type Sku = { name: string; ingredients: string[] };
type Notice = {
  id: string;
  source: 'FDA' | 'USDA FSIS';
  cls: 'Class I' | 'Class II';
  kind: 'product' | 'ingredient';
  product: string;
  reason: string;
};

const CATALOG: Sku[] = [
  { name: 'Garlic Noodles', ingredients: ['wheat noodles', 'garlic', 'butter', 'parmesan'] },
  { name: 'Beef Burrito', ingredients: ['flour tortilla', 'beef', 'black beans', 'cheddar'] },
  { name: 'Chicken Tikka Masala Bowl', ingredients: ['chicken', 'basmati rice', 'cilantro', 'cream'] },
  { name: 'Chicken Fried Rice', ingredients: ['chicken', 'jasmine rice', 'egg', 'soy sauce'] },
  { name: 'Cheese Enchiladas', ingredients: ['corn tortilla', 'cheddar', 'red chile sauce'] },
  { name: 'Veggie Pad Thai', ingredients: ['rice noodles', 'peanuts', 'cilantro', 'tamarind'] },
  { name: 'Mac & Cheese Bowl', ingredients: ['elbow pasta', 'cheddar', 'milk'] },
  { name: 'Teriyaki Chicken Bowl', ingredients: ['chicken', 'jasmine rice', 'teriyaki sauce', 'broccoli'] },
  { name: 'Pork Dumplings', ingredients: ['pork', 'wheat wrapper', 'cabbage'] },
  { name: 'Chicken Alfredo Pasta', ingredients: ['chicken', 'fettuccine', 'parmesan', 'cream'] },
  { name: 'Spinach Cheese Quesadilla', ingredients: ['flour tortilla', 'spinach', 'cheddar'] },
  { name: 'Beef Bolognese Pasta', ingredients: ['beef', 'penne', 'tomato'] },
];

const NOTICES: Notice[] = [
  { id: 'N-1', source: 'FDA', cls: 'Class II', kind: 'product', product: 'Garlic Noodles, 12 oz frozen entree', reason: 'Undeclared milk allergen' },
  { id: 'N-2', source: 'USDA FSIS', cls: 'Class I', kind: 'product', product: 'Frozen beef & bean burritos, 8 oz', reason: 'Possible plastic foreign matter' },
  { id: 'N-3', source: 'FDA', cls: 'Class I', kind: 'ingredient', product: 'Wheat flour tortillas, 20 ct bag', reason: 'Possible Salmonella contamination' },
  { id: 'N-4', source: 'USDA FSIS', cls: 'Class I', kind: 'product', product: 'Chiken Alfredo Pasta meal kit, ready-to-eat', reason: 'Possible Listeria monocytogenes' },
  { id: 'N-5', source: 'FDA', cls: 'Class I', kind: 'ingredient', product: 'Organic baby spinach, 5 oz clamshell', reason: 'Possible E. coli O157:H7' },
  { id: 'N-6', source: 'FDA', cls: 'Class II', kind: 'product', product: 'Lemon blueberry muffins, 4 pack', reason: 'Mislabeled tree nut allergen' },
];

const STOP = new Set([
  'frozen', 'oz', 'ct', 'lb', 'ready', 'eat', 'ready-to-eat', 'size', 'family', 'entree', 'meal', 'kit', 'pack',
  'bag', 'organic', 'fresh', 'the', 'and', 'with', 'of', 'a', 'in', 'baby', 'clamshell', 'bean',
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// Exact, or a one-character slip on longer words ("chiken" -> "chicken").
const same = (a: string, b: string) => a === b || (a.length >= 5 && b.length >= 5 && lev(a, b) <= 1);
const has = (bag: string[], t: string) => bag.some((x) => same(x, t));

type Hit = { sku: Sku; score: number; via: 'name' | 'ingredient'; detail: string };

function match(notice: { product: string; kind: 'product' | 'ingredient' }): Hit[] {
  const bag = tokens(notice.product);
  const hits: Hit[] = [];
  for (const sku of CATALOG) {
    if (notice.kind === 'product') {
      const nt = tokens(sku.name);
      const got = nt.filter((t) => has(bag, t));
      if (got.length) hits.push({ sku, score: got.length / nt.length, via: 'name', detail: `${got.length} of ${nt.length} name words: ${got.join(', ')}` });
    } else {
      const found = sku.ingredients.find((ing) => tokens(ing).every((t) => has(bag, t)));
      if (found) hits.push({ sku, score: 0.65, via: 'ingredient', detail: `contains “${found}”` });
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

export default function RecallMatcher() {
  const [threshold, setThreshold] = useState(0.6);
  const [sel, setSel] = useState('N-4');
  const [custom, setCustom] = useState('');
  const [customKind, setCustomKind] = useState<'product' | 'ingredient'>('product');

  const usingCustom = custom.trim().length > 0;
  const notice: Notice = usingCustom
    ? { id: 'Custom', source: 'FDA', cls: 'Class I', kind: customKind, product: custom.trim(), reason: 'Your test notice' }
    : NOTICES.find((n) => n.id === sel)!;

  const hits = useMemo(() => match(notice), [notice.product, notice.kind]);
  const flagged = hits.filter((h) => h.score >= threshold);

  return (
    <div className="rc">
      <div className="rc-grid">
        <div>
          <h4 className="rc-h">Incoming notices</h4>
          <ul className="rc-feed">
            {NOTICES.map((n) => {
              const f = match(n).filter((h) => h.score >= threshold).length;
              return (
                <li key={n.id}>
                  <button type="button" className={!usingCustom && sel === n.id ? 'on' : ''} onClick={() => { setCustom(''); setSel(n.id); }}>
                    <span className="rc-src">{n.source} · {n.cls}</span>
                    <b>{n.product}</b>
                    <em>{n.reason}</em>
                    <span className={`rc-pill${f ? ' hit' : ''}`}>{f ? `${f} SKU${f > 1 ? 's' : ''} flagged` : 'No match'}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <label className="rc-custom">
            <span>Or try your own notice</span>
            <input type="text" placeholder="e.g. Garlic Noodels, 10 oz" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <span className="rc-kind">
              <label><input type="radio" checked={customKind === 'product'} onChange={() => setCustomKind('product')} /> Finished product</label>
              <label><input type="radio" checked={customKind === 'ingredient'} onChange={() => setCustomKind('ingredient')} /> Ingredient</label>
            </span>
          </label>
        </div>

        <div>
          <label className="dd-slider">
            <span className="dd-slider-top"><span>Match threshold</span><output>{threshold.toFixed(2)}</output></span>
            <input type="range" min={0.3} max={1} step={0.05} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </label>

          <h4 className="rc-h">Catalog matches for “{notice.product}”</h4>
          {hits.length === 0 ? (
            <p className="rc-none">Nothing in the catalog resembles this notice. No alert is sent.</p>
          ) : (
            <ul className="rc-hits">
              {hits.map((h) => (
                <li key={h.sku.name} className={h.score >= threshold ? 'flag' : 'below'}>
                  <span className="rc-sku">{h.sku.name}</span>
                  <span className="rc-meter"><i style={{ width: `${h.score * 100}%` }} /></span>
                  <span className="rc-score">{h.score.toFixed(2)}</span>
                  <small>{h.via === 'ingredient' ? 'Ingredient exposure' : 'Name match'} — {h.detail}</small>
                </li>
              ))}
            </ul>
          )}

          {flagged.length > 0 ? (
            <div className="rc-slack" aria-label="Slack alert preview">
              <div className="rc-slack-top"><b>Recall monitor</b> <span>#recalls</span></div>
              <p><strong>{notice.cls} · {notice.source}</strong> — {notice.product}</p>
              <p>Reason: {notice.reason}</p>
              <p>Matches {flagged.length} active SKU{flagged.length > 1 ? 's' : ''}: {flagged.map((h) => `${h.sku.name} (${h.score.toFixed(2)})`).join(', ')}</p>
            </div>
          ) : (
            <p className="rc-quiet">No alert posted — nothing cleared the threshold.</p>
          )}
        </div>
      </div>

      <p className="dd-explain">
        <strong>Try the trade-off.</strong> Select the tortilla notice, then raise the threshold to
        0.70. Ingredient exposures score 0.65, so they drop out: a stricter setting means fewer false
        alarms and a real chance of missing an exposure. Typo-tolerant matching is what catches
        “Chiken” for “Chicken”.
      </p>
    </div>
  );
}
