import { useState } from 'react';
import { filterByMarket, filterByCategory, getOrgColor, CATEGORY_FILTERS } from '../utils/marketFilter';

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
    return `${stage === 'Idea' || stage === 'Early' ? 'Peer founder' : 'Operator'} who has navigated the ${loc} market — warm intro source, co-sell, or reference customer.`;
  if (orgLower.includes('service'))
    return `Local operator in ${loc} — can accelerate setup, navigate regulations, and open doors faster than you could alone.`;
  if (orgLower.includes('media')) {
    if (goalLower.includes('media') || goalLower.includes('press') || goalLower.includes('brand'))
      return `${contact.company} reaches the audience you're targeting — the right coverage here drives inbound.`;
    return `${contact.company} covers the ${loc} market your clients and investors read — strategic press contact.`;
  }
  return `Active in ${loc} — relevant to building your network for the goals you described.`;
}

function ContactCard({ contact, intake, isFirstLocked, showLockBanner }) {
  const borderColor = getOrgColor(contact.orgType);
  const isPaid = contact.tier === 'paid';
  const relevance = getRelevanceReason(contact, intake);

  return (
    <>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        borderLeft: `3px solid ${borderColor}`,
        padding: '16px 16px 0 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isPaid && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#f3f4f6', borderRadius: '4px', padding: '2px 7px',
            fontSize: '10px', fontWeight: '600', color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Premium
          </div>
        )}

        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>{contact.name}</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{contact.role}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{
            filter: isPaid ? 'blur(5px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
            fontSize: '13px', fontWeight: '500', color: '#374151',
          }}>
            {isPaid ? 'Acme Corporation Ltd' : contact.company}
          </div>
          {!isPaid && contact.basedIn && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', background: '#f5f5f5', borderRadius: '20px',
              fontSize: '11px', color: '#6b7280', fontWeight: '500',
            }}>
              📍 {contact.basedIn}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', background: borderColor + '18',
            borderRadius: '20px', fontSize: '11px', color: borderColor, fontWeight: '500',
          }}>
            {contact.orgType || 'Other'}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6', padding: '10px 0 12px' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.6px', color: borderColor, marginRight: '6px',
          }}>
            Why relevant
          </span>
          <span style={{
            fontSize: '12px', color: isPaid ? 'transparent' : '#4b5563',
            lineHeight: '1.5', filter: isPaid ? 'blur(4px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
          }}>
            {relevance}
          </span>
        </div>

        {!isPaid && contact.notes && (
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '10px 0 12px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>{contact.notes}</p>
          </div>
        )}
      </div>

      {isFirstLocked && showLockBanner && (
        <div style={{
          border: '1px solid #e5e7eb', borderLeft: '3px solid #7F77DD',
          borderRadius: '10px', background: '#faf9ff', padding: '20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
            🔒 Unlock the full network
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
            Get warm intros from Slavena & Etien — briefed on your context before you meet.
          </p>
          <a href="https://calendly.com" target="_blank" rel="noreferrer" style={{
            display: 'inline-block', padding: '10px 22px', background: '#7F77DD',
            color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
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
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'sticky',
      top: '20px',
      alignSelf: 'flex-start',
    }}>
      <div style={{ background: '#1a1a1a', padding: '14px 16px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>
          How we get you in the room
        </p>
        <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
          For {intake.stage}-stage companies entering {intake.market === 'All' ? 'new markets' : intake.market}
        </p>
      </div>

      <div style={{ background: '#fff' }}>
        {SERVICES.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: '10px',
            padding: '11px 14px',
            borderBottom: i < SERVICES.length - 1 ? '1px solid #f3f4f6' : 'none',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>{item.label}</p>
              <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.45' }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f9f9f9', borderTop: '1px solid #e5e7eb', padding: '12px 14px' }}>
        <button
          onClick={onNext}
          style={{
            width: '100%', padding: '10px 16px',
            background: '#1a1a1a', color: '#fff', border: 'none',
            borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Work with us →
        </button>
      </div>
    </div>
  );
}

export default function StakeholderMap({ intake, contacts, loading, onNext, onBack }) {
  const [category, setCategory] = useState('All');

  const marketFiltered = filterByMarket(contacts, intake.market);
  const categoryFiltered = filterByCategory(marketFiltered, category);

  const sorted = [...categoryFiltered].sort((a, b) => {
    if (a.tier === b.tier) return 0;
    return a.tier === 'free' ? -1 : 1;
  });

  const firstPaidIndex = sorted.findIndex((c) => c.tier === 'paid');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Stakeholder Map
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: '6px' }}>
          {intake.market === 'All' ? 'All markets' : intake.market} network
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          {loading ? 'Loading contacts...' : `${categoryFiltered.length} contact${categoryFiltered.length !== 1 ? 's' : ''} matched to your goal`}
        </p>
      </div>

      {/* Goal pill */}
      {intake.goal && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px',
          background: '#f9f9f9', border: '1px solid #e5e7eb',
          borderRadius: '8px', padding: '10px 12px', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', paddingTop: '1px' }}>Your goal</span>
          <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>{intake.goal}</span>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '6px 12px',
              border: `1.5px solid ${category === cat ? '#1a1a1a' : '#e5e7eb'}`,
              borderRadius: '20px',
              background: category === cat ? '#1a1a1a' : '#fff',
              color: category === cat ? '#fff' : '#6b7280',
              fontSize: '12px',
              fontWeight: category === cat ? '600' : '400',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: '20px',
        alignItems: 'start',
      }}>
        {/* Contact list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
              Loading contacts from the network...
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
              No contacts found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          <button
            onClick={onBack}
            style={{
              marginTop: '20px',
              padding: '10px 16px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              background: '#fff',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              width: '100%',
            }}
          >
            ← Back to market guide
          </button>
        </div>

        {/* Sticky sidebar */}
        <ServicesSidebar intake={intake} onNext={onNext} />
      </div>
    </div>
  );
}
