import { useMemo, useState } from 'react';

/**
 * Synthetic training history. Sessions are generated with a small
 * deterministic PRNG so the demo is identical on every load — none of it is
 * real training data.
 */

type Session = { date: string; weight: number; reps: number; difficulty: number };

const DIFFICULTY_LEVELS = [
  { label: 'Very Easy', color: '#3b82f6' },
  { label: 'Easy', color: '#06b6d4' },
  { label: 'Moderate', color: '#22c55e' },
  { label: 'Somewhat Challenging', color: '#eab308' },
  { label: 'Challenging', color: '#f97316' },
  { label: 'Very Challenging', color: '#ef4444' },
  { label: 'Maximal', color: '#b91c1c' },
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function genHistory(seed: number, startWeight: number, incPerSession: number, repsBase: number): Session[] {
  const rand = rng(seed);
  const sessions: Session[] = [];
  let weight = startWeight;
  const anchor = new Date('2026-09-07T00:00:00Z');
  for (let i = 7; i >= 0; i--) {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() - i * 4);
    const reps = Math.max(4, repsBase + Math.round((rand() - 0.5) * 3));
    const difficulty = Math.min(7, Math.max(1, 3 + Math.round((rand() - 0.35) * 4)));
    sessions.push({ date: d.toISOString().slice(0, 10), weight: Math.round(weight), reps, difficulty });
    weight += incPerSession * (0.5 + rand());
  }
  return sessions;
}

type Exercise = { id: string; name: string; seed: number; startWeight: number; inc: number; repsBase: number };

const DAYS: { day: string; exercises: Exercise[] }[] = [
  { day: 'Chest + Triceps', exercises: [
    { id: 'bench', name: 'Bench Press', seed: 101, startWeight: 135, inc: 2.5, repsBase: 8 },
    { id: 'incline-db', name: 'Incline Dumbbell Press', seed: 102, startWeight: 50, inc: 1.5, repsBase: 10 },
    { id: 'pushdown', name: 'Tricep Pushdown', seed: 103, startWeight: 40, inc: 1.2, repsBase: 12 },
  ] },
  { day: 'Back + Biceps', exercises: [
    { id: 'lat-pulldown', name: 'Lat Pulldown', seed: 201, startWeight: 100, inc: 2, repsBase: 10 },
    { id: 'seated-row', name: 'Seated Row', seed: 202, startWeight: 90, inc: 2, repsBase: 10 },
    { id: 'barbell-curl', name: 'Barbell Curl', seed: 203, startWeight: 45, inc: 1, repsBase: 8 },
  ] },
  { day: 'Legs', exercises: [
    { id: 'squat', name: 'Back Squat', seed: 301, startWeight: 155, inc: 3, repsBase: 6 },
    { id: 'rdl', name: 'Romanian Deadlift', seed: 302, startWeight: 135, inc: 2.5, repsBase: 8 },
    { id: 'leg-press', name: 'Leg Press', seed: 303, startWeight: 220, inc: 5, repsBase: 10 },
  ] },
  { day: 'Shoulders + Arms', exercises: [
    { id: 'ohp', name: 'Overhead Press', seed: 401, startWeight: 85, inc: 1.5, repsBase: 8 },
    { id: 'lateral-raise', name: 'Lateral Raise', seed: 402, startWeight: 15, inc: 0.5, repsBase: 12 },
    { id: 'hammer-curl', name: 'Hammer Curl', seed: 403, startWeight: 30, inc: 1, repsBase: 10 },
  ] },
];

function suggestion(last: Session): { move: string; reason: string } {
  if (last.difficulty <= 2) return { move: 'Add weight', reason: `Last session was rated "${DIFFICULTY_LEVELS[last.difficulty - 1].label}" — there was clearly more in the tank.` };
  if (last.difficulty <= 4) return { move: 'Add reps', reason: `"${DIFFICULTY_LEVELS[last.difficulty - 1].label}" leaves room to add a rep or two before adding load.` };
  if (last.difficulty === 5) return { move: 'Hold', reason: 'Rated "Challenging" — repeat the same weight and reps and see if difficulty drops.' };
  return { move: 'Hold, or deload slightly', reason: `"${DIFFICULTY_LEVELS[last.difficulty - 1].label}" is close to a limit set — consistency matters more than pushing further right now.` };
}

