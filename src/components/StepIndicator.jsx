const STEPS = ['Your Journey', 'Market Guide', 'Stakeholder Map', 'Work With Us'];

export default function StepIndicator({ currentStep }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0',
      padding: '24px 20px 0',
      maxWidth: '640px',
      margin: '0 auto',
    }}>
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isActive ? '#1a1a1a' : isDone ? '#1a1a1a' : '#e5e7eb',
                color: isActive || isDone ? '#fff' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                flexShrink: 0,
              }}>
                {isDone ? '✓' : stepNum}
              </div>
              <span style={{
                fontSize: '11px',
                color: isActive ? '#1a1a1a' : '#9ca3af',
                fontWeight: isActive ? '600' : '400',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: '1px',
                background: isDone ? '#1a1a1a' : '#e5e7eb',
                margin: '0 8px',
                marginBottom: '20px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
