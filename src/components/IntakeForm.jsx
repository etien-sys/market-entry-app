import { useState } from 'react';

const MARKETS = [
  { id: 'UAE', label: 'UAE', sub: 'Dubai · Abu Dhabi' },
  { id: 'Saudi Arabia', label: 'Saudi Arabia', sub: 'Riyadh · Jeddah' },
  { id: 'CEE', label: 'CEE', sub: 'Sofia · Bucharest · Athens' },
  { id: 'All', label: 'All markets', sub: 'Multi-market entry' },
];

const STAGES = [
  { id: 'Idea', label: 'Idea', sub: 'Pre-product' },
  { id: 'Early', label: 'Early', sub: 'First customers' },
  { id: 'Growth', label: 'Growth', sub: 'Scaling revenue' },
  { id: 'Scale', label: 'Scale', sub: 'Expanding' },
];

function Label({ children }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
      {children}
    </p>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '13px 14px',
        border: `1.5px solid ${hasError ? '#ef4444' : focused ? '#111110' : '#e5e5e2'}`,
        borderRadius: '10px', fontSize: '14px', lineHeight: '1.6',
        resize: 'vertical', outline: 'none', color: '#111110',
        background: '#fff', transition: 'border-color 0.15s',
        fontFamily: 'inherit',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function IntakeForm({ onComplete }) {
  const [market, setMarket] = useState('');
  const [goal, setGoal] = useState('');
  const [companyIntro, setCompanyIntro] = useState('');
  const [stage, setStage] = useState('');
  const [errors, setErrors] = useState({});

  function clearError(field) { setErrors(e => ({ ...e, [field]: null })); }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!market) errs.market = true;
    if (!goal.trim()) errs.goal = true;
    if (!companyIntro.trim()) errs.companyIntro = true;
    if (!stage) errs.stage = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const data = { market, goal: goal.trim(), companyIntro: companyIntro.trim(), stage };
    localStorage.setItem('market-entry-intake', JSON.stringify(data));
    onComplete(data);
  }

  return (
    <div style={{ padding: '36px 24px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#111110', borderRadius: '6px', padding: '4px 10px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Market Entry Navigator
          </span>
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#111110', letterSpacing: '-0.8px', lineHeight: '1.15', marginBottom: '10px' }}>
          Where are you going,<br />and why?
        </h1>
        <p style={{ fontSize: '14px', color: '#78716c', lineHeight: '1.6' }}>
          Answer four questions — we'll map the right steps, contacts, and warm intros for your expansion.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Market */}
        <div>
          <Label>Which market?</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {MARKETS.map((m) => (
              <button key={m.id} type="button"
                onClick={() => { setMarket(m.id); clearError('market'); }}
                style={{
                  padding: '14px 16px', textAlign: 'left',
                  border: `1.5px solid ${market === m.id ? '#111110' : errors.market ? '#ef4444' : '#e5e5e2'}`,
                  borderRadius: '10px',
                  background: market === m.id ? '#111110' : '#fff',
                  color: market === m.id ? '#fff' : '#111110',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '11px', color: market === m.id ? 'rgba(255,255,255,0.55)' : '#78716c' }}>{m.sub}</div>
              </button>
            ))}
          </div>
          {errors.market && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please select a market.</p>}
        </div>

        {/* Goal */}
        <div>
          <Label>What is your goal?</Label>
          <Textarea
            value={goal}
            onChange={e => { setGoal(e.target.value); clearError('goal'); }}
            placeholder="e.g. Find our first 5 enterprise customers in UAE, raise a seed round from Gulf investors..."
            rows={2}
            hasError={!!errors.goal}
          />
          {errors.goal && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please describe your goal.</p>}
        </div>

        {/* Company intro */}
        <div>
          <Label>Tell us about your company</Label>
          <Textarea
            value={companyIntro}
            onChange={e => { setCompanyIntro(e.target.value); clearError('companyIntro'); }}
            placeholder="e.g. We build autonomous drone software for logistics companies. Our customers are 3PLs and e-commerce operators. Post-revenue, 3 clients in Europe."
            rows={3}
            hasError={!!errors.companyIntro}
          />
          {errors.companyIntro && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please describe your company.</p>}
          <p style={{ fontSize: '11px', color: '#b8b8b2', marginTop: '6px', lineHeight: '1.5' }}>
            Used to personalise your market guide and for warm intro matchmaking — the more specific, the better.
          </p>
        </div>

        {/* Stage */}
        <div>
          <Label>Company stage</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {STAGES.map((s) => (
              <button key={s.id} type="button"
                onClick={() => { setStage(s.id); clearError('stage'); }}
                style={{
                  padding: '12px 8px', textAlign: 'center',
                  border: `1.5px solid ${stage === s.id ? '#111110' : errors.stage ? '#ef4444' : '#e5e5e2'}`,
                  borderRadius: '10px',
                  background: stage === s.id ? '#111110' : '#fff',
                  color: stage === s.id ? '#fff' : '#111110',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '10px', color: stage === s.id ? 'rgba(255,255,255,0.55)' : '#78716c' }}>{s.sub}</div>
              </button>
            ))}
          </div>
          {errors.stage && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please select your stage.</p>}
        </div>

        <button type="submit" style={{
          padding: '15px 24px', background: '#111110', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
          letterSpacing: '0.2px', transition: 'opacity 0.15s', marginTop: '4px',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Build my market map →
        </button>
      </form>
    </div>
  );
}
