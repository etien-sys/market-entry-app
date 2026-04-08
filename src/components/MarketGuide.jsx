import { buildSteps } from '../utils/guideGenerator';

const STEP_COLORS = ['#9d94f0', '#34d399', '#fbbf24', '#f87171', '#60a5fa'];

export default function MarketGuide({ intake, onNext, onBack }) {
  const steps = buildSteps(intake);
  const marketLabel = intake.market === 'All' ? 'multiple markets' : intake.market;
  const goalSnippet = intake.goal.length > 55 ? intake.goal.slice(0, 52) + '…' : intake.goal;

  return (
    <div style={{ padding: '40px 24px 40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Market Guide
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.7px', lineHeight: '1.2', marginBottom: '16px' }}>
          Your {steps.length}-step plan<br />to enter {marketLabel}
        </h2>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: '8px',
          background: '#111119', border: '1px solid #1e1e2e',
          borderRadius: '8px', padding: '8px 12px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#3a3a52', textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0 }}>Goal</span>
          <span style={{ fontSize: '12px', color: '#6b6b85', lineHeight: '1.4' }}>{goalSnippet}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '32px' }}>
        {steps.map((step, i) => {
          const color = STEP_COLORS[i % STEP_COLORS.length];
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} style={{
              background: '#111119',
              border: '1px solid #1e1e2e',
              borderLeft: `4px solid ${color}`,
              borderRadius: isFirst ? '12px 12px 4px 4px' : isLast ? '4px 4px 12px 12px' : '4px',
              padding: '18px 18px 18px 16px',
              display: 'flex', gap: '14px',
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>
                  {step.icon}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color, letterSpacing: '0.5px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0', lineHeight: '1.3' }}>
                    {step.heading}
                  </p>
                </div>
                <p style={{ fontSize: '13px', color: '#6b6b85', lineHeight: '1.7' }}>{step.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '12px 18px', border: '1px solid #1e1e2e',
          borderRadius: '10px', background: 'transparent', color: '#6b6b85',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer',
        }}>← Back</button>
        <button onClick={onNext} style={{
          flex: 1, padding: '13px 20px', background: '#7c6fe0', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          See your stakeholder map →
        </button>
      </div>
    </div>
  );
}
