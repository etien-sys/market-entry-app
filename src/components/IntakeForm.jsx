import { useState } from 'react';

const MARKETS = ['UAE', 'Saudi Arabia', 'CEE', 'All'];
const STAGES = ['Idea', 'Early', 'Growth', 'Scale'];

export default function IntakeForm({ onComplete }) {
  const [market, setMarket] = useState('');
  const [goal, setGoal] = useState('');
  const [stage, setStage] = useState('');
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!market) newErrors.market = true;
    if (!goal.trim()) newErrors.goal = true;
    if (!stage) newErrors.stage = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const data = { market, goal: goal.trim(), stage };
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
          Tell us about your expansion goal — we'll map the right contacts and insights for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Market */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Which market?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {MARKETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMarket(m); setErrors((e) => ({ ...e, market: false })); }}
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
          {errors.market && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please select a market.</p>}
        </div>

        {/* Goal */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            What is your goal?
          </label>
          <textarea
            value={goal}
            onChange={(e) => { setGoal(e.target.value); setErrors((er) => ({ ...er, goal: false })); }}
            placeholder="e.g. Find investors in UAE, expand our enterprise sales, meet media partners..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: `1.5px solid ${errors.goal ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical',
              outline: 'none',
              color: '#1a1a1a',
              background: '#fff',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#1a1a1a'; }}
            onBlur={(e) => { e.target.style.borderColor = errors.goal ? '#ef4444' : '#e5e7eb'; }}
          />
          {errors.goal && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please describe your goal.</p>}
        </div>

        {/* Stage */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            What stage is your company?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStage(s); setErrors((e) => ({ ...e, stage: false })); }}
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
          {errors.stage && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Please select your stage.</p>}
        </div>

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
