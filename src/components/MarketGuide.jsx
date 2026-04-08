import { buildSteps } from '../utils/guideGenerator';

const STEP_COLORS = ['#7F77DD', '#0D9488', '#D97706', '#F06B6B', '#2563EB'];

export default function MarketGuide({ intake, onNext, onBack }) {
  const steps = buildSteps(intake);
  const marketLabel = intake.market === 'All' ? 'multiple markets' : intake.market;
  const goalSnippet = intake.goal.length > 55 ? intake.goal.slice(0, 52) + '…' : intake.goal;

  return (
    <div style={{ padding: '36px 24px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Market Guide
        </p>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111110', letterSpacing: '-0.6px', lineHeight: '1.2', marginBottom: '14px' }}>
          Your {steps.length}-step plan<br />to enter {marketLabel}
        </h2>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: '8px',
          background: '#fff', border: '1px solid #e5e5e2',
          borderRadius: '8px', padding: '8px 12px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#b8b8b2', textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0 }}>Goal</span>
          <span style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.4' }}>{goalSnippet}</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '32px' }}>
        {steps.map((step, i) => {
          const color = STEP_COLORS[i % STEP_COLORS.length];
          return (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e5e5e2',
              borderLeft: `4px solid ${color}`,
              borderRadius: i === 0 ? '12px 12px 4px 4px' : i === steps.length - 1 ? '4px 4px 12px 12px' : '4px',
              padding: '18px 18px 18px 16px',
              display: 'flex', gap: '14px',
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>
                  {step.icon}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: color, letterSpacing: '0.5px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#111110', lineHeight: '1.3' }}>
                    {step.heading}
                  </p>
                </div>
                <p style={{ fontSize: '13px', color: '#78716c', lineHeight: '1.65' }}>{step.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '12px 18px', border: '1.5px solid #e5e5e2',
          borderRadius: '10px', background: '#fff', color: '#78716c',
          fontSize: '13px', fontWeight: '500',
        }}>← Back</button>
        <button onClick={onNext} style={{
          flex: 1, padding: '13px 20px', background: '#111110', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          See your stakeholder map →
        </button>
      </div>
    </div>
  );
}
