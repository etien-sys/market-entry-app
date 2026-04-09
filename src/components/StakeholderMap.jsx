import { useState } from 'react';
import { filterByMarket, filterByCategory, getOrgColor, CATEGORY_FILTERS } from '../utils/marketFilter';
import { useIsMobile } from '../hooks/useIsMobile';

const PURPLE = '#7c6fe0';
const PURPLE_DIM = 'rgba(124,111,224,0.12)';

const SERVICES = [
  { icon: '🎤', label: 'Stage & media presence', detail: 'Right event stages and publications your buyers actually read.' },
  { icon: '🏛️', label: 'Lead gen experiences', detail: 'Curated rooms with target clients and investors — no cold outreach.' },
  { icon: '🔗', label: 'Warm introductions', detail: 'Personal intros briefed on your context before you meet.' },
  { icon: '📈', label: 'Sales & marketing strategy', detail: 'Go-to-market motion built for the market you\'re entering.' },
  { icon: '⚙️', label: 'RevOps', detail: 'Pipeline, CRM, and revenue processes set up for scale.' },
  { icon: '✍️', label: 'ContentOps', detail: 'Content engine that builds authority and generates inbound.' },
];

// Detect which category tab best matches the user's stated goal
function detectCategoryFromGoal(goal) {
  const g = (goal || '').toLowerCase();
  if (/investor|raise|fund|round|vc|capital|seed|angel|fundrais/.test(g)) return 'Investor';
  if (/enterprise|corporate|b2b|client|customer|sales|revenue/.test(g)) return 'Enterprise';
  if (/event|conference|stage|speak|gitex|expo/.test(g)) return 'Events';
  if (/media|press|coverage|journal|publish/.test(g)) return 'Media';
  if (/partner|startup|co-found|collaborat/.test(g)) return 'Startup';
  return 'All';
}

function getRelevanceReason(contact, intake) {
  const { stage, goal } = intake;
  const orgLower = (contact.orgType || '').toLowerCase();
  const roleLower = (contact.role || '').toLowerCase();
  const goalLower = (goal || '').toLowerCase();
  const loc = contact.basedIn || 'the region';

  if (orgLower.includes('investor')) {
    if (stage === 'Idea' || stage === 'Early') return `Early-stage investor active in ${loc} — relevant if you're raising your first round.`;
    if (stage === 'Growth') return `Growth-stage investor in ${loc} — can back your expansion with capital and connections.`;
    return `Investor with a ${loc} portfolio — potential lead or co-investor for your round.`;
  }
  if (orgLower.includes('enterprise')) {
    if (goalLower.includes('sales') || goalLower.includes('client') || goalLower.includes('customer') || goalLower.includes('revenue'))
      return `${contact.role} at a target enterprise — a direct path to your first ${loc} client.`;
    return `Senior buyer at an enterprise in ${loc} — potential client, pilot partner, or reference.`;
  }
  if (orgLower.includes('events')) {
    if (roleLower.includes('partner') || roleLower.includes('sponsor'))
      return `Controls speaking slots and sponsorship at ${contact.company} — one of the key deal-making events in ${loc}.`;
    return `Runs ${contact.company} — getting on their stage puts you in front of buyers and investors in ${loc}.`;
  }
  if (orgLower.includes('startup') || orgLower.includes('scaleup'))
    return `${stage === 'Idea' || stage === 'Early' ? 'Peer founder' : 'Operator'} who has navigated the ${loc} market — warm intro source, co-sell, or reference.`;
  if (orgLower.includes('service'))
    return `Local operator in ${loc} — can accelerate setup, navigate regulations, and open doors faster than you could alone.`;
  if (orgLower.includes('media')) {
    if (goalLower.includes('media') || goalLower.includes('press') || goalLower.includes('brand'))
      return `${contact.company} reaches the audience you're targeting — the right coverage here drives inbound.`;
    return `${contact.company} covers the ${loc} market your clients and investors read.`;
  }
  return `Active in ${loc} — relevant to building your network for the goals you described.`;
}

