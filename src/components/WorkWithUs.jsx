import { DEFAULT_REPS, REPS } from '../config/reps';

const PURPLE = '#7c6fe0';

const SERVICES = [
  { icon: '🎤', title: 'Stage & media presence', description: 'We position you on the right event stages — local and global — and place you in the media outlets your clients and investors actually read.' },
  { icon: '🏛️', title: 'Lead gen experiences', description: 'We design and run experiences that put you in the room with your target clients and investors — not cold outreach, but warm rooms where deals get started.' },
  { icon: '🔗', title: 'Warm introductions', description: 'We make personal intros to the right people in our network, briefed on your context before you meet.' },
  { icon: '📈', title: 'Sales & marketing strategy', description: 'We build your go-to-market motion for the market you\'re entering — positioning, ICP, messaging, and channel mix that fits the local buyer.' },
  { icon: '⚙️', title: 'RevOps', description: 'Pipeline design, CRM setup, and revenue processes built to scale — so your team closes faster and loses less in the handoffs.' },
  { icon: '✍️', title: 'ContentOps', description: 'A content engine that builds your authority in the new market — thought leadership, case studies, and distribution that generate inbound.' },
];

export default function WorkWithUs({ intake, onBack, onRestart, rep }) {
  const advisors = rep ? [rep, REPS.etien] : DEFAULT_REPS;
  return (
    <div style={{ padding: '40px 24px 60px' }}>
      <div style={{ marginBottom: '36px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Work With Us
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.7px', lineHeight: '1.2', marginBottom: '12px' }}>
          How we accelerate<br />your entry
        </h2>
        <p style={{ fontSize: '14px', color: '#6b6b85', lineHeight: '1.7' }}>
          We don't do generic consulting. Here's exactly what we do for companies entering {intake.market === 'All' ? 'new markets' : intake.market}.
        </p>
      </div>

      {/* Services */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '8px', marginBottom: '40px',
      }}>
        {SERVICES.map((s, i) => (
          <div key={i} style={{
            background: '#111119', border: '1px solid #1e1e2e',
            borderLeft: `4px solid ${PURPLE}`, borderRadius: '12px', padding: '18px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: `${PURPLE}18`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '16px', marginBottom: '12px',
            }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#e8e8f0', marginBottom: '6px' }}>{s.title}</p>
            <p style={{ fontSize: '12px', color: '#6b6b85', lineHeight: '1.65' }}>{s.description}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e1e2e', marginBottom: '28px' }} />

      {/* Advisors */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#e8e8f0', marginBottom: '5px' }}>Meet the advisor{advisors.length > 1 ? 's' : ''}</h3>
        <p style={{ fontSize: '13px', color: '#6b6b85' }}>Senior operator{advisors.length > 1 ? 's' : ''} with networks across UAE, CEE, and global investor circles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: advisors.length === 1 ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '36px' }}>
        {advisors.map((a, i) => (
          <div key={i} style={{
            background: '#111119', border: '1px solid #1e1e2e',
            borderTop: `4px solid ${a.color}`, borderRadius: '12px',
            padding: '22px 18px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: '10px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: `${a.color}25`, border: `2px solid ${a.color}50`,
              color: a.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '16px', fontWeight: '800',
            }}>
              {a.initials}
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#e8e8f0', marginBottom: '2px' }}>{a.name}</p>
              <p style={{ fontSize: '10px', fontWeight: '700', color: a.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{a.focus}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#6b6b85', lineHeight: '1.55', flex: 1 }}>{a.bio}</p>
            <a href={a.calendly} target="_blank" rel="noreferrer" style={{
              display: 'block', width: '100%', padding: '9px 16px', textAlign: 'center',
              background: `${a.color}20`, border: `1px solid ${a.color}40`,
              color: a.color, borderRadius: '8px', fontSize: '12px', fontWeight: '700',
            }}>
              Book a call
            </a>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '12px 18px', border: '1px solid #1e1e2e',
          borderRadius: '10px', background: 'transparent', color: '#6b6b85',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer',
        }}>← Back</button>
        <button onClick={onRestart} style={{
          flex: 1, padding: '12px 20px', background: 'transparent', color: '#6b6b85',
          border: '1px solid #1e1e2e', borderRadius: '10px',
          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>Start over</button>
      </div>
    </div>
  );
}
