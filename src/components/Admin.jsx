import { useState, useMemo } from 'react';

const PURPLE = '#7c6fe0';

// ── Filter logic ──────────────────────────────────────────────────────────────

const ORG_PATTERNS = [
  { words: ['journalist', 'press', 'reporter', 'editor', 'media', 'publication', 'magazine', 'newspaper', 'broadcast', 'tv', 'radio'], orgTypes: ['Media'] },
  { words: ['investor', 'vc', 'venture', 'fund', 'capital', 'angel', 'family office', 'high-net-worth', 'hnw'], orgTypes: ['Investor', 'Family Office', 'High-Net-Worth Individual'] },
  { words: ['event organizer', 'event organiser', 'conference', 'event'], orgTypes: ['Event Organizer'] },
  { words: ['startup', 'founder', 'early-stage', 'early stage'], orgTypes: ['Product Startup'] },
  { words: ['scaleup', 'scale-up', 'scaleup'], orgTypes: ['Product Scaleup'] },
  { words: ['accelerator', 'incubator'], orgTypes: ['Accelerator/ Incubator'] },
  { words: ['corporate', 'corporation', 'enterprise', 'bank'], orgTypes: ['Corporation', 'Bank'] },
  { words: ['ngo', 'non-profit', 'nonprofit', 'civil society'], orgTypes: ['NGO'] },
  { words: ['service provider', 'consultant', 'agency', 'advisory'], orgTypes: ['Service Provider'] },
  { words: ['policymaker', 'government', 'ministry', 'public sector'], orgTypes: ['Policymaker/ Public Sector Agency'] },
  { words: ['research', 'university', 'academic', 'think tank'], orgTypes: ['Research'] },
];