function ContactCard({ contact, intake, isFirstLocked, showLockBanner, forceVisible }) {
  const color = getOrgColor(contact.orgType);
  const isPaid = contact.tier === 'paid' && !forceVisible; // first 5 always visible
  const relevance = getRelevanceReason(contact, intake);

  return (
    <>
      <div style={{
        background: '#111119',
        border: '1px solid #1e1e2e',
        borderLeft: `4px solid ${color}`,
        borderRadius: '12px',
        padding: '16px 16px 0 14px',
        position: 'relative',
      }}>
        {isPaid && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: '#1a1a26', border: '1px solid #2a2a3e',
            borderRadius: '5px', padding: '2px 8px',
            fontSize: '9px', fontWeight: '700', color: '#4a4a65',
            textTransform: 'uppercase', letterSpacing: '0.7px',
          }}>Premium</span>
        )}

        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0', marginBottom: '2px' }}>{contact.name}</p>
          <p style={{ fontSize: '12px', color: '#6b6b85' }}>{contact.role}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{
            fontSize: '13px', fontWeight: '500', color: '#c8c8d8',
            filter: isPaid ? 'blur(5px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
          }}>
            {isPaid ? 'Acme Corp International' : contact.company}
          </span>
          {!isPaid && contact.basedIn && (
            <span style={{
              fontSize: '11px', color: '#6b6b85',
              background: '#17172a', border: '1px solid #252535',
              borderRadius: '20px', padding: '2px 8px', fontWeight: '500',
            }}>
              📍 {contact.basedIn}
            </span>
          )}
          <span style={{
            fontSize: '11px', fontWeight: '600', color,
            background: `${color}18`, borderRadius: '20px', padding: '2px 8px',
          }}>
            {contact.orgType || 'Other'}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #1a1a28', padding: '10px 0 12px' }}>
          <span style={{
            fontSize: '9px', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.7px', color, marginRight: '6px',
          }}>Why relevant</span>
          <span style={{
            fontSize: '12px', color: isPaid ? 'transparent' : '#6b6b85',
            lineHeight: '1.55', filter: isPaid ? 'blur(4px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
          }}>
            {relevance}
          </span>
        </div>

        {!isPaid && contact.notes && (
          <div style={{ borderTop: '1px solid #1a1a28', padding: '10px 0 12px' }}>
            <p style={{ fontSize: '11px', color: '#3a3a52', lineHeight: '1.55' }}>{contact.notes}</p>
          </div>
        )}
      </div>

      {isFirstLocked && showLockBanner && (
        <div style={{
          border: '1px solid #2d2450',
          borderLeft: `4px solid ${PURPLE}`,
          borderRadius: '12px',
          background: '#12101f',
          padding: '20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0', marginBottom: '5px' }}>
            🔒 Unlock the full network
          </p>
          <p style={{ fontSize: '12px', color: '#6b6b85', marginBottom: '16px', lineHeight: '1.6' }}>
            Get warm intros from Slavena & Etien — briefed on your context before you meet.
          </p>
          <a href="https://calendly.com" target="_blank" rel="noreferrer" style={{
            display: 'inline-block', padding: '10px 24px',
            background: PURPLE, color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600',
          }}>
            Book a call
          </a>
        </div>
      )}
    </>
  );
}

