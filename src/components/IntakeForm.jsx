import { useState } from 'react';

const MARKETS = ['UAE', 'Saudi Arabia', 'CEE', 'All'];
const STAGES = ['Idea', 'Early', 'Growth', 'Scale'];

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151',
        marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</p>}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3, hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '12px 14px',
        border: `1.5px solid ${hasError ? '#ef4444' : focused ? '#1a1a1a' : '#e5e7eb'}`,
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5',
        resize: 'vertical',
        outline: 'none',
        color: '#1a1a1a',
        background: '#fff',
        transition: 'border-color 0.15s',
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

  function clearError(field) {
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!market) newErrors.market = 'Please select a market.';
    if (!goal.trim()) newErrors.goal = 'Please describe your goal.';
    if (!companyIntro.trim()) newErrors.companyIntro = 'Please tell us about your company.';
    if (!stage) newErrors.stage = 'Please select your stage.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const data = { market, goal: goal.trim(), companyIntro: companyIntro.trim(), stage };
    localStorage.setItem('market-entry-intake', JSON.stringify(data));
    onComplete(data);
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Market Entry Navigator
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
          Tell us about your company and goal — we'll map the right steps, contacts, and intros for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Market */}
        <Field label="Which market?" error={errors.market}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {MARKETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMarket(m); clearError('market'); }}
                style={{
                  padding: '12px 16px',
                  border: `1.5px solid ${market === m ? '#1a1a1a' : errors.market ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: market === m ? '#1a1a1a' : '#fff',
                  color: market === m ? '#fff' : '#374151',
                  fontSize: '14px',
                  fontWeight: market === m ? '600' : '400',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        {/* Goal */}
        <Field label="What is your goal?" error={errors.goal}>
          <TextArea
            value={goal}
            onChange={(e) => { setGoal(e.target.value); clearError('goal'); }}
            placeholder="e.g. Find our first 5 enterprise customers in UAE, raise a seed round from Gulf investors..."
            rows={2}
            hasError={!!errors.goal}
          />
        </Field>

        {/* Company intro */}
        <Field label="Tell us about your company" error={errors.companyIntro}>
          <TextArea
            value={companyIntro}
            onChange={(e) => { setCompanyIntro(e.target.value); clearError('companyIntro'); }}
            placeholder="e.g. We build autonomous drone software for logistics companies. Our customers are 3PLs and e-commerce operators. We're post-revenue with 3 paying clients in Europe."
            rows={3}
            hasError={!!errors.companyIntro}
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', lineHeight: '1.5' }}>
            Used to personalise your market guide and for warm intro matchmaking — the more specific, the better.
          </p>
        </Field>

        {/* Stage */}
        <Field label="What stage is your company?" error={errors.stage}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStage(s); clearError('stage'); }}
                style={{
                  padding: '12px 8px',
                  border: `1.5px solid ${stage === s ? '#1a1a1a' : errors.stage ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: stage === s ? '#1a1a1a' : '#fff',
                  color: stage === s ? '#fff' : '#374151',
                  fontSize: '13px',
                  fontWeight: stage === s ? '600' : '400',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <button
          type="submit"
          style={{
            padding: '14px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'opacity 0.15s',
            marginTop: '4px',
          }}
          onMouseOver={(e) => { e.target.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.target.style.opacity = '1'; }}
        >
          Start my journey →
        </button>
      </form>
    </div>
  );
}
