import { useMemo, useState } from 'react';

/**
 * Synthetic dish library and grocery-list aggregation. Every dish, ingredient,
 * and quantity below is invented for the demo.
 */

type Category = 'Produce' | 'Dairy' | 'Pantry' | 'Frozen' | 'Spices';
type Cuisine = 'Indian' | 'Italian' | 'Asian' | 'Mexican' | 'Mediterranean' | 'Thai' | 'American';

const CUISINE_COLOR: Record<Cuisine, string> = {
  Indian: '#f59e0b',
  Italian: '#16a34a',
  Asian: '#dc2626',
  Mexican: '#ea580c',
  Mediterranean: '#0891b2',
  Thai: '#7c3aed',
  American: '#2563eb',
};

const CATEGORY_ORDER: Category[] = ['Produce', 'Dairy', 'Pantry', 'Frozen', 'Spices'];

const INGREDIENT_INFO: Record<string, { unit: string; category: Category }> = {
  Onion: { unit: 'cup, chopped', category: 'Produce' },
  Garlic: { unit: 'clove', category: 'Produce' },
  'Bell Pepper': { unit: 'whole', category: 'Produce' },
  Tomato: { unit: 'whole', category: 'Produce' },
  Cilantro: { unit: 'bunch', category: 'Produce' },
  Lime: { unit: 'whole', category: 'Produce' },
  Ginger: { unit: 'tbsp, minced', category: 'Produce' },
  Mushroom: { unit: 'cup, sliced', category: 'Produce' },
  Zucchini: { unit: 'whole', category: 'Produce' },
  Cucumber: { unit: 'whole', category: 'Produce' },
  Paneer: { unit: 'cup, cubed', category: 'Dairy' },
  Mozzarella: { unit: 'cup, shredded', category: 'Dairy' },
  Feta: { unit: 'cup, crumbled', category: 'Dairy' },
  Parmesan: { unit: 'cup, grated', category: 'Dairy' },
  Rice: { unit: 'cup', category: 'Pantry' },
  'Black Beans': { unit: 'can', category: 'Pantry' },
  Chickpeas: { unit: 'can', category: 'Pantry' },
  'Rice Noodles': { unit: 'oz', category: 'Pantry' },
  'Soy Sauce': { unit: 'tbsp', category: 'Pantry' },
  'Olive Oil': { unit: 'tbsp', category: 'Pantry' },
  'Flour Tortillas': { unit: 'pack', category: 'Pantry' },
  'Pita Bread': { unit: 'pack', category: 'Pantry' },
  'Peanut Butter': { unit: 'tbsp', category: 'Pantry' },
  'Coconut Milk': { unit: 'can', category: 'Pantry' },
  'Pizza Dough': { unit: 'ball', category: 'Pantry' },
  'Frozen Peas': { unit: 'cup', category: 'Frozen' },
  'Garam Masala': { unit: 'tbsp', category: 'Spices' },
  Cumin: { unit: 'tsp', category: 'Spices' },
  Turmeric: { unit: 'tsp', category: 'Spices' },
  'Curry Powder': { unit: 'tbsp', category: 'Spices' },
  'Chili Powder': { unit: 'tsp', category: 'Spices' },
};

type Dish = { id: string; name: string; cuisine: Cuisine; ingredients: { name: string; qty: number }[] };

