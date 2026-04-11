import { useState, useMemo } from 'react';

const PURPLE = '#7c6fe0';

// Map natural language to structured filter criteria
function parseQuery(q) {
  const lower = q.toLowerCase();

  const ORG_PATTERNS = [
    { words: ['journalist', 'press', 'reporter', 'editor', 'media', 'publication', 'magazine', 'newspaper', 'broadcast', 'tv', 'radio'], orgTypes: ['Media'] },
    { words: ['investor', 'vc', 'venture', 'fund', 'capital', 'angel', 'family office', 'high-net-worth', 'hnw', 'lp'], orgTypes: ['Investor', 'Family Office', 'High-Net-Worth Individual'] },
    { words: ['event organizer', 'event organiser', 'conference organizer', 'event'], orgTypes: ['Event Organizer'] },
    { words: ['startup', 'founder', 'early-stage', 'early stage'], orgTypes: ['Product Startup'] },
    { words: ['scaleup', 'scale-up'], orgTypes: ['Product Scaleup'] },
    { words: ['accelerator', 'incubator'], orgTypes: ['Accelerator/ Incubator'] },
    { words: ['corporate', 'corporation', 'enterprise', 'bank'], orgTypes: ['Corporation', 'Bank'] },
    { words: ['ngo', 'non-profit', 'nonprofit', 'civil society'], orgTypes: ['NGO'] },
    { words: ['service provider', 'consultant', 'agency', 'advisory'], orgTypes: ['Service Provider'] },
    { words: ['policymaker', 'government', 'ministry', 'public sector'], orgTypes: ['Policymaker/ Public Sector Agency'] },
    { words: ['research', 'university', 'academic', 'think tank'], orgTypes: ['Research'] },
  ];

  const LOCATION_MAP = {
    'uae': ['UAE', 'United Arab Emirates'], 'dubai': ['UAE', 'United Arab Emirates'],
    'abu dhabi': ['UAE', 'United Arab Emirates'], 'mena': ['MENA'],
    'germany': ['Germany'], 'austria': ['Austria'], 'switzerland': ['Switzerland'],
    'dach': ['Germany', 'Austria', 'Switzerland'],
    'poland': ['Poland'], 'romania': ['Romania'], 'bulgaria': ['Bulgaria'],
    'greece': ['Greece'], 'czechia': ['Czechia'], 'hungary': ['Hungary'],
    'croatia': ['Croatia'], 'serbia': ['Serbia'], 'slovakia': ['Slovakia'],
    'albania': ['Albania'], 'ukraine': ['Ukraine'], 'estonia': ['Estonia'],
    'cee': ['Bulgaria', 'Romania', 'Poland', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Serbia', 'Slovakia', 'Albania'],
    'us': ['United States'], 'usa': ['United States'], 'united states': ['United States'],
    'uk': ['United Kingdom'], 'united kingdom': ['United Kingdom'],
    'france': ['France'], 'italy': ['Italy'], 'spain': ['Spain'],
    'netherlands': ['The Netherlands'], 'belgium': ['Belgium'],
    'portugal': ['Portugal'], 'ireland': ['Ireland'],
  };

  const orgTypes = [];
  for (const p of ORG_PATTERNS) {
    if (p.words.some(w => lower.includes(w))) orgTypes.push(...p.orgTypes);
  }

  const locations = [];
  for (const [key, vals] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) locations.push(...vals);
  }

  return { orgTypes: [...new Set(orgTypes)], locations: [...new Set(locations)], raw: lower };
}

