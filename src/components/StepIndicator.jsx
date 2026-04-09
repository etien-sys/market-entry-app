const STEPS = ['Journey', 'Market Guide', 'Stakeholder Map', 'Work With Us'];
const PURPLE = '#7c6fe0';

function SetiLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingTop: '20px' }}>
      {/* Crescent + star mark */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer octagon frame */}
        <polygon points="9,1 19,1 27,9 27,19 19,27 9,27 1,19 1,9"
          fill="none" stroke={PURPLE} strokeWidth="1" opacity="0.4" />
        {/* Crescent */}
        <path d="M14 6 A8 8 0 1 0 14 22 A5.5 5.5 0 1 1 14 6Z"
          fill={PURPLE} opacity="0.9" />
        {/* Small star dot */}
        <circle cx="19" cy="10" r="1.5" fill={PURPLE} opacity="0.7" />
      </svg>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.3px' }}>SETI</span>
          <span style={{ fontSize: '10px', color: '#3a3a52', fontWeight: '500' }}>
            Strategy · Entry · Trust · Intelligence
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StepIndicator({ currentStep }) {
  return (
    <div style={{ padding: '0 24px', maxWidth: '600px', margin: '0 auto' }}>
      <SetiLogo />

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {STEPS.map((_, i) => {
          const done = (i + 1) < currentStep;
          const active = (i + 1) === currentStep;
          return (
            <div key={i} style={{
              flex: 1, height: '2px', borderRadius: '2px',
              background: done || active ? PURPLE : '#1e1e2e',
              opacity: done ? 0.45 : 1,
              transition: 'background 0.3s',
            }} />
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
        {STEPS.map((label, i) => {
          const active = (i + 1) === currentStep;
          const done = (i + 1) < currentStep;
          return (
            <span key={i} style={{
              fontSize: '10px',
              fontWeight: active ? '700' : '400',
              color: active ? '#e8e8f0' : done ? PURPLE : '#3a3a52',
              textTransform: 'uppercase', letterSpacing: active ? '0.4px' : '0',
            }}>
              {done ? '✓ ' : ''}{label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