const LOCATION_MAP = {
  'uae': ['UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah', 'MENA'],
  'dubai': ['Dubai', 'UAE', 'United Arab Emirates'],
  'abu dhabi': ['Abu Dhabi', 'UAE', 'United Arab Emirates'],
  'mena': ['MENA', 'UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi'],
  'gcc': ['MENA', 'UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi'],
  'germany': ['Germany'], 'austria': ['Austria'], 'switzerland': ['Switzerland'],
  'dach': ['Germany', 'Austria', 'Switzerland'],
  'poland': ['Poland'], 'romania': ['Romania'], 'bulgaria': ['Bulgaria'],
  'greece': ['Greece'], 'czechia': ['Czechia'], 'czech republic': ['Czechia'],
  'hungary': ['Hungary'], 'croatia': ['Croatia'], 'serbia': ['Serbia'],
  'slovakia': ['Slovakia'], 'albania': ['Albania'], 'ukraine': ['Ukraine'],
  'estonia': ['Estonia'], 'latvia': ['Latvia'], 'lithuania': ['Lithuania'],
  'cee': ['Bulgaria', 'Romania', 'Poland', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Serbia', 'Slovakia', 'Albania', 'Ukraine', 'Estonia', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'North Macedonia', 'Bosnia and Herzegovina'],
  'balkans': ['Bulgaria', 'Romania', 'Greece', 'Croatia', 'Serbia', 'Albania', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Slovenia'],
  'us': ['United States'], 'usa': ['United States'], 'united states': ['United States'], 'america': ['United States'],
  'uk': ['United Kingdom'], 'united kingdom': ['United Kingdom'], 'britain': ['United Kingdom'],
  'france': ['France'], 'italy': ['Italy'], 'spain': ['Spain'],
  'netherlands': ['The Netherlands'], 'belgium': ['Belgium'],
  'portugal': ['Portugal'], 'ireland': ['Ireland'], 'luxembourg': ['Luxembourg'],
  'nordics': ['Nordics'], 'sweden': ['Nordics'], 'norway': ['Nordics'], 'denmark': ['Nordics'], 'finland': ['Nordics'],
  'europe': ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'The Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Romania', 'Bulgaria', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Portugal', 'Ireland', 'Nordics', 'Luxembourg'],
};

function parseQuery(q) {
  const lower = q.toLowerCase();
  const orgTypes = [];
  for (const p of ORG_PATTERNS) {
    if (p.words.some(w => lower.includes(w))) orgTypes.push(...p.orgTypes);
  }
  const locations = [];
  // Sort keys longest-first so "abu dhabi" matches before "abu"
  for (const key of Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)) {
    if (lower.includes(key)) {
      locations.push(...LOCATION_MAP[key]);
      break; // take first (longest) match to avoid double-matching
    }
  }
  return { orgTypes: [...new Set(orgTypes)], locations: [...new Set(locations)], raw: lower };
}

function matchesFilter(c, { orgTypes, locations, raw }) {
  const orgType = (c.orgType || '').toLowerCase();
  const industry = (c.industry || '').toLowerCase();
  const basedIn = (c.basedIn || '').toLowerCase();
  const name = (c.name || '').toLowerCase();
  const website = (c.website || '').toLowerCase();
  const contact = (c.contact || '').toLowerCase();

  if (orgTypes.length === 0 && locations.length === 0) {
    return [name, orgType, industry, basedIn, website, contact].some(f => f.includes(raw));
  }
  const orgMatch = orgTypes.length === 0 || orgTypes.some(ot => orgType.includes(ot.toLowerCase()));
  const locMatch = locations.length === 0 || locations.some(l => basedIn.toLowerCase().includes(l.toLowerCase()));
  return orgMatch && locMatch;
}

// ── CSV export ─────────────────────────────────────────────────────────────────

// Extract first email from the Associated Contact string
function firstEmail(str) {
  if (!str) return null;
  const match = str.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  return match ? match[0] : null;
}

function ContactCell({ value }) {
  // Show first contact entry; truncate if long
  const first = value.split(';')[0].trim();
  const hasMore = value.split(';').length > 1;
  const email = firstEmail(value);
  return (
    <div title={value} style={{ fontSize: '12px', color: '#6b6b85' }}>
      {email ? (
        <a href={`mailto:${email}`} style={{ color: '#34d399', textDecoration: 'none' }}
          onMouseOver={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >
          {first.length > 36 ? first.slice(0, 36) + '…' : first}
        </a>
      ) : (
        <span>{first.length > 36 ? first.slice(0, 36) + '…' : first}</span>
      )}
      {hasMore && <span style={{ color: '#3a3a52', marginLeft: '4px' }}>+{value.split(';').length - 1}</span>}
    </div>
  );
}

function exportCSV(contacts, label) {
  const headers = ['Company', 'Org Type', 'Industry', 'Based In', 'Website', 'Associated Contact'];
  const rows = contacts.map(c =>
    [c.name, c.orgType, c.industry, c.basedIn, c.website, c.contact]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seti-${label || 'contacts'}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Network overview ───────────────────────────────────────────────────────────

const ORG_GROUPS = [
  { label: 'Investors', query: 'all investors', orgTypes: ['Investor', 'Family Office', 'High-Net-Worth Individual'], color: '#9d94f0' },
  { label: 'Startups', query: 'startups', orgTypes: ['Product Startup', 'Product Scaleup'], color: '#34d399' },
  { label: 'Media', query: 'journalists', orgTypes: ['Media'], color: '#60a5fa' },
  { label: 'Corporates', query: 'corporates', orgTypes: ['Corporation', 'Bank'], color: '#fbbf24' },
  { label: 'Service Providers', query: 'service providers', orgTypes: ['Service Provider'], color: '#f87171' },
  { label: 'Events', query: 'event organizers', orgTypes: ['Event Organizer'], color: '#a78bfa' },
  { label: 'Accelerators', query: 'accelerators', orgTypes: ['Accelerator/ Incubator'], color: '#2dd4bf' },
  { label: 'NGOs / Gov', query: 'ngo government', orgTypes: ['NGO', 'Policymaker/ Public Sector Agency'], color: '#94a3b8' },
];

const REGION_GROUPS = [
  { label: 'United States', query: 'contacts in united states', locations: ['United States'] },
  { label: 'Bulgaria', query: 'contacts in Bulgaria', locations: ['Bulgaria'] },
  { label: 'Romania', query: 'contacts in Romania', locations: ['Romania'] },
  { label: 'Germany', query: 'contacts in Germany', locations: ['Germany'] },
  { label: 'United Kingdom', query: 'contacts in united kingdom', locations: ['United Kingdom'] },
  { label: 'CEE', query: 'contacts in CEE', locations: ['Bulgaria', 'Romania', 'Poland', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Serbia', 'Slovakia', 'Albania', 'Ukraine', 'Estonia', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'North Macedonia', 'Bosnia and Herzegovina'] },
  { label: 'DACH', query: 'contacts in DACH', locations: ['Germany', 'Austria', 'Switzerland'] },
  { label: 'UAE / MENA', query: 'investors in UAE', locations: ['UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah', 'MENA'] },
];

function NetworkOverview({ contacts, onQuery }) {
  const orgCounts = useMemo(() => {
    const map = {};
    for (const c of contacts) {
      const ot = c.orgType || '';
      map[ot] = (map[ot] || 0) + 1;
    }
    return map;
  }, [contacts]);

  function countForGroup(group) {
    return contacts.filter(c => group.orgTypes.some(ot => (c.orgType || '').toLowerCase().includes(ot.toLowerCase()))).length;
  }

  function countForRegion(group) {
    return contacts.filter(c => group.locations.some(l => (c.basedIn || '').toLowerCase().includes(l.toLowerCase()))).length;
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Org type cards */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
        Browse by type
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {ORG_GROUPS.map(g => {
          const count = countForGroup(g);
          return (
            <button key={g.label} onClick={() => onQuery(g.query)}
              style={{
                padding: '12px 14px', background: '#111119',
                border: `1px solid #1e1e2e`, borderRadius: '10px',
                textAlign: 'left', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = g.color; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; }}
            >
              <div style={{ fontSize: '18px', fontWeight: '800', color: g.color, marginBottom: '2px' }}>
                {count.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#6b6b85', fontWeight: '500' }}>{g.label}</div>
            </button>
          );
        })}
      </div>

      {/* Region chips */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
        Browse by region
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {REGION_GROUPS.map(g => {
          const count = countForRegion(g);
          return (
            <button key={g.label} onClick={() => onQuery(g.query)}
              style={{
                padding: '7px 14px', background: '#111119',
                border: '1px solid #1e1e2e', borderRadius: '20px',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.background = '#17172a'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = '#111119'; }}
            >
              <span style={{ fontSize: '12px', color: '#c8c8d8', fontWeight: '500' }}>{g.label}</span>
              <span style={{ fontSize: '11px', color: '#3a3a52', background: '#0d0d16', borderRadius: '10px', padding: '1px 6px' }}>
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'all investors', 'investors in UAE', 'journalists in Germany',
  'event organizers in CEE', 'startups in Poland', 'investors with contact',
  'media contacts in DACH', 'service providers in Bulgaria', 'accelerators',
];

export default function Admin({ contacts, loading }) {
  const [query, setQuery] = useState('');
  const [showOverview, setShowOverview] = useState(true);

  const parsed = useMemo(() => parseQuery(query), [query]);

  const results = useMemo(() => {
    if (!query.trim()) return contacts;
    // Special case: "with contact" / "with email"
    if (/with (contact|email)|has (contact|email)/.test(query.toLowerCase())) {
      const rest = query.toLowerCase().replace(/with (contact|email)|has (contact|email)/g, '').trim();
      const base = rest ? contacts.filter(c => matchesFilter(c, parseQuery(rest))) : contacts;
      return base.filter(c => c.contact);
    }
    return contacts.filter(c => matchesFilter(c, parsed));
  }, [contacts, query, parsed]);

  function setQueryAndSearch(q) {
    setQuery(q);
    setShowOverview(false);
  }

  return (
    <div style={{ padding: '32px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.8px' }}>SETI Internal</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.5px', margin: '4px 0 2px' }}>
            Contact Database
          </h1>
          <p style={{ fontSize: '13px', color: '#4a4a65' }}>
            {loading ? 'Loading…' : `${contacts.length.toLocaleString()} contacts · ${contacts.filter(c => c.contact).length.toLocaleString()} with contact info`}
          </p>
        </div>
        <button
          onClick={() => setShowOverview(o => !o)}
          style={{ padding: '8px 16px', background: 'transparent', border: `1px solid #1e1e2e`, borderRadius: '8px', fontSize: '12px', color: '#4a4a65', cursor: 'pointer' }}
        >
          {showOverview ? 'Hide overview' : 'Show overview'}
        </button>
      </div>

      {/* Network overview */}
      {showOverview && !loading && (
        <NetworkOverview contacts={contacts} onQuery={setQueryAndSearch} />
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (!showOverview && !e.target.value) setShowOverview(true); }}
          onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setShowOverview(true); } }}
          placeholder='"investors in UAE" · "journalists in Germany" · "event organizers CEE" · "startups with email"'
          autoFocus
          style={{
            flex: 1, padding: '13px 16px', background: '#111119',
            border: `1.5px solid ${PURPLE}`, borderRadius: '10px',
            fontSize: '14px', color: '#e8e8f0', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => exportCSV(results, query || 'all')}
          disabled={results.length === 0}
          style={{
            padding: '13px 20px',
            background: results.length ? '#1a1a2e' : '#111119',
            color: results.length ? '#c4befc' : '#3a3a52',
            border: `1px solid ${results.length ? PURPLE : '#1e1e2e'}`,
            borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            cursor: results.length ? 'pointer' : 'default', whiteSpace: 'nowrap',
          }}
        >
          Export CSV ({results.length.toLocaleString()})
        </button>
      </div>

      {/* Suggestion chips */}
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQueryAndSearch(s)}
              style={{
                padding: '5px 12px', background: 'transparent',
                border: '1px solid #1e1e2e', borderRadius: '20px',
                fontSize: '12px', color: '#4a4a65', cursor: 'pointer',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = '#c4befc'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#4a4a65'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Active filter tags */}
      {query && (parsed.orgTypes.length > 0 || parsed.locations.length > 0) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
          {parsed.orgTypes.map(ot => (
            <span key={ot} style={{ fontSize: '11px', padding: '3px 10px', background: `${PURPLE}20`, border: `1px solid ${PURPLE}40`, borderRadius: '20px', color: '#c4befc', fontWeight: '600' }}>{ot}</span>
          ))}
          {parsed.locations.map(l => (
            <span key={l} style={{ fontSize: '11px', padding: '3px 10px', background: '#17172a', border: '1px solid #252535', borderRadius: '20px', color: '#6b6b85' }}>📍 {l}</span>
          ))}
          <span style={{ fontSize: '11px', color: '#3a3a52' }}>→ {results.length.toLocaleString()} results</span>
          <button onClick={() => { setQuery(''); setShowOverview(true); }}
            style={{ fontSize: '11px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}>
            ✕ clear
          </button>
        </div>
      )}

      {/* Results table */}
      {query && (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #1e1e2e' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#111119', borderBottom: '2px solid #1e1e2e' }}>
                  {['Company', 'Org Type', 'Industry', 'Based In', 'Associated Contact', 'Website'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 300).map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #0f0f1a', background: i % 2 === 0 ? 'transparent' : '#0a0a12' }}>
                    <td style={{ padding: '9px 14px', color: '#e8e8f0', fontWeight: '500', whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>{c.orgType}</td>
                    <td style={{ padding: '9px 14px', color: '#6b6b85' }}>{c.industry}</td>
                    <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>{c.basedIn}</td>
                    <td style={{ padding: '9px 14px', maxWidth: '220px' }}>
                      {c.contact && <ContactCell value={c.contact} />}
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer"
                          style={{ color: PURPLE, fontSize: '12px', textDecoration: 'none' }}
                          onMouseOver={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
                        >{c.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {results.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#3a3a52', fontSize: '13px' }}>
                No contacts matched — try different keywords
              </div>
            )}

            {results.length > 300 && (
              <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#3a3a52', borderTop: '1px solid #1e1e2e', background: '#0d0d16' }}>
                Showing 300 of {results.length.toLocaleString()} — use <strong style={{ color: '#4a4a65' }}>Export CSV</strong> for the full list
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
