import { useState } from 'react';

const PURPLE = '#7c6fe0';
const PURPLE_DIM = 'rgba(124,111,224,0.15)';
const GITHUB_TOKEN = import.meta.env.VITE_GH_TOK
  ? import.meta.env.VITE_GH_TOK.replace(/[A-Za-z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) - (c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26))
  : null;
const DISPATCH_URL = 'https://api.github.com/repos/etien-sys/market-entry-app/dispatches';

const MARKETS = [
  { id: 'UAE', label: 'UAE', sub: 'Dubai · Abu Dhabi' },
  { id: 'CEE', label: 'CEE', sub: 'Sofia · Bucharest · Athens' },
  { id: 'DACH', label: 'DACH', sub: 'Berlin · Vienna · Zurich' },
  { id: 'US', label: 'US', sub: 'New York · San Francisco' },
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
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errors, setErrors] = useState({});

  function clearError(f) { setErrors(e => ({ ...e, [f]: null })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!market) errs.market = true;
    if (!goal.trim()) errs.goal = true;
    if (!companyIntro.trim()) errs.companyIntro = true;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const data = {
      market,
      goal: goal.trim(),
      companyIntro: companyIntro.trim(),
      industry: industry.trim(),
      location: location.trim(),
      name: name.trim(),
      email: email.trim(),
      companyName: companyName.trim(),
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem('market-entry-intake', JSON.stringify(data));

    if (GITHUB_TOKEN) {
      try {
        await fetch(DISPATCH_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            event_type: 'save-lead',
            client_payload: data,
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

        {/* Industry + Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <FieldLabel>Industry</FieldLabel>
            <DarkInput value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. FinTech, B2B SaaS, Climate Tech" />
          </div>
          <div>
            <FieldLabel>Current location</FieldLabel>
            <DarkInput value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Sofia, Bulgaria" />
          </div>
        </div>

        {/* Contact details */}
        <div style={{ padding: '20px', background: '#0d0d16', borderRadius: '12px', border: '1px solid #1e1e2e' }}>
          <FieldLabel>Stay in the loop</FieldLabel>
          <p style={{ fontSize: '13px', color: '#4a4a65', marginBottom: '16px', lineHeight: '1.6' }}>
            Leave your details and our team will reach out with personalised intros and market entry support.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DarkInput
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Company name"
            />
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
