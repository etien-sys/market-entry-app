import { useState } from 'react';

const PURPLE = '#7c6fe0';
const PURPLE_DIM = 'rgba(124,111,224,0.15)';
const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT; // set in .env to enable submission

const MARKETS = [
  { id: 'UAE', label: 'UAE', sub: 'Dubai · Abu Dhabi' },
  { id: 'CEE', label: 'CEE', sub: 'Sofia · Bucharest · Athens' },
  { id: 'DACH', label: 'DACH', sub: 'Berlin · Vienna · Zurich' },
  { id: 'US', label: 'US', sub: 'New York · San Francisco' },
];

const STAGES = [
  { id: 'Idea', sub: 'Pre-product' },
  { id: 'Early', sub: 'First revenue' },
  { id: 'Growth', sub: 'Scaling' },
  { id: 'Scale', sub: 'Expanding' },
];

function FieldLabel({ children }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
      {children}
    </p>
  );
}

function DarkInput({ value, onChange, placeholder, type = 'text', hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', padding: '13px 14px', boxSizing: 'border-box',
        background: '#0d0d16',
        border: `1.5px solid ${hasError ? '#f87171' : focused ? PURPLE : '#1e1e2e'}`,
        borderRadius: '10px', fontSize: '14px', outline: 'none',
        color: '#e8e8f0', caretColor: PURPLE,
        transition: 'border-color 0.2s', fontFamily: 'inherit',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function DarkTextarea({ value, onChange, placeholder, rows = 3, hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: '100%', padding: '13px 14px',
        background: '#0d0d16',
        border: `1.5px solid ${hasError ? '#f87171' : focused ? PURPLE : '#1e1e2e'}`,
        borderRadius: '10px', fontSize: '14px', lineHeight: '1.6',
        resize: 'vertical', outline: 'none',
        color: '#e8e8f0', caretColor: PURPLE,
        transition: 'border-color 0.2s',
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  function clearError(f) { setErrors(e => ({ ...e, [f]: null })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!market) errs.market = true;
    if (!goal.trim()) errs.goal = true;
    if (!companyIntro.trim()) errs.companyIntro = true;
    if (!stage) errs.stage = true;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const data = {
      market,
      goal: goal.trim(),
      companyIntro: companyIntro.trim(),
      stage,
      name: name.trim(),
      email: email.trim(),
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem('market-entry-intake', JSON.stringify(data));

    // Send to lead capture endpoint if configured
    if (LEAD_ENDPOINT) {
      try {
        await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name || '(not provided)',
            email: data.email || '(not provided)',
            market: data.market,
            stage: data.stage,
            goal: data.goal,
            company: data.companyIntro,
            submittedAt: data.submittedAt,
          }),
        });
      } catch (_) {
        // Don't block the user if submission fails
      }
    }

    onComplete(data);
  }

  return (
    <div style={{ padding: '40px 24px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.8px', lineHeight: '1.15', marginBottom: '10px' }}>
          Where are you going,<br />and why?
        </h1>
        <p style={{ fontSize: '14px', color: '#6b6b85', lineHeight: '1.7' }}>
          Answer four questions — SETI maps the right steps, contacts, and warm intros for your expansion.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Market */}
        <div>
          <FieldLabel>Which market?</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {MARKETS.map(m => {
              const sel = market === m.id;
              return (
                <button key={m.id} type="button" onClick={() => { setMarket(m.id); clearError('market'); }}
                  style={{
                    padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                    border: `1.5px solid ${sel ? PURPLE : errors.market ? '#f87171' : '#1e1e2e'}`,
                    borderRadius: '10px',
                    background: sel ? PURPLE_DIM : '#111119',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: sel ? '#c4befc' : '#e8e8f0', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '11px', color: sel ? '#7c6fe0' : '#4a4a65' }}>{m.sub}</div>
                </button>
              );
            })}
          </div>
          {errors.market && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Please select a market.</p>}
        </div>

        {/* Goal */}
        <div>
          <FieldLabel>What is your goal?</FieldLabel>
          <DarkTextarea value={goal} onChange={e => { setGoal(e.target.value); clearError('goal'); }}
            placeholder="e.g. Find our first 5 enterprise customers in UAE, raise a seed round from Gulf investors..." rows={2} hasError={!!errors.goal} />
          {errors.goal && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Please describe your goal.</p>}
        </div>

        {/* Company intro */}
        <div>
          <FieldLabel>Tell us about your company</FieldLabel>
          <DarkTextarea value={companyIntro} onChange={e => { setCompanyIntro(e.target.value); clearError('companyIntro'); }}
            placeholder="e.g. We build autonomous drone software for logistics companies. Our customers are 3PLs and e-commerce operators. Post-revenue, 3 clients in Europe."
            rows={3} hasError={!!errors.companyIntro} />
          {errors.companyIntro && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Please describe your company.</p>}
          <p style={{ fontSize: '11px', color: '#3a3a52', marginTop: '7px', lineHeight: '1.5' }}>
            Used to personalise your market guide and for warm intro matchmaking.
          </p>
        </div>

        {/* Stage */}
        <div>
          <FieldLabel>Company stage</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {STAGES.map(s => {
              const sel = stage === s.id;
              return (
                <button key={s.id} type="button" onClick={() => { setStage(s.id); clearError('stage'); }}
                  style={{
                    padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                    border: `1.5px solid ${sel ? PURPLE : errors.stage ? '#f87171' : '#1e1e2e'}`,
                    borderRadius: '10px',
                    background: sel ? PURPLE_DIM : '#111119',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: sel ? '#c4befc' : '#e8e8f0', marginBottom: '2px' }}>{s.id}</div>
                  <div style={{ fontSize: '10px', color: sel ? '#7c6fe0' : '#4a4a65' }}>{s.sub}</div>
                </button>
              );
            })}
          </div>
          {errors.stage && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Please select your stage.</p>}
        </div>

        {/* Contact details */}
        <div style={{ padding: '20px', background: '#0d0d16', borderRadius: '12px', border: '1px solid #1e1e2e' }}>
          <FieldLabel>Stay in the loop</FieldLabel>
          <p style={{ fontSize: '13px', color: '#4a4a65', marginBottom: '16px', lineHeight: '1.6' }}>
            Leave your details and our team will reach out with personalised intros and market entry support.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DarkInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
            <DarkInput
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError('email'); }}
              placeholder="Your email address"
              hasError={!!errors.email}
            />
            {errors.email && <p style={{ fontSize: '12px', color: '#f87171', margin: '-4px 0 0' }}>Please enter a valid email address.</p>}
          </div>
          <p style={{ fontSize: '11px', color: '#2a2a3a', marginTop: '10px' }}>Optional — skip if you prefer to explore on your own.</p>
        </div>

        <button type="submit" style={{
          padding: '15px 24px', background: PURPLE, color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
          letterSpacing: '0.2px', marginTop: '4px', transition: 'opacity 0.15s',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Build my market map →
        </button>
      </form>
    </div>
  );
}
