const STEPS = ['Your Journey', 'Market Guide', 'Stakeholder Map', 'Work With Us'];
const PURPLE = '#7c6fe0';

export default function StepIndicator({ currentStep }) {
  return (
    <div style={{ padding: '24px 24px 0', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {STEPS.map((_, i) => {
          const done = (i + 1) < currentStep;
          const active = (i + 1) === currentStep;
          return (
            <div key={i} style={{
              flex: 1, height: '2px', borderRadius: '2px',
              background: done || active ? PURPLE : '#1e1e2e',
              opacity: done ? 0.5 : 1,
              transition: 'background 0.3s',
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STEPS.map((label, i) => {
          const active = (i + 1) === currentStep;
          const done = (i + 1) < currentStep;
          return (
            <span key={i} style={{
              fontSize: '10px',
              fontWeight: active ? '700' : '400',
              color: active ? '#e8e8f0' : done ? PURPLE : '#3a3a52',
              textTransform: 'uppercase',
              letterSpacing: active ? '0.4px' : '0',
            }}>
              {done ? '✓ ' : ''}{label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