function filterContacts(contacts, query) {
  if (!query.trim()) return contacts;
  const { orgTypes, locations, raw } = parseQuery(query);

  return contacts.filter(c => {
    const orgType = (c.orgType || '').toLowerCase();
    const industry = (c.industry || '').toLowerCase();
    const basedIn = (c.basedIn || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const website = (c.website || '').toLowerCase();

    const orgMatch = orgTypes.length === 0 || orgTypes.some(ot => orgType.includes(ot.toLowerCase()));
    const locMatch = locations.length === 0 || locations.some(l => basedIn.toLowerCase().includes(l.toLowerCase()));

    // If no structured matches found, fall back to raw keyword search across all fields
    if (orgTypes.length === 0 && locations.length === 0) {
      return [name, orgType, industry, basedIn, website].some(f => f.includes(raw));
    }

    return orgMatch && locMatch;
  });
}

function exportCSV(contacts, query) {
  const headers = ['Company', 'Org Type', 'Industry', 'Based In', 'Website'];
  const rows = contacts.map(c =>
    [c.name, c.orgType, c.industry, c.basedIn, c.website]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seti-${query ? query.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'all'}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const SUGGESTIONS = [
  'all investors', 'journalists in Germany', 'event organizers in CEE',
  'startups in Poland', 'investors in UAE', 'media contacts in DACH',
  'service providers', 'accelerators', 'corporates in United States',
];

export default function Admin({ contacts, loading }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => filterContacts(contacts, query), [contacts, query]);
  const { orgTypes, locations } = useMemo(() => parseQuery(query), [query]);

  return (
    <div style={{ padding: '32px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          SETI Internal ·
        </span>
        <span style={{ fontSize: '11px', color: '#3a3a52' }}> not for sharing</span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.5px', marginTop: '6px', marginBottom: '4px' }}>
          Contact Database
        </h1>
        <p style={{ fontSize: '13px', color: '#4a4a65' }}>
          {loading ? 'Loading…' : `${contacts.length.toLocaleString()} contacts`}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g. "journalists in Germany" · "all investors" · "event organizers in CEE"'
          autoFocus
          style={{
            flex: 1, padding: '13px 16px',
            background: '#111119',
            border: `1.5px solid ${PURPLE}`,
            borderRadius: '10px', fontSize: '14px', color: '#e8e8f0',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => exportCSV(results, query)}
          style={{
            padding: '13px 20px', background: results.length ? '#1a1a2e' : '#111119',
            color: results.length ? '#c4befc' : '#3a3a52',
            border: `1px solid ${results.length ? PURPLE : '#1e1e2e'}`,
            borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            cursor: results.length ? 'pointer' : 'default', whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          Export CSV ({results.length.toLocaleString()})
        </button>
      </div>

      {/* Suggestions */}
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQuery(s)}
              style={{
                padding: '5px 12px', background: 'transparent',
                border: '1px solid #1e1e2e', borderRadius: '20px',
                fontSize: '12px', color: '#4a4a65', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = '#c4befc'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#4a4a65'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Active filters */}
      {query && (orgTypes.length > 0 || locations.length > 0) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {orgTypes.map(ot => (
            <span key={ot} style={{ fontSize: '11px', padding: '3px 10px', background: `${PURPLE}20`, border: `1px solid ${PURPLE}40`, borderRadius: '20px', color: '#c4befc', fontWeight: '600' }}>
              {ot}
            </span>
          ))}
          {locations.map(l => (
            <span key={l} style={{ fontSize: '11px', padding: '3px 10px', background: '#17172a', border: '1px solid #252535', borderRadius: '20px', color: '#6b6b85' }}>
              📍 {l}
            </span>
          ))}
          <span style={{ fontSize: '11px', color: '#3a3a52', alignSelf: 'center' }}>
            → {results.length.toLocaleString()} results
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #1e1e2e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#111119', borderBottom: '2px solid #1e1e2e' }}>
              {['Company', 'Org Type', 'Industry', 'Based In', 'Website'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontSize: '10px', fontWeight: '700', color: '#4a4a65',
                  textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 300).map((c, i) => (
              <tr key={c.id} style={{
                borderBottom: '1px solid #0f0f1a',
                background: i % 2 === 0 ? 'transparent' : '#0a0a12',
              }}>
                <td style={{ padding: '9px 14px', color: '#e8e8f0', fontWeight: '500', whiteSpace: 'nowrap' }}>{c.name}</td>
                <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>{c.orgType}</td>
                <td style={{ padding: '9px 14px', color: '#6b6b85' }}>{c.industry}</td>
                <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>{c.basedIn}</td>
                <td style={{ padding: '9px 14px' }}>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer"
                      style={{ color: PURPLE, fontSize: '12px', textDecoration: 'none' }}
                      onMouseOver={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {c.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {results.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#3a3a52', fontSize: '13px' }}>
            No contacts matched "{query}"
          </div>
        )}

        {results.length > 300 && (
          <div style={{
            padding: '12px 16px', textAlign: 'center',
            fontSize: '12px', color: '#3a3a52',
            borderTop: '1px solid #1e1e2e', background: '#0d0d16',
          }}>
            Showing 300 of {results.length.toLocaleString()} — use <strong style={{ color: '#4a4a65' }}>Export CSV</strong> to get the full list
          </div>
        )}
      </div>
    </div>
  );
}
