import { useState } from 'react';
import { filterByMarket, filterByCategory, getOrgColor, CATEGORY_FILTERS } from '../utils/marketFilter';

function ContactCard({ contact, isFirstLocked, showLockBanner }) {
  const borderColor = getOrgColor(contact.orgType);
  const isPaid = contact.tier === 'paid';

  return (
    <>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        borderLeft: `3px solid ${borderColor}`,
        padding: '16px 16px 16px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isPaid && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#f3f4f6',
            borderRadius: '4px',
            padding: '2px 7px',
            fontSize: '10px',
            fontWeight: '600',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Premium
          </div>
        )}

        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>
            {contact.name}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{contact.role}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            filter: isPaid ? 'blur(5px)' : 'none',
            userSelect: isPaid ? 'none' : 'auto',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
          }}>
            {isPaid ? 'Acme Corporation Ltd' : contact.company}
          </div>

          {!isPaid && contact.basedIn && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: '#f5f5f5',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#6b7280',
              fontWeight: '500',
            }}>
              📍 {contact.basedIn}
            </span>
          )}

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            background: borderColor + '18',
            borderRadius: '20px',
            fontSize: '11px',
            color: borderColor,
            fontWeight: '500',
          }}>
            {contact.orgType || 'Other'}
          </span>
        </div>

        {!isPaid && contact.notes && (
          <p style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: '1.5',
            borderTop: '1px solid #f3f4f6',
            paddingTop: '10px',
          }}>
            {contact.notes}
          </p>
        )}
      </div>

      {isFirstLocked && showLockBanner && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderLeft: '3px solid #7F77DD',
          borderRadius: '10px',
          background: '#faf9ff',
          padding: '20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
            🔒 Unlock the full network
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
            Get warm intros from Slavena & Etien — briefed on your context before you meet.
          </p>
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              background: '#7F77DD',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Book a call
          </a>
        </div>
      )}
    </>
  );
}

export default function StakeholderMap({ intake, contacts, loading, onNext, onBack }) {
  const [category, setCategory] = useState('All');

  const marketFiltered = filterByMarket(contacts, intake.market);
  const categoryFiltered = filterByCategory(marketFiltered, category);

  // Sort: free first, then paid
  const sorted = [...categoryFiltered].sort((a, b) => {
    if (a.tier === b.tier) return 0;
    return a.tier === 'free' ? -1 : 1;
  });

  const firstPaidIndex = sorted.findIndex((c) => c.tier === 'paid');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Stakeholder Map
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: '6px' }}>
          {intake.market === 'All' ? 'All markets' : intake.market} network
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          {loading ? 'Loading contacts...' : `${categoryFiltered.length} contact${categoryFiltered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Category filter bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
          Loading contacts from the network...
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
          No contacts found for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {sorted.map((contact, i) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isFirstLocked={i === firstPaidIndex}
              showLockBanner={firstPaidIndex !== -1}
            />
          ))}
        </div>
      )}

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
          onClick={onNext}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
          onMouseOver={(e) => { e.target.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.target.style.opacity = '1'; }}
        >
          Work with us →
        </button>
      </div>
    </div>
  );
}