const short = (iso: string) => { const d = new Date(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };

export default function LiftLog() {
  const [dayIdx, setDayIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [logs, setLogs] = useState<Record<string, Session[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [difficulty, setDifficulty] = useState(4);
  const [justAdded, setJustAdded] = useState(false);

  const exercise = DAYS[dayIdx].exercises[exIdx];
  const base = useMemo(() => genHistory(exercise.seed, exercise.startWeight, exercise.inc, exercise.repsBase), [exercise.id]);
  const sessions = [...base, ...(logs[exercise.id] ?? [])];
  const last = sessions[sessions.length - 1];
  const sug = suggestion(last);

  const maxWeight = Math.max(...sessions.map((s) => s.weight)) * 1.15;
  const maxReps = Math.max(...sessions.map((s) => s.reps)) * 1.3;

  const chartW = 480;
  const chartH = 180;
  const padL = 8, padR = 8, padB = 22;
  const barW = (chartW - padL - padR) / sessions.length;

  const linePoints = sessions
    .map((s, i) => {
      const x = padL + barW * (i + 0.5);
      const y = 8 + (1 - s.reps / maxReps) * (chartH - padB - 8);
      return `${x},${y}`;
    })
    .join(' ');

  function selectDay(i: number) {
    setDayIdx(i);
    setExIdx(0);
  }

  function submit() {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!w || !r) return;
    const today = new Date().toISOString().slice(0, 10);
    setLogs((prev) => ({
      ...prev,
      [exercise.id]: [...(prev[exercise.id] ?? []), { date: today, weight: w, reps: r, difficulty }],
    }));
    setWeight('');
    setReps('');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  }

  return (
    <div className="ll">
      <div className="ll-tabs" role="tablist" aria-label="Workout day">
        {DAYS.map((d, i) => (
          <button key={d.day} className={`ll-daytab${i === dayIdx ? ' is-active' : ''}`} onClick={() => selectDay(i)}>
            {d.day}
          </button>
        ))}
      </div>

      <div className="ll-extabs">
        {DAYS[dayIdx].exercises.map((ex, i) => (
          <button key={ex.id} className={`ll-extab${i === exIdx ? ' is-active' : ''}`} onClick={() => setExIdx(i)}>
            {ex.name}
          </button>
        ))}
      </div>

      <div className="ll-chartwrap">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="ll-chart" role="img" aria-label={`${exercise.name} history: weight and reps over time`}>
          {sessions.map((s, i) => {
            const x = padL + barW * i + barW * 0.18;
            const w = barW * 0.64;
            const h = (s.weight / maxWeight) * (chartH - padB - 8);
            const y = chartH - padB - h;
            const isNew = justAdded && i === sessions.length - 1;
            return (
              <rect
                key={i}
                x={x} y={y} width={w} height={h}
                className={`ll-bar${isNew ? ' ll-bar-new' : ''}`}
                fill={DIFFICULTY_LEVELS[s.difficulty - 1].color}
              />
            );
          })}
          <polyline points={linePoints} className="ll-line" fill="none" />
          {sessions.map((s, i) => {
            const x = padL + barW * (i + 0.5);
            const y = 8 + (1 - s.reps / maxReps) * (chartH - padB - 8);
            return <circle key={i} cx={x} cy={y} r="2.6" className="ll-linedot" />;
          })}
          {sessions.map((s, i) => (
            <text key={i} x={padL + barW * (i + 0.5)} y={chartH - 6} className="ll-xlabel" textAnchor="middle">
              {short(s.date)}
            </text>
          ))}
        </svg>
        <ul className="ll-legend">
          <li><i className="ll-sw-bar" />Weight per set</li>
          <li><i className="ll-sw-line" />Reps (line)</li>
        </ul>
      </div>

      <div className="ll-logform">
        <div className="ll-field">
          <span>Weight</span>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={`${last.weight}`} />
        </div>
        <div className="ll-field">
          <span>Reps</span>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={`${last.reps}`} />
        </div>
        <div className="ll-field ll-field-wide">
          <span>Difficulty</span>
          <div className="ll-diffpicker">
            {DIFFICULTY_LEVELS.map((lvl, i) => (
              <button
                key={lvl.label}
                className={`ll-difbtn${difficulty === i + 1 ? ' is-active' : ''}`}
                style={{ '--dc': lvl.color } as React.CSSProperties}
                onClick={() => setDifficulty(i + 1)}
                title={lvl.label}
                aria-label={lvl.label}
                aria-pressed={difficulty === i + 1}
              />
            ))}
          </div>
          <span className="ll-diflabel">{DIFFICULTY_LEVELS[difficulty - 1].label}</span>
        </div>
        <button className="ll-submit" onClick={submit}>Log set</button>
      </div>

      <div className="ll-suggest">
        <span className="ll-suglabel">Planned feature — not shipped yet</span>
        <p><strong>Next session: {sug.move}.</strong> {sug.reason}</p>
      </div>
    </div>
  );
}