const DISHES: Dish[] = [
  { id: 'ptm', name: 'Paneer Tikka Masala', cuisine: 'Indian', ingredients: [
    { name: 'Paneer', qty: 1 }, { name: 'Onion', qty: 1 }, { name: 'Tomato', qty: 2 },
    { name: 'Garlic', qty: 3 }, { name: 'Garam Masala', qty: 1 }, { name: 'Rice', qty: 1 },
  ] },
  { id: 'cm', name: 'Chana Masala', cuisine: 'Indian', ingredients: [
    { name: 'Chickpeas', qty: 2 }, { name: 'Onion', qty: 1 }, { name: 'Tomato', qty: 2 },
    { name: 'Garlic', qty: 2 }, { name: 'Cumin', qty: 1 }, { name: 'Turmeric', qty: 0.5 },
  ] },
  { id: 'vb', name: 'Vegetable Biryani', cuisine: 'Indian', ingredients: [
    { name: 'Rice', qty: 2 }, { name: 'Onion', qty: 1 }, { name: 'Frozen Peas', qty: 1 },
    { name: 'Garam Masala', qty: 1 }, { name: 'Ginger', qty: 1 },
  ] },
  { id: 'mf', name: 'Margherita Flatbread', cuisine: 'Italian', ingredients: [
    { name: 'Pizza Dough', qty: 1 }, { name: 'Mozzarella', qty: 1 }, { name: 'Tomato', qty: 2 }, { name: 'Olive Oil', qty: 1 },
  ] },
  { id: 'mr', name: 'Mushroom Risotto', cuisine: 'Italian', ingredients: [
    { name: 'Rice', qty: 1 }, { name: 'Mushroom', qty: 2 }, { name: 'Parmesan', qty: 0.5 },
    { name: 'Onion', qty: 1 }, { name: 'Garlic', qty: 2 },
  ] },
  { id: 'vsf', name: 'Vegetable Stir-Fry', cuisine: 'Asian', ingredients: [
    { name: 'Bell Pepper', qty: 1 }, { name: 'Zucchini', qty: 1 }, { name: 'Soy Sauce', qty: 2 },
    { name: 'Garlic', qty: 2 }, { name: 'Ginger', qty: 1 }, { name: 'Rice', qty: 1 },
  ] },
  { id: 'sn', name: 'Sesame Noodles', cuisine: 'Asian', ingredients: [
    { name: 'Rice Noodles', qty: 8 }, { name: 'Peanut Butter', qty: 2 }, { name: 'Soy Sauce', qty: 2 },
    { name: 'Garlic', qty: 1 }, { name: 'Cucumber', qty: 1 },
  ] },
  { id: 'bbt', name: 'Black Bean Tacos', cuisine: 'Mexican', ingredients: [
    { name: 'Black Beans', qty: 2 }, { name: 'Flour Tortillas', qty: 1 }, { name: 'Onion', qty: 1 },
    { name: 'Cilantro', qty: 1 }, { name: 'Lime', qty: 1 },
  ] },
  { id: 'vf', name: 'Veggie Fajitas', cuisine: 'Mexican', ingredients: [
    { name: 'Bell Pepper', qty: 2 }, { name: 'Onion', qty: 1 }, { name: 'Flour Tortillas', qty: 1 },
    { name: 'Lime', qty: 1 }, { name: 'Cilantro', qty: 1 },
  ] },
  { id: 'fb', name: 'Falafel Bowl', cuisine: 'Mediterranean', ingredients: [
    { name: 'Chickpeas', qty: 2 }, { name: 'Cucumber', qty: 1 }, { name: 'Feta', qty: 0.5 }, { name: 'Pita Bread', qty: 1 },
  ] },
  { id: 'gsw', name: 'Greek Salad Wrap', cuisine: 'Mediterranean', ingredients: [
    { name: 'Feta', qty: 0.5 }, { name: 'Cucumber', qty: 1 }, { name: 'Tomato', qty: 2 },
    { name: 'Pita Bread', qty: 1 }, { name: 'Olive Oil', qty: 1 },
  ] },
  { id: 'gc', name: 'Green Curry', cuisine: 'Thai', ingredients: [
    { name: 'Coconut Milk', qty: 1 }, { name: 'Bell Pepper', qty: 1 }, { name: 'Zucchini', qty: 1 },
    { name: 'Curry Powder', qty: 1 }, { name: 'Rice', qty: 1 },
  ] },
  { id: 'pt', name: 'Pad Thai', cuisine: 'Thai', ingredients: [
    { name: 'Rice Noodles', qty: 8 }, { name: 'Peanut Butter', qty: 1 }, { name: 'Lime', qty: 1 },
    { name: 'Bell Pepper', qty: 1 }, { name: 'Cilantro', qty: 1 },
  ] },
  { id: 'vc', name: 'Veggie Chili', cuisine: 'American', ingredients: [
    { name: 'Black Beans', qty: 2 }, { name: 'Onion', qty: 1 }, { name: 'Bell Pepper', qty: 1 },
    { name: 'Chili Powder', qty: 1 }, { name: 'Cumin', qty: 1 }, { name: 'Tomato', qty: 2 },
  ] },
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));

