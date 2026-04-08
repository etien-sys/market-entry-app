const SERVICES = [
  { icon: '🎤', title: 'Stage & media presence', description: 'We position you on the right event stages — local and global — and place you in the media outlets your clients and investors actually read.' },
  { icon: '🏛️', title: 'Lead gen experiences', description: 'We design and run experiences that put you in the room with your target clients and investors — not cold outreach, but warm rooms where deals get started.' },
  { icon: '🔗', title: 'Warm introductions', description: 'We make personal intros to the right people in our network, briefed on your context before you meet.' },
  { icon: '📈', title: 'Sales & marketing strategy', description: 'We build your go-to-market motion for the market you\'re entering — positioning, ICP, messaging, and channel mix that fits the local buyer.' },
  { icon: '⚙️', title: 'RevOps', description: 'Pipeline design, CRM setup, and revenue processes built to scale — so your team closes faster and loses less in the handoffs.' },
  { icon: '✍️', title: 'ContentOps', description: 'A content engine that builds your authority in the new market — thought leadership, case studies, and distribution that generate inbound.' },
];

const ADVISORS = [
  {
    initials: 'SV', name: 'Slavena', focus: 'Market Entry & BD',
    bio: 'Connects companies with the right decision-makers across UAE, CEE, and beyond.',
    color: '#7F77DD', calendly: 'https://calendly.com',
  },
  {
    initials: 'ET', name: 'Etien', focus: 'Strategy & Investors',
    bio: 'Helps founders sharpen their story and get in front of the right investors and partners.',
    color: '#0D9488', calendly: 'https://calendly.com',
  },
];

export default function WorkWithUs({ intake, onBack, onRestart }) {
  return (
    <div style={{ padding: '36px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Work With Us
        </p>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111110', letterSpacing: '-0.6px', lineHeight: '1.2', marginBottom: '10px' }}>
          How we accelerate<br />your entry
        </h2>
        <p style={{ fontSize: '14px', color: '#78716c', lineHeight: '1.6' }}>
          We don't do generic consulting. Here's exactly what we do for {intake.stage}-stage companies entering {intake.market === 'All' ? 'new markets' : intake.market}.
        </p>
      </div>

      {/* Services grid — 2 col on wider screens */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '8px',
        marginBottom: '36px',
      }}>
        {SERVICES.map((s, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #e5e5e2',
            borderLeft: '4px solid #111110', borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: '#f5f5f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '16px', marginBottom: '12px',
            }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#111110', marginBottom: '6px' }}>{s.title}</p>
            <p style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.6' }}>{s.description}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e5e5e2', marginBottom: '28px' }} />

      {/* Advisors */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111110', marginBottom: '5px' }}>Meet the advisors</h3>
        <p style={{ fontSize: '13px', color: '#78716c' }}>Two senior operators with networks across UAE, CEE, and global investor circles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '36px' }}>
        {ADVISORS.map((a, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #e5e5e2',
            borderTop: `4px solid ${a.color}`, borderRadius: '12px',
            padding: '22px 18px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: '10px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: a.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '800', letterSpacing: '1px',
            }}>
              {a.initials}
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111110', marginBottom: '2px' }}>{a.name}</p>
              <p style={{ fontSize: '10px', fontWeight: '700', color: a.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{a.focus}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.55', flex: 1 }}>{a.bio}</p>
            <a href={a.calendly} target="_blank" rel="noreferrer" style={{
              display: 'block', width: '100%', padding: '9px 16px', textAlign: 'center',
              background: a.color, color: '#fff', borderRadius: '8px',
              fontSize: '12px', fontWeight: '700',
            }}>
              Book a call
            </a>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '12px 18px', border: '1.5px solid #e5e5e2',
          borderRadius: '10px', background: '#fff', color: '#78716c',
          fontSize: '13px', fontWeight: '500',
        }}>← Back</button>
        <button onClick={onRestart} style={{
          flex: 1, padding: '12px 20px', background: '#fff', color: '#111110',
          border: '1.5px solid #111110', borderRadius: '10px',
          fontSize: '13px', fontWeight: '600',
        }}>Start over</button>
      </div>
    </div>
  );
}
