const STEPS = ['Your Journey', 'Market Guide', 'Stakeholder Map', 'Work With Us'];

export default function StepIndicator({ currentStep }) {
  return (
    <div style={{
      padding: '20px 24px 0',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '10px' }}>
        {STEPS.map((_, i) => {
          const done = (i + 1) < currentStep;
          const active = (i + 1) === currentStep;
          return (
            <div key={i} style={{
              flex: 1,
              height: '3px',
              background: done ? '#111110' : active ? '#111110' : '#e5e5e2',
              borderRadius: '2px',
              marginRight: i < STEPS.length - 1 ? '4px' : '0',
              opacity: active ? 1 : done ? 1 : 0.4,
            }} />
          );
        })}
      </div>

      {/* Labels row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STEPS.map((label, i) => {
          const active = (i + 1) === currentStep;
          const done = (i + 1) < currentStep;
          return (
            <span key={i} style={{
              fontSize: '10px',
              fontWeight: active ? '700' : '400',
              color: active ? '#111110' : done ? '#78716c' : '#b8b8b2',
              letterSpacing: active ? '0.3px' : '0',
              textTransform: 'uppercase',
            }}>
              {done ? '✓ ' : ''}{label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
