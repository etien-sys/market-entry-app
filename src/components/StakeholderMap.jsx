import { useState } from 'react';
import { filterByMarket, filterByCategory, getOrgColor, CATEGORY_FILTERS } from '../utils/marketFilter';
import { useIsMobile } from '../hooks/useIsMobile';

const SERVICES = [
  { icon: '🎤', label: 'Stage & media presence', detail: 'Right event stages and publications your buyers actually read.' },
  { icon: '🏛️', label: 'Lead gen experiences', detail: 'Curated rooms with target clients and investors — no cold outreach.' },
  { icon: '🔗', label: 'Warm introductions', detail: 'Personal intros briefed on your context before you meet.' },
  { icon: '📈', label: 'Sales & marketing strategy', detail: 'Go-to-market motion built for the market you\'re entering.' },
  { icon: '⚙️', label: 'RevOps', detail: 'Pipeline, CRM, and revenue processes set up for scale.' },
  { icon: '✍️', label: 'ContentOps', detail: 'Content engine that builds authority and generates inbound.' },
];

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

function ContactCard({ contact, intake, isFirstLocked, showLockBanner }) {
  const color = getOrgColor(contact.orgType);
  const isPaid = contact.tier === 'paid';
  const relevance = getRelevanceReason(contact, intake);

  return (
    <>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e5e2',
        borderLeft: `4px solid ${color}`,
        borderRadius: '12px',
        padding: '16px 16px 0 14px',
        position: 'relative',
      }}>
        {isPaid && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: '#f5f5f2', borderRadius: '5px', padding: '2px 7px',
            fontSize: '9px', fontWeight: '700', color: '#b8b8b2',
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>Premium</span>
        )}

        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111110', marginBottom: '1px' }}>{contact.name}</p>
          <p style={{ fontSize: '12px', color: '#78716c' }}>{contact.role}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{
            fontSize: '13px', fontWeight: '500', color: '#111110',
            filter: isPaid ? 'blur(5px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
          }}>
            {isPaid ? 'Acme Corp International' : contact.company}
          </span>
          {!isPaid && contact.basedIn && (
            <span style={{
              fontSize: '11px', color: '#78716c',
              background: '#f5f5f2', borderRadius: '20px',
              padding: '2px 8px', fontWeight: '500',
            }}>
              📍 {contact.basedIn}
            </span>
          )}
          <span style={{
            fontSize: '11px', fontWeight: '600', color: color,
            background: color + '14', borderRadius: '20px', padding: '2px 8px',
          }}>
            {contact.orgType || 'Other'}
          </span>
        </div>

        <div style={{
          borderTop: '1px solid #f0f0ec',
          padding: '10px 0 12px',
        }}>
          <span style={{
            fontSize: '9px', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.7px', color: color, marginRight: '6px',
          }}>Why relevant</span>
          <span style={{
            fontSize: '12px', color: isPaid ? 'transparent' : '#78716c',
            lineHeight: '1.55', filter: isPaid ? 'blur(4px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
          }}>
            {relevance}
          </span>
        </div>

        {!isPaid && contact.notes && (
          <div style={{ borderTop: '1px solid #f0f0ec', padding: '10px 0 12px' }}>
            <p style={{ fontSize: '11px', color: '#b8b8b2', lineHeight: '1.55' }}>{contact.notes}</p>
          </div>
        )}
      </div>

      {isFirstLocked && showLockBanner && (
        <div style={{
          border: '1px solid #e5e5e2', borderLeft: '4px solid #7F77DD',
          borderRadius: '12px', background: '#faf9ff', padding: '20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111110', marginBottom: '5px' }}>
            🔒 Unlock the full network
          </p>
          <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '16px', lineHeight: '1.6' }}>
            Get warm intros from Slavena & Etien — briefed on your context before you meet.
          </p>
          <a href="https://calendly.com" target="_blank" rel="noreferrer" style={{
            display: 'inline-block', padding: '10px 22px',
            background: '#7F77DD', color: '#fff',
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
      border: '1px solid #e5e5e2', borderRadius: '14px', overflow: 'hidden',
      position: 'sticky', top: '20px', alignSelf: 'flex-start',
      background: '#fff',
    }}>
      <div style={{ background: '#111110', padding: '16px 18px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
          How we get you in the room
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.45' }}>
          For {intake.stage}-stage companies entering {intake.market === 'All' ? 'new markets' : intake.market}
        </p>
      </div>

      {SERVICES.map((s, i) => (
        <div key={i} style={{
          display: 'flex', gap: '10px', padding: '12px 16px',
          borderBottom: i < SERVICES.length - 1 ? '1px solid #f0f0ec' : 'none',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{s.icon}</span>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#111110', marginBottom: '2px' }}>{s.label}</p>
            <p style={{ fontSize: '11px', color: '#78716c', lineHeight: '1.45' }}>{s.detail}</p>
          </div>
        </div>
      ))}

      <div style={{ padding: '14px 16px', borderTop: '1px solid #f0f0ec', background: '#fafaf8' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '11px 16px',
          background: '#111110', color: '#fff', border: 'none',
          borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
        }}
          onMouseOver={e => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Work with us →
        </button>
      </div>
    </div>
  );
}

// Mobile bottom sheet for services
function MobileServicesSheet({ intake, onNext }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            zIndex: 40, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 50,
        transform: open ? 'translateY(0)' : 'translateY(calc(100% - 64px))',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* Handle bar / collapsed state */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            background: '#111110',
            padding: '0 20px',
            height: '64px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>How we can help</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
              {SERVICES.length} services · tap to {open ? 'close' : 'expand'}
            </p>
          </div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: '#fff',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.25s',
          }}>
            ↑
          </div>
        </div>

        {/* Expanded services list */}
        <div style={{ background: '#fff', maxHeight: '60vh', overflowY: 'auto' }}>
          {SERVICES.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '14px 20px',
              borderBottom: i < SERVICES.length - 1 ? '1px solid #f0f0ec' : 'none',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#111110', marginBottom: '2px' }}>{s.label}</p>
                <p style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.5' }}>{s.detail}</p>
              </div>
            </div>
          ))}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0ec' }}>
            <button onClick={onNext} style={{
              width: '100%', padding: '13px 20px',
              background: '#111110', color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>
              Work with us →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function StakeholderMap({ intake, contacts, loading, onNext, onBack }) {
  const [category, setCategory] = useState('All');
  const isMobile = useIsMobile();

  const marketFiltered = filterByMarket(contacts, intake.market);
  const categoryFiltered = filterByCategory(marketFiltered, category);
  const sorted = [...categoryFiltered].sort((a, b) => a.tier === b.tier ? 0 : a.tier === 'free' ? -1 : 1);
  const firstPaidIndex = sorted.findIndex(c => c.tier === 'paid');

  return (
    <div style={{ padding: isMobile ? '28px 16px 120px' : '36px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Stakeholder Map
        </p>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111110', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          {intake.market === 'All' ? 'All markets' : intake.market} network
        </h2>
        <p style={{ fontSize: '13px', color: '#78716c' }}>
          {loading ? 'Loading contacts…' : `${categoryFiltered.length} contact${categoryFiltered.length !== 1 ? 's' : ''} matched to your goal`}
        </p>
      </div>

      {/* Goal pill */}
      {intake.goal && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          background: '#fff', border: '1px solid #e5e5e2',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#b8b8b2', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', paddingTop: '1px' }}>Goal</span>
          <span style={{ fontSize: '12px', color: '#78716c', lineHeight: '1.5' }}>{intake.goal}</span>
        </div>
      )}

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORY_FILTERS.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '6px 12px',
            border: `1.5px solid ${category === cat ? '#111110' : '#e5e5e2'}`,
            borderRadius: '20px',
            background: category === cat ? '#111110' : '#fff',
            color: category === cat ? '#fff' : '#78716c',
            fontSize: '12px', fontWeight: category === cat ? '600' : '400',
            transition: 'all 0.15s', cursor: 'pointer',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Two-col on desktop, single col on mobile */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: '20px',
        alignItems: 'start',
      }}>
        {/* Contact list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#b8b8b2', fontSize: '14px' }}>
              Loading contacts…
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#b8b8b2', fontSize: '14px' }}>
              No contacts found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sorted.map((contact, i) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  intake={intake}
                  isFirstLocked={i === firstPaidIndex}
                  showLockBanner={firstPaidIndex !== -1}
                />
              ))}
            </div>
          )}

          <button onClick={onBack} style={{
            marginTop: '20px', width: '100%',
            padding: '11px 16px', border: '1.5px solid #e5e5e2',
            borderRadius: '10px', background: '#fff', color: '#b8b8b2',
            fontSize: '13px', fontWeight: '500',
          }}>
            ← Back to market guide
          </button>
        </div>

        {/* Desktop sidebar */}
        {!isMobile && <ServicesSidebar intake={intake} onNext={onNext} />}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && <MobileServicesSheet intake={intake} onNext={onNext} />}
    </div>
  );
}
