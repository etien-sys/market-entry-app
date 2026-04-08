import { buildSteps } from '../utils/guideGenerator';

function StepCard({ number, icon, heading, body, borderColor }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      borderLeft: `3px solid ${borderColor}`,
      padding: '18px 18px 18px 16px',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#d1d5db' }}>{number}</span>
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px', lineHeight: '1.3' }}>
          {heading}
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>{body}</p>
      </div>
    </div>
  );
}

const STEP_COLORS = ['#7F77DD', '#0D9488', '#D97706', '#F06B6B', '#2563EB'];

export default function MarketGuide({ intake, onNext, onBack }) {
  const steps = buildSteps(intake);
  const marketLabel = intake.market === 'All' ? 'multiple markets' : intake.market;

  // Derive a short title from the goal
  const goalSnippet = intake.goal.length > 60 ? intake.goal.slice(0, 57) + '…' : intake.goal;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Market Guide
        </p>
        <h2 style={{ fontSize: '21px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: '1.3', marginBottom: '8px' }}>
          {steps.length} steps to enter {marketLabel}
        </h2>
        {/* Show their goal back to them */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#f5f5f5', borderRadius: '6px', padding: '5px 10px',
        }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Goal</span>
          <span style={{ fontSize: '12px', color: '#4b5563' }}>{goalSnippet}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
        {steps.map((step, i) => (
          <StepCard
            key={i}
            number={`0${i + 1}`}
            icon={step.icon}
            heading={step.heading}
            body={step.body}
            borderColor={STEP_COLORS[i % STEP_COLORS.length]}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 20px', border: '1.5px solid #e5e7eb',
            borderRadius: '8px', background: '#fff', color: '#374151',
            fontSize: '14px', fontWeight: '500',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1, padding: '12px 24px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          See your stakeholder map →
        </button>
      </div>
    </div>
  );
}
