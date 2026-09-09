import { useMemo, useState } from 'react';

/**
 * Walks a synthetic lead list through the outreach pipeline, with and without
 * the validation step that was missing from the original build.
 */

type Lead = {
  company: string;
  domain: string;
  contact: string;
  status: 'valid' | 'nxdomain' | 'fabricated' | 'wrong-person';
};

const LEADS: Lead[] = [
  { company: 'Harbourline Foods', domain: 'harbourline.example', contact: 'Facilities Lead', status: 'valid' },
  { company: 'Verity Campus Group', domain: 'veritycampus.example', contact: 'Ops Director', status: 'nxdomain' },
  { company: 'Northgate Union', domain: 'northgate-union.example', contact: 'Auxiliary Services', status: 'valid' },
  { company: 'Piedmont Health', domain: 'piedmonthealth.example', contact: 'VP Marketing', status: 'wrong-person' },
  { company: 'Ashford Labs', domain: 'ashfordlabs-inc.example', contact: 'Workplace Manager', status: 'fabricated' },
  { company: 'Cobalt Works', domain: 'cobaltworks.example', contact: 'Office Manager', status: 'valid' },
  { company: 'Ridgeway Institute', domain: 'ridgeway-edu.example', contact: 'Dining Services', status: 'nxdomain' },
  { company: 'Lantern Manufacturing', domain: 'lanternmfg.example', contact: 'Plant Ops', status: 'valid' },
];

const LABEL: Record<Lead['status'], string> = {
  valid: 'Deliverable',
  nxdomain: 'Dead DNS record',
  fabricated: 'Fabricated domain',
  'wrong-person': 'Wrong role at company',
};

export default function OutreachPipeline() {
  const [validate, setValidate] = useState(false);

  const rows = useMemo(
    () =>
      LEADS.map((l) => {
        const blocked = validate && l.status !== 'valid' && l.status !== 'wrong-person';
        return { ...l, blocked };
      }),
    [validate],
  );

  const sent = rows.filter((r) => !r.blocked).length;
  const reachedIntended = rows.filter((r) => !r.blocked && r.status === 'valid').length;
  const wasted = sent - reachedIntended;

  return (
    <div className="op">
      <div className="op-stages" aria-hidden="true">
        {['Source', 'Enrich', validate ? 'Validate' : 'Validate (missing)', 'Generate', 'Send'].map((s, i) => (
          <span key={i} className={`op-stage${s.includes('missing') ? ' gap' : ''}${s === 'Validate' ? ' added' : ''}`}>
            {s}
          </span>
        ))}
      </div>

      <label className="op-toggle">
        <input type="checkbox" checked={validate} onChange={(e) => setValidate(e.target.checked)} />
        <span>
          Add domain validation before send
          <em>The gate that was missing from the original pipeline.</em>
        </span>
      </label>

      <table className="op-table">
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Domain</th>
            <th scope="col">Contact</th>
            <th scope="col">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.company} className={r.blocked ? 'blocked' : r.status === 'valid' ? '' : 'bad'}>
              <td>{r.company}</td>
              <td className="mono">{r.domain}</td>
              <td>{r.contact}</td>
              <td>{r.blocked ? `Held — ${LABEL[r.status].toLowerCase()}` : LABEL[r.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="op-stats">
        <div><dt>Emails sent</dt><dd>{sent}</dd></div>
        <div><dt>Reached intended recipient</dt><dd>{reachedIntended}</dd></div>
        <div className="accent"><dt>Wasted sends</dt><dd>{wasted}</dd></div>
      </dl>

      <p className="op-note">
        Validation does not fix the wrong-role sends. Those need a defined ICP and
        qualification criteria, which is the upstream half of the same problem.
      </p>
    </div>
  );
}