function ServicesSidebar({ intake, onNext }) {
  return (
    <div style={{
      border: '1px solid #1e1e2e', borderRadius: '14px', overflow: 'hidden',
      position: 'sticky', top: '20px', alignSelf: 'flex-start',
      background: '#0e0e18',
    }}>
      <div style={{ background: '#13101f', borderBottom: '1px solid #1e1e2e', padding: '16px 18px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#e8e8f0', marginBottom: '4px' }}>
          How we get you in the room
        </p>
        <p style={{ fontSize: '11px', color: '#4a4a65', lineHeight: '1.45' }}>
          For {intake.stage}-stage companies entering {intake.market === 'All' ? 'new markets' : intake.market}
        </p>
      </div>

      {SERVICES.map((s, i) => (
        <div key={i} style={{
          display: 'flex', gap: '10px', padding: '12px 16px',
          borderBottom: i < SERVICES.length - 1 ? '1px solid #14141e' : 'none',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{s.icon}</span>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#c8c8d8', marginBottom: '2px' }}>{s.label}</p>
            <p style={{ fontSize: '11px', color: '#4a4a65', lineHeight: '1.45' }}>{s.detail}</p>
          </div>
        </div>
      ))}

      <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1e2e' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '11px 16px',
          background: PURPLE, color: '#fff', border: 'none',
          borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Work with us →
        </button>
      </div>
    </div>
  );
}

function MobileServicesSheet({ intake, onNext }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 40,
          backdropFilter: 'blur(3px)',
        }} />
      )}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        transform: open ? 'translateY(0)' : 'translateY(calc(100% - 64px))',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div onClick={() => setOpen(o => !o)} style={{
          background: '#13101f',
          borderTop: `2px solid ${PURPLE}`,
          padding: '0 20px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#e8e8f0' }}>How we can help</p>
            <p style={{ fontSize: '11px', color: '#4a4a65' }}>{SERVICES.length} services · tap to {open ? 'close' : 'expand'}</p>
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: PURPLE_DIM, border: `1px solid ${PURPLE}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: PURPLE,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.25s',
          }}>↑</div>
        </div>
        <div style={{ background: '#0e0e18', maxHeight: '60vh', overflowY: 'auto' }}>
          {SERVICES.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '14px 20px',
              borderBottom: i < SERVICES.length - 1 ? '1px solid #14141e' : 'none',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#c8c8d8', marginBottom: '2px' }}>{s.label}</p>
                <p style={{ fontSize: '12px', color: '#4a4a65', lineHeight: '1.5' }}>{s.detail}</p>
              </div>
            </div>
          ))}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e2e' }}>
            <button onClick={onNext} style={{
              width: '100%', padding: '13px 20px',
              background: PURPLE, color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>Work with us →</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function StakeholderMap({ intake, contacts, loading, onNext, onBack }) {
  // Pre-select category based on stated goal
  const [category, setCategory] = useState(() => detectCategoryFromGoal(intake.goal));
  const isMobile = useIsMobile();

  const MIN_FREE = 5; // always show at least this many contacts

  const marketFiltered = filterByMarket(contacts, intake.market);
  const categoryFiltered = filterByCategory(marketFiltered, category);
  // Sort free first, then paid — but first MIN_FREE are always unlocked regardless of tier
  const sorted = [...categoryFiltered].sort((a, b) => a.tier === b.tier ? 0 : a.tier === 'free' ? -1 : 1);
  const lockBannerIndex = sorted.length > MIN_FREE ? MIN_FREE : -1; // banner after 5th card

  return (
    <div style={{ padding: isMobile ? '28px 16px 120px' : '40px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Stakeholder Map
        </p>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.6px', marginBottom: '6px' }}>
          {intake.market === 'All' ? 'All markets' : intake.market} network
        </h2>
        <p style={{ fontSize: '13px', color: '#4a4a65' }}>
          {loading ? 'Loading contacts…' : `${categoryFiltered.length} contact${categoryFiltered.length !== 1 ? 's' : ''} matched to your goal`}
        </p>
      </div>

      {/* Goal pill */}
      {intake.goal && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          background: '#111119', border: '1px solid #1e1e2e',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#3a3a52', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', paddingTop: '1px' }}>Goal</span>
          <span style={{ fontSize: '12px', color: '#6b6b85', lineHeight: '1.5' }}>{intake.goal}</span>
        </div>
      )}

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORY_FILTERS.map(cat => {
          const active = category === cat;
          return (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '6px 13px',
              border: `1.5px solid ${active ? PURPLE : '#1e1e2e'}`,
              borderRadius: '20px',
              background: active ? PURPLE_DIM : 'transparent',
              color: active ? '#c4befc' : '#4a4a65',
              fontSize: '12px', fontWeight: active ? '600' : '400',
              transition: 'all 0.15s', cursor: 'pointer',
            }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Layout */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '1fr 272px',
        gap: '20px',
        alignItems: 'start',
      }}>
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3a52', fontSize: '14px' }}>Loading contacts…</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3a52', fontSize: '14px' }}>
              No contacts found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sorted.map((contact, i) => (
                <ContactCard key={contact.id} contact={contact} intake={intake}
                  forceVisible={i < MIN_FREE}
                  isFirstLocked={i === lockBannerIndex}
                  showLockBanner={lockBannerIndex !== -1} />
              ))}
            </div>
          )}
          <button onClick={onBack} style={{
            marginTop: '20px', width: '100%',
            padding: '11px 16px', border: '1px solid #1e1e2e',
            borderRadius: '10px', background: 'transparent', color: '#3a3a52',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>
            ← Back to market guide
          </button>
        </div>
        {!isMobile && <ServicesSidebar intake={intake} onNext={onNext} />}
      </div>

      {isMobile && <MobileServicesSheet intake={intake} onNext={onNext} />}
    </div>
  );
}
