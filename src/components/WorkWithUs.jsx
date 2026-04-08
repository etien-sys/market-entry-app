const SERVICES = [
  {
    icon: '🎤',
    title: 'Stage & media presence',
    description:
      'We position you on the right event stages — local and global — and place you in the media outlets your clients and investors actually read.',
  },
  {
    icon: '🏛️',
    title: 'Lead gen experiences',
    description:
      'We design and run experiences that put you in the room with your target clients and investors — not cold outreach, but warm rooms where deals get started.',
  },
  {
    icon: '🔗',
    title: 'Warm introductions',
    description:
      'We make personal intros to the right people in our network, briefed on your context before you meet.',
  },
];

const ADVISORS = [
  {
    initials: 'SV',
    name: 'Slavena',
    focus: 'Market Entry & BD',
    bio: 'Connects companies with the right decision-makers across UAE, CEE, and beyond.',
    color: '#7F77DD',
    calendly: 'https://calendly.com',
  },
  {
    initials: 'ET',
    name: 'Etien',
    focus: 'Strategy & Investors',
    bio: 'Helps founders sharpen their story and get in front of the right investors and partners.',
    color: '#0D9488',
    calendly: 'https://calendly.com',
  },
];

function ServiceCard({ icon, title, description }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      borderLeft: '3px solid #1a1a1a',
      padding: '20px',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        marginBottom: '12px',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.55' }}>{description}</p>
    </div>
  );
}

function AdvisorCard({ initials, name, focus, bio, color, calendly }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      borderTop: `3px solid ${color}`,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700',
        letterSpacing: '1px',
      }}>
        {initials}
      </div>
      <div>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '2px' }}>{name}</p>
        <p style={{ fontSize: '12px', fontWeight: '600', color: color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{focus}</p>
      </div>
      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.55' }}>{bio}</p>
      <a
        href={calendly}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          padding: '9px 20px',
          background: color,
          color: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
          marginTop: '4px',
        }}
      >
        Book a call
      </a>
    </div>
  );
}

export default function WorkWithUs({ intake, onBack, onRestart }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px 60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Work With Us
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: '8px' }}>
          How we accelerate your entry
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
          We don't do generic consulting. Here's exactly what we do for companies entering new markets.
        </p>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
        {SERVICES.map((s, i) => (
          <ServiceCard key={i} {...s} />
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: '28px' }} />

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>Meet the advisors</h3>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Two senior operators with networks across UAE, CEE, and global investor circles.</p>
      </div>

      {/* Advisor cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '36px',
      }}>
        {ADVISORS.map((a, i) => (
          <AdvisorCard key={i} {...a} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 20px',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onRestart}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: '#fff',
            color: '#1a1a1a',
            border: '1.5px solid #1a1a1a',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
