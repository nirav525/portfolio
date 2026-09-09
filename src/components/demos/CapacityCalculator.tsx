import { useMemo, useState } from 'react';

/**
 * Turns fleet size into required field hours and headcount.
 * All unit rates are illustrative, not employer figures.
 */

const HOURLY = 26; // illustrative loaded hourly rate

function model(
  machines: number,
  visitsPerWeek: number,
  serviceMin: number,
  driveMinPerStop: number,
  shiftHours: number,
) {
  // Density: each doubling of fleet size in a fixed service area shortens the
  // average leg between stops. Modelled as a decay against a 15-machine base.
  const density = Math.pow(15 / Math.max(machines, 1), 0.32);
  const effectiveDrive = driveMinPerStop * density;
  const minutesPerStop = serviceMin + effectiveDrive;
  const stopsPerMonth = machines * visitsPerWeek * 4.33;
  const hoursPerMonth = (stopsPerMonth * minutesPerStop) / 60;
  const hoursPerTech = shiftHours * 21.7;
  return {
    hoursPerMonth,
    headcount: hoursPerMonth / hoursPerTech,
    hoursPerMachine: hoursPerMonth / Math.max(machines, 1),
    costPerMachine: (hoursPerMonth * HOURLY) / Math.max(machines, 1),
    effectiveDrive,
  };
}

export default function CapacityCalculator() {
  const [machines, setMachines] = useState(25);
  const [visits, setVisits] = useState(2);
  const [serviceMin, setServiceMin] = useState(18);
  const [driveMin, setDriveMin] = useState(24);
  const [shiftHours, setShiftHours] = useState(8);

  const now = useMemo(
    () => model(machines, visits, serviceMin, driveMin, shiftHours),
    [machines, visits, serviceMin, driveMin, shiftHours],
  );

  const curve = useMemo(() => {
    const pts: { m: number; heads: number; perMachine: number }[] = [];
    for (let m = 10; m <= 100; m += 5) {
      const r = model(m, visits, serviceMin, driveMin, shiftHours);
      pts.push({ m, heads: r.headcount, perMachine: r.hoursPerMachine });
    }
    return pts;
  }, [visits, serviceMin, driveMin, shiftHours]);

  const maxHeads = Math.max(...curve.map((p) => p.heads), 1);
  const W = 320;
  const H = 150;
  const px = (m: number) => ((m - 10) / 90) * (W - 34) + 30;
  const py = (h: number) => H - 22 - (h / maxHeads) * (H - 34);

  return (
    <div className="cc">
      <div className="cc-grid">
        <div>
          <Field label="Fleet size" value={machines} min={10} max={100} step={5} suffix=" machines" onChange={setMachines} />
          <Field label="Visits per machine" value={visits} min={1} max={4} suffix=" / week" onChange={setVisits} />
          <Field label="Service time per stop" value={serviceMin} min={8} max={40} suffix=" min" onChange={setServiceMin} />
          <Field label="Drive time per stop at 15 machines" value={driveMin} min={8} max={45} suffix=" min" onChange={setDriveMin} />
          <Field label="Shift length" value={shiftHours} min={6} max={10} suffix=" hrs" onChange={setShiftHours} />
        </div>

        <div>
          <dl className="cc-stats">
            <Stat label="Field hours / month" value={Math.round(now.hoursPerMonth).toLocaleString()} />
            <Stat label="Technicians required" value={now.headcount.toFixed(1)} accent />
            <Stat label="Hours per machine" value={now.hoursPerMachine.toFixed(1)} />
            <Stat label="Cost per machine" value={`$${Math.round(now.costPerMachine)}`} sub="illustrative rate" />
          </dl>

          <div className="cc-chart">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Technicians required as fleet size grows from 10 to 100 machines">
              <line x1="30" y1={H - 22} x2={W - 4} y2={H - 22} stroke="#c3c9c2" strokeWidth="1" />
              <line x1="30" y1="12" x2="30" y2={H - 22} stroke="#c3c9c2" strokeWidth="1" />

              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <line x1="30" y1={py(maxHeads * f)} x2={W - 4} y2={py(maxHeads * f)} stroke="#e6e9e4" strokeWidth="1" />
                  <text x="26" y={py(maxHeads * f) + 3} textAnchor="end" fontSize="8" fill="#8b98a2">
                    {(maxHeads * f).toFixed(0)}
                  </text>
                </g>
              ))}

              <polyline
                points={curve.map((p) => `${px(p.m)},${py(p.heads)}`).join(' ')}
                fill="none"
                stroke="#14675a"
                strokeWidth="1.8"
              />
              <circle cx={px(machines)} cy={py(now.headcount)} r="3.4" fill="#14675a" />

              {[10, 40, 70, 100].map((m) => (
                <text key={m} x={px(m)} y={H - 8} textAnchor="middle" fontSize="8" fill="#8b98a2">
                  {m}
                </text>
              ))}
              <text x={W / 2} y={H - 0.5} textAnchor="middle" fontSize="8" fill="#8b98a2">
                machines in fleet
              </text>
            </svg>
          </div>

          <p className="cc-note">
            Headcount rises sublinearly with fleet size: adding machines in an
            existing service area shortens the average leg between stops, so
            drive time per stop falls as density rises. At the current settings
            the average leg is {now.effectiveDrive.toFixed(0)} minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, min, max, step = 1, suffix = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="cc-field">
      <span className="cc-field-top">
        <span>{label}</span>
        <output>{value}{suffix}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`cc-stat${accent ? ' accent' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub && <p>{sub}</p>}
    </div>
  );
}