export default function MealPlanner() {
  const [servings, setServings] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [openIngredient, setOpenIngredient] = useState<string | null>(null);

  const selectedIds = Object.keys(servings);

  const toggleDish = (id: string) => {
    setServings((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = 2;
      return next;
    });
  };

  const setServingsFor = (id: string, n: number) => {
    setServings((prev) => ({ ...prev, [id]: Math.max(1, Math.min(4, n)) }));
  };

  const { grouped, totalInstances, cuisineCounts } = useMemo(() => {
    const agg = new Map<string, { qty: number; from: { dish: string; qty: number }[] }>();
    let instances = 0;
    const cuisines: Record<string, number> = {};

    for (const id of selectedIds) {
      const dish = DISHES.find((d) => d.id === id);
      if (!dish) continue;
      cuisines[dish.cuisine] = (cuisines[dish.cuisine] ?? 0) + 1;
      const scale = servings[id] / 2;
      for (const ing of dish.ingredients) {
        instances += 1;
        const scaledQty = ing.qty * scale;
        const entry = agg.get(ing.name) ?? { qty: 0, from: [] };
        entry.qty += scaledQty;
        entry.from.push({ dish: dish.name, qty: scaledQty });
        agg.set(ing.name, entry);
      }
    }

    const byCategory: Record<string, { name: string; qty: number; unit: string; from: { dish: string; qty: number }[] }[]> = {};
    for (const cat of CATEGORY_ORDER) byCategory[cat] = [];
    for (const [name, { qty, from }] of agg.entries()) {
      const info = INGREDIENT_INFO[name];
      if (!info) continue;
      byCategory[info.category].push({ name, qty, unit: info.unit, from });
    }
    for (const cat of CATEGORY_ORDER) byCategory[cat].sort((a, b) => a.name.localeCompare(b.name));

    return { grouped: byCategory, totalInstances: instances, cuisineCounts: cuisines };
  }, [servings]);

  const afterCombining = Object.values(grouped).reduce((n, items) => n + items.length, 0) + customItems.length;

  const donutSegments = useMemo(() => {
    const total = Object.values(cuisineCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    let acc = 0;
    return Object.entries(cuisineCounts).map(([cuisine, count]) => {
      const frac = count / total;
      const seg = { cuisine: cuisine as Cuisine, frac, offset: acc };
      acc += frac;
      return seg;
    });
  }, [cuisineCounts]);

  const addCustom = () => {
    const v = customText.trim();
    if (!v) return;
    setCustomItems((prev) => [...prev, v]);
    setCustomText('');
  };

  return (
    <div className="mp">
      <p className="mp-stats">
        <strong>{selectedIds.length}</strong> dishes,{' '}
        <strong>{totalInstances}</strong> ingredients,{' '}
        <strong>{afterCombining}</strong> after combining
      </p>

      <div className="mp-grid">
        <div className="mp-library">
          <div className="mp-libhead">
            <h4>Dish library</h4>
            <svg viewBox="0 0 42 42" className="mp-donut" role="img" aria-label="Cuisine mix of selected dishes">
              <circle cx="21" cy="21" r="15.9" className="mp-donut-track" />
              {donutSegments.map((s) => (
                <circle
                  key={s.cuisine}
                  cx="21" cy="21" r="15.9"
                  fill="none"
                  stroke={CUISINE_COLOR[s.cuisine]}
                  strokeWidth="6"
                  strokeDasharray={`${s.frac * 99.9} ${99.9 - s.frac * 99.9}`}
                  strokeDashoffset={-s.offset * 99.9 + 25}
                  className="mp-donut-seg"
                />
              ))}
            </svg>
          </div>
          <ul className="mp-dishes">
            {DISHES.map((d) => {
              const on = d.id in servings;
              return (
                <li key={d.id} className={`mp-dish${on ? ' is-on' : ''}`} style={{ '--cui': CUISINE_COLOR[d.cuisine] } as React.CSSProperties}>
                  <button className="mp-dishbtn" onClick={() => toggleDish(d.id)} aria-pressed={on}>
                    <span className="mp-cuidot" />
                    <span className="mp-dishname">{d.name}</span>
                    <span className="mp-dishmeta">{d.cuisine} · {d.ingredients.length} items</span>
                  </button>
                  {on && (
                    <div className="mp-servings">
                      <span>Servings</span>
                      <div className="mp-stepper">
                        <button onClick={() => setServingsFor(d.id, servings[d.id] - 1)} aria-label={`Fewer servings of ${d.name}`}>−</button>
                        <output>{servings[d.id]}</output>
                        <button onClick={() => setServingsFor(d.id, servings[d.id] + 1)} aria-label={`More servings of ${d.name}`}>+</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mp-list">
          <h4>Grocery list</h4>
          <div className="mp-listbody">
          {selectedIds.length === 0 && customItems.length === 0 ? (
            <p className="mp-empty">Pick a few dishes to build the list.</p>
          ) : (
            CATEGORY_ORDER.map((cat) =>
              grouped[cat].length > 0 ? (
                <div className="mp-category" key={cat}>
                  <h5>{cat}</h5>
                  <ul>
                    {grouped[cat].map((item) => {
                      const key = `${cat}:${item.name}`;
                      const open = openIngredient === key;
                      const combined = item.from.length > 1;
                      return (
                        <li key={key} className={combined ? 'mp-combined' : ''}>
                          <button
                            className="mp-item"
                            onClick={() => combined && setOpenIngredient(open ? null : key)}
                            aria-expanded={combined ? open : undefined}
                          >
                            <span>{item.name}</span>
                            <span className="mp-qty">{fmt(item.qty)} {item.unit}</span>
                            {combined && <span className="mp-combflag">{item.from.length} dishes</span>}
                          </button>
                          {combined && open && (
                            <ul className="mp-breakdown">
                              {item.from.map((f, i) => (
                                <li key={i}><span>{f.dish}</span><span>{fmt(f.qty)} {item.unit}</span></li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null,
            )
          )}
          {customItems.length > 0 && (
            <div className="mp-category">
              <h5>Custom</h5>
              <ul>{customItems.map((c, i) => <li key={i}><span className="mp-item mp-item-static"><span>{c}</span></span></li>)}</ul>
            </div>
          )}
          </div>
          <div className="mp-addcustom">
            <input
              type="text"
              value={customText}
              placeholder="Add an item not tied to a recipe"
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            />
            <button onClick={addCustom}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
